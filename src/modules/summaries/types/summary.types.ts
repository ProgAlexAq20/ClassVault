export type AiProviderId = "openai" | "gemini" | "groq";

export type GeminiModelId = "gemini-2.5-flash" | "gemini-2.5-pro";

export type SummaryMode = "quick" | "technical" | "checklist" | "key-points" | "exercises";

export type SummaryRequest = {
  provider: AiProviderId;
  geminiModel: GeminiModelId;
  mode: SummaryMode;
  input: string;
  classroomId: string;
  sourceName?: string;
};

export type SummaryResult = {
  id: string;
  classroomId: string;
  title: string;
  mode: SummaryMode;
  content: string;
  createdAt: string;
};
