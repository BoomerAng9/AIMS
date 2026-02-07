/**
 * E2B Code Sandbox Service
 * Secure code execution in isolated containers
 */

import CodeInterpreter from "@e2b/sdk";

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

export class E2BService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.E2B_API_KEY || "";
  }

  /**
   * Execute code in a sandbox using CodeInterpreter
   */
  async executeCode(
    code: string,
    language: "python" | "node" | "bash" = "python"
  ): Promise<CodeExecutionResult> {
    const sandbox = await CodeInterpreter.create({
      apiKey: this.apiKey,
    });

    try {
      const execution = await (sandbox as any).notebook.execCell(
        language === "python"
          ? code
          : language === "bash"
            ? `%%bash\n${code}`
            : `%%javascript\n${code}`
      );

      return {
        stdout: execution.logs.stdout.join("\n"),
        stderr: execution.logs.stderr.join("\n"),
        exitCode: execution.error ? 1 : 0,
        error: execution.error?.name,
      };
    } catch (error: any) {
      return {
        stdout: "",
        stderr: "",
        exitCode: 1,
        error: error.message,
      };
    } finally {
      await (sandbox as any).kill?.() ?? (sandbox as any).close?.();
    }
  }

  /**
   * Execute Python code (convenience method)
   */
  async executePython(code: string): Promise<CodeExecutionResult> {
    return this.executeCode(code, "python");
  }

  /**
   * Execute Node.js code (convenience method)
   */
  async executeNode(code: string): Promise<CodeExecutionResult> {
    return this.executeCode(code, "node");
  }

  /**
   * Install packages and execute code
   */
  async executeWithPackages(
    code: string,
    packages: string[],
    language: "python" | "node" = "python"
  ): Promise<CodeExecutionResult> {
    const sandbox = await CodeInterpreter.create({
      apiKey: this.apiKey,
    });

    try {
      // Install packages first
      const installCmd =
        language === "python"
          ? `%%bash\npip install ${packages.join(" ")}`
          : `%%bash\nnpm install ${packages.join(" ")}`;

      await (sandbox as any).notebook.execCell(installCmd);

      // Execute code
      const execution = await (sandbox as any).notebook.execCell(
        language === "python" ? code : `%%javascript\n${code}`
      );

      return {
        stdout: execution.logs.stdout.join("\n"),
        stderr: execution.logs.stderr.join("\n"),
        exitCode: execution.error ? 1 : 0,
        error: execution.error?.name,
      };
    } catch (error: any) {
      return {
        stdout: "",
        stderr: "",
        exitCode: 1,
        error: error.message,
      };
    } finally {
      await (sandbox as any).kill?.() ?? (sandbox as any).close?.();
    }
  }
}

export const e2bService = new E2BService();
