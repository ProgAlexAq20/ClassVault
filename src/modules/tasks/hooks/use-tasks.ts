import { useCallback } from "react";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function useTasks() {
  const data = useVaultDataStore((state) => state.tasks);
  const addTask = useVaultDataStore((state) => state.addTask);

  const createTask = useCallback(
    async (input: Parameters<typeof addTask>[0]) => {
      return addTask(input);
    },
    [addTask]
  );

  return { data, isLoading: false, error: null, createTask };
}
