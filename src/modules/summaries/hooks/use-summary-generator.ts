import { useMutation } from "@tanstack/react-query";
import { generateSummary } from "@/modules/summaries/services/summary.service";

export function useSummaryGenerator() {
  return useMutation({
    mutationFn: generateSummary
  });
}
