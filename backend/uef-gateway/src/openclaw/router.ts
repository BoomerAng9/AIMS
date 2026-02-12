/**
 * OpenClaw Channel Router
 * Handles incoming messages from OpenClaw Gateway
 *
 * Flow: OpenClaw (sandbox) → Agent Bridge → UEF Gateway → this router
 *       → LLM Gateway (for CHAT) or A2A Task Manager (for complex intents)
 *       → response back through the same chain
 */

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { ACPStandardizedRequest } from '../acp/types';
import { llmGateway } from '../llm/gateway';
import { taskManager } from '../a2a/task-manager';
import logger from '../logger';

export const openclawRouter = Router();

interface OpenClawMessage {
  id: string;
  channel: 'whatsapp' | 'telegram' | 'slack' | 'discord' | 'signal' | 'imessage' | 'webchat';
  sender: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  content: {
    text: string;
    attachments?: Array<{
      type: 'image' | 'audio' | 'video' | 'file';
      url: string;
      mimeType?: string;
    }>;
  };
  timestamp: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

interface OpenClawResponse {
  id: string;
  reply: string;
  channel: string;
  targetId: string;
  status: 'success' | 'error';
  metadata?: Record<string, unknown>;
}

/**
 * Classify intent from message text.
 * Simple keyword-based classification — upgraded when ACHEEVY orchestrator is fully wired.
 */
function classifyIntent(text: string): ACPStandardizedRequest['intent'] {
  const lower = text.toLowerCase();
  if (/\b(build|create|scaffold|deploy|launch|spin up)\b/.test(lower)) return 'BUILD_PLUG';
  if (/\b(research|analyze|investigate|report|market)\b/.test(lower)) return 'RESEARCH';
  if (/\b(workflow|automate|pipeline|sequence)\b/.test(lower)) return 'AGENTIC_WORKFLOW';
  if (/\b(how much|cost|estimate|price|quote)\b/.test(lower)) return 'ESTIMATE_ONLY';
  return 'CHAT';
}

/**
 * POST /api/channel/openclaw
 * Receives messages from OpenClaw Gateway and routes them through ACHEEVY
 */
openclawRouter.post('/openclaw', async (req: Request, res: Response) => {
  try {
    const message: OpenClawMessage = req.body;

    logger.info({
      channel: message.channel,
      sender: message.sender.name || message.sender.id,
      text: message.content.text?.substring(0, 100),
    }, '[OpenClaw] Received message');

    // Map OpenClaw channel to ACP channel type
    const channelMap: Record<string, ACPStandardizedRequest['channel']> = {
      whatsapp: 'WHATSAPP',
      telegram: 'TELEGRAM',
      slack: 'SLACK',
      discord: 'DISCORD',
      signal: 'OPENCLAW',
      imessage: 'OPENCLAW',
      webchat: 'WEB',
    };

    const intent = classifyIntent(message.content.text);

    // Create ACP request from OpenClaw message
    const acpRequest: ACPStandardizedRequest = {
      reqId: uuid(),
      userId: message.sender.id,
      sessionId: message.conversationId || uuid(),
      timestamp: message.timestamp || new Date().toISOString(),
      intent,
      naturalLanguage: message.content.text,
      channel: channelMap[message.channel] || 'OPENCLAW',
      metadata: {
        source: 'openclaw',
        originalChannel: message.channel,
        senderName: message.sender.name,
        senderPhone: message.sender.phone,
        attachments: message.content.attachments,
        ...message.metadata,
      },
    };

    logger.info({ reqId: acpRequest.reqId, intent, channel: acpRequest.channel }, '[OpenClaw] Classified intent');

    let reply: string;
    let responseMetadata: Record<string, unknown> = {};

    if (intent === 'CHAT') {
      // Direct LLM chat — fast path through the unified gateway
      const senderName = message.sender.name || 'User';
      const result = await llmGateway.chat({
        model: 'claude-sonnet-4.5',
        messages: [
          {
            role: 'system',
            content: `You are ACHEEVY, the AI assistant for A.I.M.S. (AI Managed Solutions). You are responding via ${message.channel}. The user's name is ${senderName}. Be helpful, concise, and professional. Keep responses under 500 words since this is a messaging channel.`,
          },
          { role: 'user', content: message.content.text },
        ],
        agentId: 'acheevy-openclaw',
        userId: message.sender.id,
        sessionId: acpRequest.sessionId,
      });

      reply = result.content;
      responseMetadata = {
        provider: result.provider,
        model: result.model,
        tokens: result.tokens.total,
        cost: result.cost.usd,
      };
    } else {
      // Complex intent — dispatch through A2A task manager
      const capabilityMap: Record<string, string> = {
        BUILD_PLUG: 'code-generation',
        RESEARCH: 'market-research',
        AGENTIC_WORKFLOW: 'pipeline-execution',
        ESTIMATE_ONLY: 'intent-classification',
      };

      const task = await taskManager.send({
        capability: capabilityMap[intent] || 'intent-classification',
        message: {
          role: 'user',
          parts: [{ type: 'text', text: message.content.text }],
        },
        requestedBy: `openclaw:${message.channel}:${message.sender.id}`,
      });

      // Wait for task completion (with 30s timeout)
      reply = await new Promise<string>((resolve) => {
        let result = '';
        const timeout = setTimeout(() => {
          resolve(result || `Your ${intent.toLowerCase().replace('_', ' ')} request has been queued (Task ID: ${task.id}). You'll be notified when it's complete.`);
        }, 30_000);

        taskManager.subscribe(task.id, (event) => {
          if (event.type === 'message' && 'message' in event) {
            const textParts = event.message.parts
              .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
              .map(p => p.text);
            result = textParts.join('\n');
          }
          if (event.type === 'done') {
            clearTimeout(timeout);
            resolve(result || `Task completed (ID: ${task.id}).`);
          }
        });
      });

      responseMetadata = { taskId: task.id, intent, agentId: task.agentId };
    }

    const response: OpenClawResponse = {
      id: uuid(),
      reply,
      channel: message.channel,
      targetId: message.sender.id,
      status: 'success',
      metadata: responseMetadata,
    };

    logger.info({
      channel: message.channel,
      replyLength: reply.length,
      intent,
    }, '[OpenClaw] Sending reply');

    res.json(response);
  } catch (error) {
    logger.error({ err: error }, '[OpenClaw] Error processing message');
    res.status(500).json({
      id: uuid(),
      reply: 'Sorry, there was an error processing your message. Please try again.',
      channel: req.body?.channel || 'unknown',
      targetId: req.body?.sender?.id || 'unknown',
      status: 'error',
    });
  }
});

/**
 * GET /api/channel/openclaw/health
 * Health check endpoint for OpenClaw integration
 */
openclawRouter.get('/openclaw/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'openclaw-integration',
    llmConfigured: llmGateway.isConfigured(),
    timestamp: new Date().toISOString(),
    supportedChannels: ['whatsapp', 'telegram', 'slack', 'discord', 'signal', 'imessage', 'webchat'],
  });
});

export default openclawRouter;
