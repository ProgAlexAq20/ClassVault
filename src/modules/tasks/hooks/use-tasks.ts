import { useQuery } from "@tanstack/react-query";
import { listTasks } from "@/modules/tasks/services/task.service";

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: listTasks
  });
}
