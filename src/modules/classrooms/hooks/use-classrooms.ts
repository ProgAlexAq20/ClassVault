import { useQuery } from "@tanstack/react-query";
import { listClassrooms } from "@/modules/classrooms/services/classroom.service";

export function useClassrooms() {
  return useQuery({
    queryKey: ["classrooms"],
    queryFn: listClassrooms
  });
}
