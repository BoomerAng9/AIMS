// =============================================================================
// Chicken Hawk — Docker Secrets Reader
// Reads from /run/secrets/ (Docker secrets) with env var fallback.
// Secrets are NEVER logged.
// =============================================================================

import { readFileSync, existsSync } from "fs";

/**
 * Read a secret from Docker secrets mount or fall back to env var.
 */
export function readSecret(name: string, envFallback?: string): string {
  const secretPath = `/run/secrets/${name}`;
  if (existsSync(secretPath)) {
    return readFileSync(secretPath, "utf-8").trim();
  }
  return (envFallback ? process.env[envFallback] : process.env[name.toUpperCase()]) || "";
}

export const secrets = {
  openrouterApiKey: readSecret("openrouter_api_key", "OPENROUTER_API_KEY"),
  geminiApiKey: readSecret("gemini_api_key", "GEMINI_API_KEY"),
  redisPassword: readSecret("redis_password", "REDIS_PASSWORD"),
} as const;
