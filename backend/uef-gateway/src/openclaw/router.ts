/**
 * OpenClaw Channel Router
 * Handles incoming messages from OpenClaw Gateway
 */

import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { ACPStandardizedRequest, ACPResponse } from '../acp/types';

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
}

/**
 * POST /api/channel/openclaw
 * Receives messages from OpenClaw Gateway and routes them through ACHEEVY
 */
openclawRouter.post('/openclaw', async (req: Request, res: Response) => {
  try {
    const message: OpenClawMessage = req.body;

    console.log(`[OpenClaw] Received message from ${message.channel}:`, {
      sender: message.sender.name || message.sender.id,
      content: message.content.text?.substring(0, 100),
    });

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

    // Create ACP request from OpenClaw message
    const acpRequest: ACPStandardizedRequest = {
      reqId: uuid(),
      userId: message.sender.id,
      sessionId: message.conversationId || uuid(),
      timestamp: message.timestamp || new Date().toISOString(),
      intent: 'CHAT',
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

    // TODO: Route through ACHEEVY orchestrator
    // For now, return a placeholder response
    const reply = `Hello ${message.sender.name || 'there'}! I received your message from ${message.channel}. ACHEEVY is processing your request: "${message.content.text.substring(0, 50)}..."`;

    const response: OpenClawResponse = {
      id: uuid(),
      reply,
      channel: message.channel,
      targetId: message.sender.id,
      status: 'success',
    };

    console.log(`[OpenClaw] Sending reply to ${message.channel}:`, response.reply.substring(0, 100));

    res.json(response);
  } catch (error) {
    console.error('[OpenClaw] Error processing message:', error);
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
openclawRouter.get('/openclaw/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'openclaw-integration',
    timestamp: new Date().toISOString(),
    supportedChannels: ['whatsapp', 'telegram', 'slack', 'discord', 'signal', 'imessage', 'webchat'],
  });
});

export default openclawRouter;
