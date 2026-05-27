import { geminiProvider } from "./gemini.provider";
import { groqProvider } from "./groq.provider";
import { openAiProvider } from "./openai.provider";

export const aiProviders = {
  openai: openAiProvider,
  gemini: geminiProvider,
  groq: groqProvider
};
