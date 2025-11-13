import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import pool from '../../db/client';

const router = Router();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Standard message endpoint
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { messages, config, conversationId } = req.body;
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: config.max_tokens || 1024,
      temperature: config.temperature,
      top_p: config.top_p,
      top_k: config.top_k,
      system: config.system,
      tools: config.tools,
      messages: messages,
    });

    const latency = Date.now() - startTime;

    // Log usage
    if (conversationId) {
      const cost = calculateCost(response.model, response.usage.input_tokens, response.usage.output_tokens);
      await pool.query(
        `INSERT INTO usage_logs (conversation_id, model, input_tokens, output_tokens, latency_ms, cost_usd, stop_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [conversationId, response.model, response.usage.input_tokens, response.usage.output_tokens, latency, cost, response.stop_reason]
      );
    }

    res.json({
      response,
      latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Agent error:', error);
    res.status(500).json({
      error: error.message,
      type: error.type,
      details: error.error,
    });
  }
});

// Streaming message endpoint
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { messages, config, conversationId } = req.body;
    const startTime = Date.now();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await anthropic.messages.stream({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: config.max_tokens || 1024,
      temperature: config.temperature,
      top_p: config.top_p,
      top_k: config.top_k,
      system: config.system,
      tools: config.tools,
      messages: messages,
    });

    let inputTokens = 0;
    let outputTokens = 0;
    let stopReason = '';

    stream.on('message', (message) => {
      res.write(`data: ${JSON.stringify({ type: 'message', data: message })}\n\n`);
      if (message.usage) {
        inputTokens = message.usage.input_tokens;
        outputTokens = message.usage.output_tokens;
      }
      if (message.stop_reason) {
        stopReason = message.stop_reason;
      }
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', data: text })}\n\n`);
    });

    stream.on('content_block_delta', (delta) => {
      res.write(`data: ${JSON.stringify({ type: 'content_block_delta', data: delta })}\n\n`);
    });

    stream.on('end', async () => {
      const latency = Date.now() - startTime;
      const finalMessage = await stream.finalMessage();

      // Log usage
      if (conversationId) {
        const cost = calculateCost(finalMessage.model, inputTokens, outputTokens);
        await pool.query(
          `INSERT INTO usage_logs (conversation_id, model, input_tokens, output_tokens, latency_ms, cost_usd, stop_reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [conversationId, finalMessage.model, inputTokens, outputTokens, latency, cost, stopReason]
        );
      }

      res.write(`data: ${JSON.stringify({ type: 'done', latency, timestamp: new Date().toISOString() })}\n\n`);
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    });

  } catch (error: any) {
    console.error('Stream setup error:', error);
    res.status(500).json({
      error: error.message,
      type: error.type,
    });
  }
});

// Helper function to calculate API costs
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Pricing as of January 2025 (per million tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
    'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
    'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  };

  const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}

export default router;
