import { aiProviders } from "@/modules/summaries/providers";
import { readLocalApiKey } from "@/modules/summaries/services/local-key.service";
import type { SummaryRequest, SummaryResult } from "@/modules/summaries/types/summary.types";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

export async function generateSummary(request: SummaryRequest): Promise<SummaryResult> {
  if (!request.input.trim()) throw new Error("Adicione um texto ou material antes de gerar o resumo.");

  const apiKey = await readLocalApiKey(request.provider);
  if (!apiKey) throw new Error("Salve uma API key para este provedor antes de gerar o resumo.");

  const content = await aiProviders[request.provider].summarize(request, apiKey);
  const savedSummary = await useVaultDataStore.getState().addSummary({
    classroomId: request.classroomId,
    provider: request.provider,
    mode: request.mode,
    content
  });

  return {
    id: savedSummary.id,
    classroomId: savedSummary.classroomId,
    title: request.sourceName ?? "Resumo academico",
    mode: request.mode,
    content: savedSummary.content,
    createdAt: savedSummary.createdAt
  };
}
