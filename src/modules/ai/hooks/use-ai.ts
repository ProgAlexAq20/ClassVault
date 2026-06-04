import { useCallback } from "react";
import { createAiMessage as serviceCreateAiMessage } from "@/modules/ai/services/ai.service";

export function useAi() {
  const createAiMessage = useCallback(
    async (userId: string, aiConversationId: string, role: string, content: string) => {
      return serviceCreateAiMessage(userId, aiConversationId, role, content);
    },
    []
  );

  return { createAiMessage };
}
