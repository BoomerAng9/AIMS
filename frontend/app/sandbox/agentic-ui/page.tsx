"use client";

import { useState, useCallback } from "react";
import {
  ChatInput,
  Badge,
  Button,
  Toaster,
  type Tool,
  type BusinessFunction,
  type UploadedFile,
} from "agentic-ui";
import "@/lib/agentic-theme.css";

// Sample tools mapped from ACHEEVY's skill registry
const SAMPLE_TOOLS: Tool[] = [
  {
    id: "brave-search",
    name: "Brave Search",
    description: "Web search via Brave Search Pro AI",
    icon: "🔍",
  },
  {
    id: "elevenlabs-voice",
    name: "ElevenLabs Voice",
    description: "Text-to-speech with ElevenLabs",
    icon: "🎤",
  },
  {
    id: "claude-4.6",
    name: "Claude 4.6",
    description: "Route to Claude Opus/Sonnet with adaptive thinking",
    icon: "🧠",
  },
  {
    id: "stripe-billing",
    name: "Stripe Billing",
    description: "Subscription & payment management",
    icon: "💳",
  },
  {
    id: "firebase-data",
    name: "Firebase Data",
    description: "Firestore operations with tenant isolation",
    icon: "🗄️",
  },
];

const SAMPLE_FUNCTIONS: BusinessFunction[] = [
  {
    id: "deploy",
    name: "Deploy Service",
    description: "Deploy a container to the VPS",
    icon: "🚀",
    topic: "Infrastructure",
  },
  {
    id: "research",
    name: "Deep Research",
    description: "Run deep research with Gemini",
    icon: "📊",
    topic: "Analysis",
  },
  {
    id: "design",
    name: "Design Review",
    description: "Trigger Stitch design system review",
    icon: "🎨",
    topic: "Design",
  },
];

interface TestMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: Tool[];
  files?: UploadedFile[];
  timestamp: Date;
}

export default function AgenticUITestPage() {
  const [messages, setMessages] = useState<TestMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome to the Agentic UI test page. This showcases components from the agentic-ui package integrated with A.I.M.S. design tokens. Try sending a message, attaching files, or selecting tools.",
      timestamp: new Date(),
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDeepResearch, setIsDeepResearch] = useState(false);

  const handleSendMessage = useCallback(
    (
      message: string,
      files?: UploadedFile[],
      tools?: Tool[],
      businessFunction?: BusinessFunction,
      deepResearch?: boolean
    ) => {
      const userMsg: TestMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        tools,
        files,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Simulate assistant response
      setIsStreaming(true);
      setTimeout(() => {
        const parts = [];
        if (tools?.length)
          parts.push(`Tools selected: ${tools.map((t) => t.name).join(", ")}`);
        if (files?.length)
          parts.push(`Files attached: ${files.map((f) => f.name).join(", ")}`);
        if (businessFunction)
          parts.push(`Business function: ${businessFunction.name}`);
        if (deepResearch) parts.push("Deep research mode enabled");

        const assistantMsg: TestMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Received: "${message}"${parts.length ? "\n\n" + parts.join("\n") : ""}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsStreaming(false);
      }, 1000);
    },
    []
  );

  return (
    <div className="aims-agentic min-h-screen bg-obsidian text-frosty-white">
      {/* Header */}
      <header className="border-b border-wireframe-stroke/20 px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-xl font-semibold text-gold-400">
            Agentic UI Test — A.I.M.S. Integration
          </h1>
          <p className="mt-1 text-sm text-muted">
            Testing agentic-ui v0.4.0 components with A.I.M.S. design tokens
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="default">ChatInput</Badge>
            <Badge variant="default">Badge</Badge>
            <Badge variant="default">Button</Badge>
            <Badge variant="default">Tool Selection</Badge>
            <Badge variant="default">File Upload</Badge>
            <Badge variant="default">Deep Research</Badge>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="mx-auto max-w-4xl px-6 py-6">
        {/* Messages */}
        <div className="mb-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gold-500/10 border border-gold-500/20 text-frosty-white"
                    : "bg-surface-raised border border-wireframe-stroke/10 text-frosty-white"
                }`}
              >
                <div className="mb-1 text-xs text-muted">
                  {msg.role === "user" ? "You" : "ACHEEVY"} •{" "}
                  {msg.timestamp.toLocaleTimeString()}
                </div>
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                {msg.tools && msg.tools.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.tools.map((tool) => (
                      <Badge key={tool.id} variant="secondary">
                        {tool.icon} {tool.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.files.map((file) => (
                      <Badge key={file.id} variant="outline">
                        📎 {file.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-surface-raised border border-wireframe-stroke/10 px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gold-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Agentic UI ChatInput */}
        <div className="sticky bottom-0 pb-6">
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Message ACHEEVY... (try attaching files or selecting tools)"
            showAttachment={true}
            showVoice={true}
            showTools={true}
            showDeepResearch={true}
            tools={SAMPLE_TOOLS}
            businessFunctions={SAMPLE_FUNCTIONS}
            isStreaming={isStreaming}
            isDeepResearch={isDeepResearch}
            onDeepResearchChange={setIsDeepResearch}
            maxFiles={5}
            maxFileSize={10 * 1024 * 1024}
            enableSlashTools={true}
            toolsLabel="Skills"
            deepResearchLabel="Deep Research"
          />
        </div>

        {/* Component Showcase */}
        <section className="mt-12 border-t border-wireframe-stroke/20 pt-8">
          <h2 className="mb-4 text-lg font-semibold text-gold-400">
            Component Showcase
          </h2>

          {/* Buttons */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-muted">
              Button Variants
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-muted">
              Badge Variants
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Active</Badge>
              <Badge variant="secondary">Pending</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="outline">Draft</Badge>
            </div>
          </div>
        </section>
      </main>

      <Toaster />
    </div>
  );
}
