import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function useNotes() {
  const data = useVaultDataStore((state) => state.notes);
  return { data, isLoading: false, error: null };
}
