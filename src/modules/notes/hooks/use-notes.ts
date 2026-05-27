import { useQuery } from "@tanstack/react-query";
import { listRecentNotes } from "@/modules/notes/services/note.service";

export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: listRecentNotes
  });
}
