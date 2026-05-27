import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function useEvents() {
  const data = useVaultDataStore((state) => state.events);
  return { data, isLoading: false, error: null };
}
