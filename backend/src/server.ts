import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agentRouter from './routes/agent';
import conversationsRouter from './routes/conversations';
import presetsRouter from './routes/presets';
import analyticsRouter from './routes/analytics';
import skillsRouter from './routes/skills';
import todosRouter from './routes/todos';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API key check
app.get('/api/status', (req, res) => {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    hasApiKey,
    timestamp: new Date().toISOString()
  });
});

// Routes (Agent SDK only)
app.use('/api/agent', agentRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/presets', presetsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/todos', todosRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
