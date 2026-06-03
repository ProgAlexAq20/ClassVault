import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { EventTimeline } from "@/modules/calendar/components/EventTimeline";
import { MonthCalendar } from "@/modules/calendar/components/MonthCalendar";
import { useEvents } from "@/modules/calendar/hooks/use-events";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function CalendarPage() {
  const { data: events = [] } = useEvents();
  const addEvent = useVaultDataStore((state) => state.addEvent);
  const classrooms = useVaultDataStore((state) => state.classrooms);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState("");

  async function handleCreateEvent() {
    if (!eventTitle.trim() || !eventStartsAt) return;

    try {
      await addEvent({
        classroomId: classrooms[0]?.id,
        title: eventTitle.trim(),
        startsAt: new Date(eventStartsAt).toISOString(),
        type: "event"
      });
      setEventTitle("");
      setEventStartsAt("");
      setEventOpen(false);
    } catch {
      // The store logs and exposes the sync error.
    }
  }

  return (
    <div className="grid gap-5 pb-24 lg:pb-0 xl:grid-cols-[minmax(0,1fr)_390px]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Agenda Universal</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Todas as matérias, aulas, provas e entregas em uma visão única.</p>
          </div>
          <Dialog open={eventOpen} onOpenChange={setEventOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary"><CalendarDays className="h-4 w-4" /> Evento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Novo evento</DialogTitle>
              <DialogDescription>Crie um compromisso salvo na sua conta local do ClassVault.</DialogDescription>
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-semibold">
                  Titulo
                  <Input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} className="mt-2" />
                </label>
                <label className="block text-sm font-semibold">
                  Data e hora
                  <Input type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} className="mt-2" />
                </label>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setEventOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateEvent} disabled={!eventTitle.trim() || !eventStartsAt}>Salvar evento</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
