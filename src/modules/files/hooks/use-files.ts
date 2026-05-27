import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function useFiles() {
  const data = useVaultDataStore((state) => state.files);
  return { data, isLoading: false, error: null };
}
