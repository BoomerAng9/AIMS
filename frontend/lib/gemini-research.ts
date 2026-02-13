import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ResearchOutput {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
}

/**
 * Gemini Deep Research Integration
 * Uses the deep-research-pro-preview model to generate comprehensive research reports
 */
export class GeminiDeepResearch {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.0-flash"
    });
  }

  /**
   * Run a deep research query and stream results
   */
  async research(prompt: string, onUpdate?: (chunk: string) => void): Promise<ResearchOutput> {
    const result = await this.model.generateContentStream(prompt);
    
    let fullText = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      if (onUpdate) {
        onUpdate(chunkText);
      }
    }

    // Parse the research output
    return this.parseResearchOutput(fullText);
  }

  /**
   * Parse raw research output into structured format
   */
  private parseResearchOutput(text: string): ResearchOutput {
    const lines = text.split("\n");
    const sections: Array<{ heading: string; content: string }> = [];
    let currentSection: { heading: string; content: string } | null = null;
    let title = "Research Report";
    let summary = "";

    for (const line of lines) {
      // Extract title (usually first heading)
      if (line.startsWith("# ") && title === "Research Report") {
        title = line.replace("# ", "").trim();
      }
      // Extract sections
      else if (line.startsWith("## ")) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          heading: line.replace("## ", "").trim(),
          content: "",
        };
      }
      // Collect section content
      else if (currentSection) {
        currentSection.content += line + "\n";
      }
      // Extract summary (first paragraph after title)
      else if (!summary && line.trim() && !line.startsWith("#")) {
        summary += line + " ";
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return {
      title,
      summary: summary.trim(),
      sections,
    };
  }

  /**
   * Generate a video script from research output
   */
  async generateVideoScript(research: ResearchOutput): Promise<string> {
    const scriptPrompt = `
Based on this research report, create a concise video script (60-90 seconds) for a Remotion composition:

Title: ${research.title}
Summary: ${research.summary}

Key Points:
${research.sections.map((s) => `- ${s.heading}`).join("\n")}

Format the script as:
[Scene 1: Intro]
... narration text ...

[Scene 2: Key Point 1]
... narration text ...

etc.
    `;

    const result = await this.model.generateContent(scriptPrompt);
    return result.response.text();
  }
}

export const geminiResearch = new GeminiDeepResearch();
