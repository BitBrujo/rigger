import { Router, Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

const router = Router();

// Skills directory path (Docker workspace)
const SKILLS_BASE_PATH = '/app/workspace/.claude/skills';

// Helper to parse SKILL.md frontmatter and content
async function parseSkillFile(skillPath: string, skillName: string) {
  const skillFilePath = path.join(skillPath, 'SKILL.md');

  try {
    const content = await fs.readFile(skillFilePath, 'utf-8');
    const { data, content: markdownContent } = matter(content);

    return {
      name: skillName,
      description: data.description || 'No description provided',
      allowedTools: data['allowed-tools'] || undefined,
      content: markdownContent,
      path: skillPath,
    };
  } catch (error) {
    console.error(`Error parsing skill ${skillName}:`, error);
    return null;
  }
}

// GET /api/skills - List all available skills
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check if skills directory exists
    try {
      await fs.access(SKILLS_BASE_PATH);
    } catch {
      // Skills directory doesn't exist, return empty array
      return res.json([]);
    }

    const entries = await fs.readdir(SKILLS_BASE_PATH, { withFileTypes: true });
    const skillPromises = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => parseSkillFile(path.join(SKILLS_BASE_PATH, entry.name), entry.name));

    const skills = (await Promise.all(skillPromises)).filter((skill) => skill !== null);

    res.json(skills);
  } catch (error) {
    console.error('Error listing skills:', error);
    res.status(500).json({ error: 'Failed to list skills' });
  }
});

// GET /api/skills/:name - Get specific skill details
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const skillPath = path.join(SKILLS_BASE_PATH, name);

    // Check if skill directory exists
    try {
      await fs.access(skillPath);
    } catch {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const skill = await parseSkillFile(skillPath, name);

    if (!skill) {
      return res.status(404).json({ error: 'Skill SKILL.md not found or invalid' });
    }

    res.json(skill);
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

// POST /api/skills - Create new skill
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, content, allowedTools } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'name and description are required' });
    }

    // Validate skill name (kebab-case)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      return res.status(400).json({
        error: 'Skill name must be kebab-case (lowercase letters, numbers, hyphens only)',
      });
    }

    const skillPath = path.join(SKILLS_BASE_PATH, name);

    // Check if skill already exists
    try {
      await fs.access(skillPath);
      return res.status(409).json({ error: 'Skill already exists' });
    } catch {
      // Skill doesn't exist, continue
    }

    // Ensure skills directory exists
    await fs.mkdir(SKILLS_BASE_PATH, { recursive: true });

    // Create skill directory
    await fs.mkdir(skillPath);

    // Build frontmatter
    let frontmatter = `---\ndescription: ${description}\n`;
    if (allowedTools && allowedTools.length > 0) {
      frontmatter += `allowed-tools:\n${allowedTools.map((tool: string) => `  - ${tool}`).join('\n')}\n`;
    }
    frontmatter += `---\n\n`;

    // Create SKILL.md
    const skillContent = frontmatter + (content || `# ${name}\n\n[Add skill instructions here]`);
    await fs.writeFile(path.join(skillPath, 'SKILL.md'), skillContent);

    const skill = await parseSkillFile(skillPath, name);
    res.status(201).json(skill);
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// PUT /api/skills/:name - Update existing skill
router.put('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { description, content, allowedTools } = req.body;

    const skillPath = path.join(SKILLS_BASE_PATH, name);

    // Check if skill exists
    try {
      await fs.access(skillPath);
    } catch {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const skillFilePath = path.join(skillPath, 'SKILL.md');

    // Read existing skill
    const existingContent = await fs.readFile(skillFilePath, 'utf-8');
    const { data: existingData, content: existingMarkdown } = matter(existingContent);

    // Update frontmatter
    const updatedData: any = {
      ...existingData,
      description: description !== undefined ? description : existingData.description,
    };

    if (allowedTools !== undefined) {
      if (allowedTools.length > 0) {
        updatedData['allowed-tools'] = allowedTools;
      } else {
        delete updatedData['allowed-tools'];
      }
    }

    // Update content
    const updatedMarkdown = content !== undefined ? content : existingMarkdown;

    // Rebuild SKILL.md
    const updatedContent = matter.stringify(updatedMarkdown, updatedData);
    await fs.writeFile(skillFilePath, updatedContent);

    const skill = await parseSkillFile(skillPath, name);
    res.json(skill);
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// DELETE /api/skills/:name - Delete skill
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const skillPath = path.join(SKILLS_BASE_PATH, name);

    // Check if skill exists
    try {
      await fs.access(skillPath);
    } catch {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Delete skill directory recursively
    await fs.rm(skillPath, { recursive: true, force: true });

    res.json({ message: 'Skill deleted successfully', name });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

export default router;
