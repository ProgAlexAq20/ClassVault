import { CalendarClock } from "lucide-react";
import type { CalendarEvent } from "@/modules/calendar/types/calendar.types";
import { Card } from "@/shared/components/ui/card";

export function EventTimeline({ events }: { events: CalendarEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id} className="flex items-center gap-4 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-vault-mint/12 text-vault-mint">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">{event.title}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(event.startsAt).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
