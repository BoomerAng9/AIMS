"use client";

import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Send, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";

const QUICK_TEMPLATES = [
  { label: "Estimate Build", intent: "BUILD_PLUG", message: "Build a landing page for my SaaS product" },
  { label: "Research Query", intent: "RESEARCH", message: "Research the latest trends in AI agents" },
  { label: "Chat Hello", intent: "CHAT", message: "Hello ACHEEVY, how are you today?" },
  { label: "Workflow Test", intent: "AGENTIC_WORKFLOW", message: "Create a workflow to automate my email responses" },
];

export default function LabPage() {
  const [message, setMessage] = useState("");
  const [intent, setIntent] = useState("ESTIMATE_ONLY");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sendRequest = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/acp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, intent }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: "Failed to reach ACP endpoint", details: String(error) });
    }
    setLoading(false);
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setMessage(template.message);
    setIntent(template.intent);
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
  };

  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />
      <main className="flex-1 container max-w-5xl py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-display text-white tracking-wide flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-purple-400" />
            ACP Lab
          </h1>
          <p className="text-zinc-400 text-sm">Experimental Agentic Communication Protocol request builder</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Request Builder */}
          <Card className="border-purple-500/20">
            <CardHeader>
              <CardTitle>Request Builder</CardTitle>
              <CardDescription>Craft and send ACP requests to the UEF Gateway</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Templates */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Quick Templates</label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((t) => (
                    <Button
                      key={t.label}
                      variant="glass"
                      size="sm"
                      onClick={() => applyTemplate(t)}
                      className="text-xs"
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Intent Selector */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Intent</label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="ESTIMATE_ONLY">ESTIMATE_ONLY</option>
                  <option value="BUILD_PLUG">BUILD_PLUG</option>
                  <option value="RESEARCH">RESEARCH</option>
                  <option value="AGENTIC_WORKFLOW">AGENTIC_WORKFLOW</option>
                  <option value="CHAT">CHAT</option>
                </select>
              </div>

              {/* Message Input */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Message</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what you want ACHEEVY to do..."
                  className="min-h-[120px] bg-black/50 border-white/10"
                />
              </div>

              {/* Send Button */}
              <Button
                variant="acheevy"
                onClick={sendRequest}
                disabled={loading || !message.trim()}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Response Inspector */}
          <Card className="border-white/5">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Response Inspector</CardTitle>
                {response && (
                  <Button variant="ghost" size="sm" onClick={copyResponse} className="gap-1 text-xs">
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                )}
              </div>
              <CardDescription>View the raw ACP response JSON</CardDescription>
            </CardHeader>
            <CardContent>
              {response ? (
                <pre className="bg-black/50 border border-white/10 rounded-lg p-4 overflow-auto max-h-[400px] text-xs text-zinc-300 font-mono">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="bg-black/30 border border-white/5 rounded-lg p-8 text-center">
                  <FlaskConical className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">Send a request to see the response</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </LogoWallBackground>
  );
}
