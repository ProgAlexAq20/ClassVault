import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function useClassrooms() {
  const data = useVaultDataStore((state) => state.classrooms);
  return { data, isLoading: false, error: null };
}
