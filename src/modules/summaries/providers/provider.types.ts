import type { SummaryRequest } from "@/modules/summaries/types/summary.types";

export type AiProvider = {
  id: "openai" | "gemini" | "groq";
  label: string;
  summarize: (request: SummaryRequest, apiKey: string) => Promise<string>;
};
