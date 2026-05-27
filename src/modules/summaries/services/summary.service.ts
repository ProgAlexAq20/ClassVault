import { aiProviders } from "@/modules/summaries/providers";
import { readLocalApiKey } from "@/modules/summaries/services/local-key.service";
import type { SummaryRequest, SummaryResult } from "@/modules/summaries/types/summary.types";

export async function generateSummary(request: SummaryRequest): Promise<SummaryResult> {
  const apiKey = await readLocalApiKey(request.provider);
  if (!apiKey) throw new Error("Adicione sua API key local antes de gerar o resumo.");

  const content = await aiProviders[request.provider].summarize(request, apiKey);

  return {
    id: crypto.randomUUID(),
    title: request.sourceName ?? "Resumo academico",
    mode: request.mode,
    content,
    createdAt: new Date().toISOString()
  };
}
