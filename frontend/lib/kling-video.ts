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

interface KlingApiTaskResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    task_status: string;
    task_result?: {
      videos: Array<{
        url: string;
        duration: string;
      }>;
    };
  };
}

export class KlingVideoService {
  private apiKey: string;
  private baseUrl = "https://api.klingai.com/v1";

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

    try {
      if (!this.apiKey) {
        // Fallback for development if no key is present, to avoid breaking the UI flow
        // But log a warning clearly.
        if (process.env.NODE_ENV === 'development') {
           console.warn("Kling API key is missing. Returning mock response for development.");
           return {
             jobId: `mock_kling_${Date.now()}`,
             status: "queued",
             estimatedTime: request.duration || 10,
           };
        }
        throw new Error("Kling API key is missing");
      }

      const payload: any = {
        model_name: request.model,
        prompt: optimizedPrompt,
        ratio: request.aspectRatio || "16:9",
        duration: request.duration ? `${request.duration}` : "5",
      };

      const response = await fetch(`${this.baseUrl}/videos/text2video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const data: KlingApiTaskResponse = await response.json();

      if (data.code !== 0) {
        throw new Error(data.message || "Unknown API error");
      }

      return {
        jobId: data.data.task_id,
        status: "queued",
        estimatedTime: request.duration || 10,
      };

    } catch (error: any) {
      console.error("Kling API Generation Error:", error);
      return {
        jobId: "",
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Check status of video generation job
   */
  async checkStatus(jobId: string): Promise<KlingVideoResponse> {
    try {
      if (jobId.startsWith("mock_")) {
         // Mock status check
         return {
           jobId,
           status: "completed",
           videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
           thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
         };
      }

      if (!this.apiKey) {
        throw new Error("Kling API key is missing");
      }

      const response = await fetch(`${this.baseUrl}/videos/text2video/${jobId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const data: KlingApiTaskResponse = await response.json();

      if (data.code !== 0) {
         throw new Error(data.message || "Unknown API error");
      }

      const taskStatus = data.data.task_status;
      let status: KlingVideoResponse["status"] = "processing";

      if (["succeed", "success", "completed"].includes(taskStatus)) {
        status = "completed";
      } else if (taskStatus === "failed") {
        status = "failed";
      } else if (["submitted", "queued"].includes(taskStatus)) {
        status = "queued";
      }

      // Extract video URL if completed
      let videoUrl: string | undefined;
      if (data.data.task_result?.videos && data.data.task_result.videos.length > 0) {
        videoUrl = data.data.task_result.videos[0].url;
      }

      return {
        jobId,
        status,
        videoUrl,
      };

    } catch (error: any) {
      console.error("Kling API Status Check Error:", error);
      return {
        jobId,
        status: "failed",
        error: error.message
      };
    }
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
