import { create } from "zustand";
import type { AiProviderId, SummaryMode } from "@/modules/summaries/types/summary.types";

type SummaryStore = {
  provider: AiProviderId;
  mode: SummaryMode;
  input: string;
  setProvider: (provider: AiProviderId) => void;
  setMode: (mode: SummaryMode) => void;
  setInput: (input: string) => void;
};

export const useSummaryStore = create<SummaryStore>((set) => ({
  provider: "openai",
  mode: "quick",
  input: "",
  setProvider: (provider) => set({ provider }),
  setMode: (mode) => set({ mode }),
  setInput: (input) => set({ input })
}));
