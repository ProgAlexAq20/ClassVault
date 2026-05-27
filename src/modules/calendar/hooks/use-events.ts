import { useQuery } from "@tanstack/react-query";
import { listEvents } from "@/modules/calendar/services/calendar.service";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: listEvents
  });
}
