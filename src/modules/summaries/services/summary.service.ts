import { aiProviders } from "@/modules/summaries/providers";
import { readLocalApiKey } from "@/modules/summaries/services/local-key.service";
import type { SummaryRequest, SummaryResult } from "@/modules/summaries/types/summary.types";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

export async function generateSummary(request: SummaryRequest): Promise<SummaryResult> {
  const apiKey = await readLocalApiKey(request.provider);
  if (!apiKey) throw new Error("Adicione sua API key local antes de gerar o resumo.");

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
