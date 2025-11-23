import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../db/client';

const router = Router();

// Allowed file types (moderate restrictions)
const ALLOWED_MIME_TYPES = [
  // Text files
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/css',
  'text/xml',
  'application/json',
  'application/xml',
  'application/x-yaml',
  'text/yaml',

  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

  // Code files
  'application/javascript',
  'application/typescript',
  'text/javascript',
  'text/x-python',
  'application/x-python',
  'text/x-sh',
  'application/x-sh',
  'application/sql',

  // Images
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/gif',
  'image/webp',
];

const ALLOWED_EXTENSIONS = [
  '.txt', '.md', '.json', '.csv', '.log', '.yml', '.yaml', '.xml',
  '.pdf', '.docx',
  '.py', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.sh', '.sql',
  '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const conversationId = req.body.conversationId;
    const isGlobal = req.body.isGlobal === 'true';

    const uploadDir = path.join(
      '/app/workspace/.rigger-uploads',
      isGlobal ? 'global' : `conv-${conversationId || 'temp'}`
    );

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueId = uuidv4().slice(0, 8);
    cb(null, `${basename}-${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // Check extension
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File type ${ext} not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }

    // Check MIME type if available
    if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      // Allow unknown MIME types if extension is valid
      console.warn(`Unknown MIME type ${file.mimetype} for ${file.originalname}, allowing based on extension`);
    }

    cb(null, true);
  },
});

// Upload file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      conversationId,
      isGlobal = 'false',
      integrationMethod = 'working-directory',
      description = '',
    } = req.body;

    // Validate scope
    const globalFlag = isGlobal === 'true';
    if (!globalFlag && !conversationId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'conversationId required for non-global files' });
    }

    // Read content preview for small text files
    let contentPreview = null;
    if (req.file.size < 100000 && req.file.mimetype?.startsWith('text/')) {
      try {
        const content = fs.readFileSync(req.file.path, 'utf-8');
        contentPreview = content.substring(0, 1000);
      } catch (err) {
        console.warn('Failed to read file content for preview:', err);
      }
    }

    // Insert into database
    const result = await pool.query(
      `INSERT INTO uploaded_files (
        filename, original_filename, file_path, mime_type, file_size_bytes,
        is_global, conversation_id, integration_method, description, content_preview
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.path,
        req.file.mimetype,
        req.file.size,
        globalFlag,
        globalFlag ? null : parseInt(conversationId),
        integrationMethod,
        description || null,
        contentPreview,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    // Clean up file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Failed to clean up file:', unlinkErr);
      }
    }

    console.error('Error uploading file:', error);
    if (error.message.includes('not allowed')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all files (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { conversationId, globalOnly, enabledOnly } = req.query;

    let query = 'SELECT * FROM uploaded_files WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (globalOnly === 'true') {
      query += ' AND is_global = TRUE';
    } else if (conversationId) {
      query += ` AND (is_global = TRUE OR conversation_id = $${paramCount})`;
      params.push(parseInt(conversationId as string));
      paramCount++;
    }

    if (enabledOnly === 'true') {
      query += ' AND enabled = TRUE';
    }

    query += ' ORDER BY uploaded_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single file
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM uploaded_files WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update file metadata
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled, integrationMethod, description } = req.body;

    const result = await pool.query(
      `UPDATE uploaded_files
       SET enabled = COALESCE($1, enabled),
           integration_method = COALESCE($2, integration_method),
           description = COALESCE($3, description)
       WHERE id = $4
       RETURNING *`,
      [enabled, integrationMethod, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get file info first
    const fileResult = await pool.query(
      'SELECT file_path FROM uploaded_files WHERE id = $1',
      [id]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = fileResult.rows[0].file_path;

    // Delete from database
    await pool.query('DELETE FROM uploaded_files WHERE id = $1', [id]);

    // Delete from filesystem
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsErr) {
      console.error('Failed to delete file from filesystem:', fsErr);
      // Continue anyway - database record is deleted
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download file
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT file_path, original_filename, mime_type FROM uploaded_files WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { file_path, original_filename, mime_type } = result.rows[0];

    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'File not found on filesystem' });
    }

    // Update access tracking
    await pool.query(
      `UPDATE uploaded_files
       SET last_accessed_at = CURRENT_TIMESTAMP,
           access_count = access_count + 1
       WHERE id = $1`,
      [id]
    );

    res.setHeader('Content-Type', mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${original_filename}"`);
    res.sendFile(file_path);
  } catch (error: any) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
