/**
 * Kling.ai Video Generation Service
 * Integrates with Kling API for AI video generation
 */

export interface KlingVideoRequest {
  prompt: string;
  model: "kling-2.5-turbo" | "kling-2.6-motion" | "kling-o1";
  duration?: number; // seconds
  aspectRatio?: "16:9" | "9:16" | "1:1";
  cameraPath?: "tracking" | "static" | "orbit" | "crane";
  motionReference?: string; // URL for 2.6 motion transfer
  audioGeneration?: boolean; // O1 only
  resolution?: "720p" | "1080p" | "4k";
}

export interface KlingVideoResponse {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  thumbnailUrl?: string;
  estimatedTime?: number; // seconds
  error?: string;
}

export interface PromptAnalysis {
  subject: string | null;
  action: string | null;
  environment: string | null;
  cameraMotion: string | null;
  style: string | null;
  quality: "excellent" | "good" | "needs-improvement";
  suggestions: string[];
}

export class KlingVideoService {
  private apiKey: string;
  private baseUrl = "https://api.kling.ai/v1"; // Placeholder - update with actual endpoint

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Analyze and optimize a video prompt based on Kling best practices
   */
  analyzePrompt(prompt: string, model: KlingVideoRequest["model"]): PromptAnalysis {
    const suggestions: string[] = [];
    let quality: PromptAnalysis["quality"] = "excellent";

    // Extract components
    const subject = this.extractSubject(prompt);
    const action = this.extractAction(prompt);
    const environment = this.extractEnvironment(prompt);
    const cameraMotion = this.extractCameraMotion(prompt);
    const style = this.extractStyle(prompt);

    // Quality checks
    if (!subject) {
      suggestions.push("❌ Add a clear subject (who/what is the focus?)");
      quality = "needs-improvement";
    }

    if (!action) {
      suggestions.push("❌ Include a specific action verb (e.g., 'walking', 'throwing')");
      quality = "needs-improvement";
    }

    if (!cameraMotion && model === "kling-2.6-motion") {
      suggestions.push("⚠️ 2.6 Motion works best with camera path specified");
      if (quality === "excellent") quality = "good";
    }

    if (!environment) {
      suggestions.push("💡 Add environment details for better context");
      if (quality === "excellent") quality = "good";
    }

    if (prompt.length < 20) {
      suggestions.push("⚠️ Prompt is too short - add more descriptive details");
      quality = "needs-improvement";
    }

    if (prompt.length > 300 && model === "kling-2.5-turbo") {
      suggestions.push("⚠️ 2.5 Turbo works best with concise prompts (<100 words)");
      if (quality === "excellent") quality = "good";
    }

    return {
      subject,
      action,
      environment,
      cameraMotion,
      style,
      quality,
      suggestions,
    };
  }

  /**
   * Generate optimized prompt based on template and model
   */
  optimizePrompt(userInput: string, model: KlingVideoRequest["model"]): string {
    const analysis = this.analyzePrompt(userInput, model);
    
    // Model-specific optimization
    switch (model) {
      case "kling-2.6-motion":
        return this.optimize26Motion(userInput, analysis);
      case "kling-o1":
        return this.optimizeO1(userInput, analysis);
      case "kling-2.5-turbo":
        return this.optimize25Turbo(userInput, analysis);
      default:
        return userInput;
    }
  }

  /**
   * Submit video generation request
   */
  async generateVideo(request: KlingVideoRequest): Promise<KlingVideoResponse> {
    // Optimize prompt first
    const optimizedPrompt = this.optimizePrompt(request.prompt, request.model);

    // TODO: Actual API integration
    // For now, return mock response
    return {
      jobId: `kling_${Date.now()}`,
      status: "queued",
      estimatedTime: request.duration || 10,
    };
  }

  /**
   * Check status of video generation job
   */
  async checkStatus(jobId: string): Promise<KlingVideoResponse> {
    // TODO: Actual API integration
    return {
      jobId,
      status: "processing",
      estimatedTime: 30,
    };
  }

  // Private helper methods
  private extractSubject(prompt: string): string | null {
    // Simple extraction - look for nouns before verbs
    const match = prompt.match(/^([^,]+)/);
    return match ? match[1].trim() : null;
  }

  private extractAction(prompt: string): string | null {
    const actionVerbs = ["walking", "running", "jumping", "throwing", "performing", "dancing", "flying"];
    for (const verb of actionVerbs) {
      if (prompt.toLowerCase().includes(verb)) {
        return verb;
      }
    }
    return null;
  }

  private extractEnvironment(prompt: string): string | null {
    const envKeywords = ["in", "at", "on", "inside", "outside"];
    for (const keyword of envKeywords) {
      const regex = new RegExp(`${keyword}\\s+([^,]+)`, "i");
      const match = prompt.match(regex);
      if (match) return match[1].trim();
    }
    return null;
  }

  private extractCameraMotion(prompt: string): string | null {
    const cameras = ["tracking", "static", "orbit", "crane", "handheld", "dolly"];
    for (const cam of cameras) {
      if (prompt.toLowerCase().includes(cam)) {
        return cam;
      }
    }
    return null;
  }

  private extractStyle(prompt: string): string | null {
    const styles = ["cinematic", "documentary", "commercial", "slow motion", "time-lapse"];
    for (const style of styles) {
      if (prompt.toLowerCase().includes(style)) {
        return style;
      }
    }
    return null;
  }

  private optimize26Motion(prompt: string, analysis: PromptAnalysis): string {
    let optimized = prompt;
    
    if (!analysis.cameraMotion) {
      optimized += ", smooth tracking camera";
    }
    
    if (!analysis.style) {
      optimized += ", cinematic quality";
    }

    return optimized;
  }

  private optimizeO1(prompt: string, analysis: PromptAnalysis): string {
    let optimized = prompt;
    
    if (!prompt.includes("ambient") && !prompt.includes("audio")) {
      optimized += ", with natural ambient audio";
    }

    return optimized;
  }

  private optimize25Turbo(prompt: string, analysis: PromptAnalysis): string {
    // Keep it simple and concise for Turbo
    const core = `${analysis.subject} ${analysis.action}`;
    return core + (analysis.style ? `, ${analysis.style}` : "");
  }
}

// Singleton instance (will be initialized with API key from env)
export const klingVideo = new KlingVideoService(process.env.KLING_API_KEY || "");
