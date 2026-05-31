export type AiProviderId = "openai" | "gemini" | "groq";

export type SummaryMode = "quick" | "technical" | "checklist" | "key-points" | "exercises";

export type SummaryRequest = {
  provider: AiProviderId;
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
