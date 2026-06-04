import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AiProviderId, GeminiModelId, SummaryMode } from "@/modules/summaries/types/summary.types";

type SummaryStore = {
  provider: AiProviderId;
  geminiModel: GeminiModelId;
  mode: SummaryMode;
  input: string;
  setProvider: (provider: AiProviderId) => void;
  setGeminiModel: (model: GeminiModelId) => void;
  setMode: (mode: SummaryMode) => void;
  setInput: (input: string) => void;
};

export const useSummaryStore = create<SummaryStore>()(
  persist(
    (set) => ({
      provider: "gemini",
      geminiModel: "gemini-2.5-flash",
      mode: "quick",
      input: "",
      setProvider: (provider) => set({ provider }),
      setGeminiModel: (geminiModel) => set({ geminiModel }),
      setMode: (mode) => set({ mode }),
      setInput: (input) => set({ input })
    }),
    {
      name: "classvault-summary-settings",
      partialize: (state) => ({ provider: state.provider, geminiModel: state.geminiModel, mode: state.mode })
    }
  )
);
