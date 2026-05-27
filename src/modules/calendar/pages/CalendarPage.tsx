import { CalendarDays } from "lucide-react";
import { EventTimeline } from "@/modules/calendar/components/EventTimeline";
import { MonthCalendar } from "@/modules/calendar/components/MonthCalendar";
import { useEvents } from "@/modules/calendar/hooks/use-events";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function CalendarPage() {
  const { data: events = [] } = useEvents();

  return (
    <div className="grid gap-5 pb-24 lg:pb-0 xl:grid-cols-[minmax(0,1fr)_390px]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Agenda Universal</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Todas as matérias, aulas, provas e entregas em uma visão única.</p>
          </div>
          <Button variant="secondary"><CalendarDays className="h-4 w-4" /> Evento</Button>
        </CardHeader>
        <CardContent><MonthCalendar /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Timeline semanal</CardTitle></CardHeader>
        <CardContent><EventTimeline events={events} /></CardContent>
      </Card>
    </div>
  );
}
