/**
 * Groq Service - Fast LLM Inference
 * Best for: Real-time chat, quick responses
 */

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class GroqService {
  /**
   * Chat completion with Groq
   * Default model: llama-3.3-70b-versatile (fast and capable)
   */
  async chat(
    messages: GroqChatMessage[],
    options: GroqChatOptions = {}
  ): Promise<string> {
    const {
      model = "llama-3.3-70b-versatile",
      temperature = 0.7,
      maxTokens = 8000,
    } = options;

    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content || "";
  }

  /**
   * Stream chat completion
   */
  async *chatStream(
    messages: GroqChatMessage[],
    options: GroqChatOptions = {}
  ): AsyncGenerator<string> {
    const {
      model = "llama-3.3-70b-versatile",
      temperature = 0.7,
      maxTokens = 8000,
    } = options;

    const stream = await groq.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Quick response helper - single user message
   */
  async quickResponse(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: GroqChatMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    messages.push({ role: "user", content: prompt });
    
    return this.chat(messages);
  }
}

export const groqService = new GroqService();
