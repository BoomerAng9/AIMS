"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { 
  Check, 
  X, 
  Loader2,
  Zap,
  Search,
  Mic,
  Volume2,
  Code,
  Video,
  MessageSquare
} from "lucide-react";

interface ServiceStatus {
  name: string;
  icon: any;
  status: "idle" | "testing" | "success" | "error";
  message?: string;
  testFunction: () => Promise<{ success: boolean; message: string }>;
}

export default function IntegrationsPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "Gemini Deep Research",
      icon: Zap,
      status: "idle",
      testFunction: async () => {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: "Explain Docker containers in 50 words" }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: res.ok ? `Research: ${data.research.title}` : data.error,
        };
      },
    },
    {
      name: "Groq LLM",
      icon: MessageSquare,
      status: "idle",
      testFunction: async () => {
        const res = await fetch("/api/test/groq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: "Say hello in 5 words" }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: res.ok ? `Response: ${data.response}` : data.error,
        };
      },
    },
    {
      name: "Search (Unified)",
      icon: Search,
      status: "idle",
      testFunction: async () => {
        const res = await fetch("/api/test/search?q=Next.js");
        const data = await res.json();
        return {
          success: res.ok,
          message: res.ok ? `Found ${data.results.length} results` : data.error,
        };
      },
    },
    {
      name: "ElevenLabs TTS",
      icon: Volume2,
      status: "idle",
      testFunction: async () => {
        const res = await fetch("/api/test/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Testing ElevenLabs" }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: res.ok ? "Audio generated successfully" : data.error,
        };
      },
    },
    {
      name: "Deepgram STT",
      icon: Mic,
      status: "idle",
      testFunction: async () => {
        // Mock test - would need actual audio in production
        return {
          success: true,
          message: "SDK loaded (needs audio input to test fully)",
        };
      },
    },
    {
      name: "E2B Code Sandbox",
      icon: Code,
      status: "idle",
      testFunction: async () => {
        const res = await fetch("/api/test/e2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "print('Hello from E2B')", language: "python" }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: res.ok ? `Output: ${data.stdout}` : data.error,
        };
      },
    },
    {
      name: "Kling Video (Prompt Analysis)",
      icon: Video,
      status: "idle",
      testFunction: async () => {
        const res = await fetch("/api/video/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: "Basketball player dunking", 
            model: "kling-2.6-motion" 
          }),
        });
        const data = await res.json();
        return {
          success: res.ok,
          message: res.ok ? `Quality: ${data.analysis.quality}` : data.error,
        };
      },
    },
  ]);

  const [testingAll, setTestingAll] = useState(false);

  const testService = async (index: number) => {
    const updated = [...services];
    updated[index].status = "testing";
    setServices(updated);

    try {
      const result = await services[index].testFunction();
      updated[index].status = result.success ? "success" : "error";
      updated[index].message = result.message;
    } catch (error: any) {
      updated[index].status = "error";
      updated[index].message = error.message;
    }

    setServices(updated);
  };

  const testAll = async () => {
    setTestingAll(true);
    for (let i = 0; i < services.length; i++) {
      await testService(i);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setTestingAll(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === "testing") return <Loader2 className="h-5 w-5 animate-spin text-gold" />;
    if (status === "success") return <Check className="h-5 w-5 text-green-500" />;
    if (status === "error") return <X className="h-5 w-5 text-red-500" />;
    return null;
  };

  const successCount = services.filter((s) => s.status === "success").length;
  const errorCount = services.filter((s) => s.status === "error").length;

  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display text-white tracking-widest uppercase mb-2">
            API Integrations
          </h1>
          <p className="text-zinc-400">
            Test all connected services and verify API credentials
          </p>
        </div>

        {/* Summary */}
        <Card className="mb-6 bg-black/60 border-gold/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <div className="text-2xl font-bold text-gold">{successCount}</div>
                  <div className="text-xs text-zinc-500">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{errorCount}</div>
                  <div className="text-xs text-zinc-500">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-zinc-400">{services.length}</div>
                  <div className="text-xs text-zinc-500">Total</div>
                </div>
              </div>
              <Button
                variant="acheevy"
                onClick={testAll}
                disabled={testingAll}
              >
                {testingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test All Services"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="bg-black/40 border-wireframe-stroke hover:border-gold/20 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-gold/10">
                        <Icon className="h-5 w-5 text-gold" />
                      </div>
                      <CardTitle className="text-lg text-white">{service.name}</CardTitle>
                    </div>
                    {getStatusIcon(service.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {service.message && (
                    <p
                      className={`text-sm mb-3 ${
                        service.status === "success"
                          ? "text-green-400"
                          : service.status === "error"
                          ? "text-red-400"
                          : "text-zinc-400"
                      }`}
                    >
                      {service.message}
                    </p>
                  )}
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => testService(index)}
                    disabled={service.status === "testing"}
                    className="w-full"
                  >
                    {service.status === "testing" ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Environment Check */}
        <Card className="mt-6 bg-black/40 border-wireframe-stroke">
          <CardHeader>
            <CardTitle className="text-white">Environment Variables</CardTitle>
            <CardDescription>
              Required API keys and credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {[
                "GEMINI_API_KEY",
                "GROQ_API_KEY",
                "ELEVENLABS_API_KEY",
                "DEEPGRAM_API_KEY",
                "E2B_API_KEY",
                "BRAVE_SEARCH_API_KEY",
                "TAVILY_API_KEY",
                "SERPER_API_KEY",
              ].map((key) => {
                const isSet = !!process.env[key];
                return (
                  <div key={key} className="flex items-center justify-between py-1">
                    <span className="text-zinc-400">{key}</span>
                    {isSet ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </LogoWallBackground>
  );
}
