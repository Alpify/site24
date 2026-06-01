import { createOpenAI } from "@ai-sdk/openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export function getOpenRouterModelId(): string {
  return process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";
}

export function requireOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MISSING_OPENROUTER_KEY");
  }
  return apiKey;
}

export function createOpenRouterModel() {
  const apiKey = requireOpenRouterApiKey();
  const openrouter = createOpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    headers: {
      "HTTP-Referer":
        process.env.OPENROUTER_HTTP_REFERER?.trim() || "https://site24.com",
      "X-Title": process.env.OPENROUTER_APP_TITLE?.trim() || "site24-marketing",
    },
  });
  return openrouter(getOpenRouterModelId());
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}
