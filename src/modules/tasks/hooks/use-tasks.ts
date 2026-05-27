import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function useTasks() {
  const data = useVaultDataStore((state) => state.tasks);
  return { data, isLoading: false, error: null };
}
