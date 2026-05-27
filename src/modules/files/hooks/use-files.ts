import { useQuery } from "@tanstack/react-query";
import { listRecentFiles } from "@/modules/files/services/file.service";

export function useFiles() {
  return useQuery({
    queryKey: ["files"],
    queryFn: listRecentFiles
  });
}
