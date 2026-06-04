import { CalendarDays, CheckCircle2, Clock3, Plus } from "lucide-react";
import { useState } from "react";
import { EventTimeline } from "@/modules/calendar/components/EventTimeline";
import { MonthCalendar } from "@/modules/calendar/components/MonthCalendar";
import { useEvents } from "@/modules/calendar/hooks/use-events";
import { TaskList } from "@/modules/tasks/components/TaskList";
import { isTaskOverdue, localDateKey } from "@/modules/tasks/components/TaskDetailsDialog";
import { useTasks } from "@/modules/tasks/hooks/use-tasks";
import type { Task } from "@/modules/tasks/types/task.types";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function CalendarPage() {
  const { data: events = [] } = useEvents();
  const { data: tasks = [] } = useTasks();
  const addEvent = useVaultDataStore((state) => state.addEvent);
  const addTask = useVaultDataStore((state) => state.addTask);
  const editTask = useVaultDataStore((state) => state.editTask);
  const removeTask = useVaultDataStore((state) => state.removeTask);
  const classrooms = useVaultDataStore((state) => state.classrooms);
  const [eventOpen, setEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateKey());
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("medium");
  const [taskClassroomId, setTaskClassroomId] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [taskFeedback, setTaskFeedback] = useState<string | null>(null);

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

  function openTaskPanel(date: string) {
    setSelectedDate(date);
    setTaskClassroomId(classrooms[0]?.id ?? "");
    setTaskOpen(true);
    setTaskFeedback(null);
  }

  async function handleCreateTask() {
    const title = taskTitle.trim();
    const classroomId = taskClassroomId || classrooms[0]?.id;
    if (!title || !classroomId) return;
    setSavingTask(true);
    setTaskFeedback(null);
    try {
      await addTask({
        classroomId,
        subjectId: classroomId,
        title,
        description: taskDescription,
        dueDate: selectedDate,
        dueTime: taskDueTime,
        priority: taskPriority
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueTime("");
      setTaskPriority("medium");
      setTaskFeedback("Tarefa adicionada na agenda.");
      window.setTimeout(() => setTaskOpen(false), 650);
    } catch {
      setTaskFeedback("Nao foi possivel criar a tarefa agora.");
    } finally {
      setSavingTask(false);
    }
  }

  const selectedTasks = tasks
    .filter((task) => task.dueDate === selectedDate)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const monthTasks = tasks.filter((task) => {
    const taskDate = new Date(`${task.dueDate}T12:00`);
    return taskDate.getMonth() === month.getMonth() && taskDate.getFullYear() === month.getFullYear();
  });
  const overdueCount = tasks.filter(isTaskOverdue).length;

  return (
    <div className="grid gap-5 pb-24 lg:pb-0 xl:grid-cols-[minmax(0,1fr)_390px]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Agenda Universal</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Clique em qualquer dia para criar uma tarefa com a data preenchida automaticamente.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => openTaskPanel(selectedDate)}><Plus className="h-4 w-4" /> Tarefa</Button>
            <Dialog open={eventOpen} onOpenChange={setEventOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary"><CalendarDays className="h-4 w-4" /> Evento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Novo evento</DialogTitle>
                <DialogDescription>Crie um compromisso salvo na sua conta do ClassVault.</DialogDescription>
                <div className="mt-6 space-y-4">
                  <label className="block text-sm font-semibold">
                    Título
                    <Input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} className="mt-2" />
                  </label>
                  <label className="block text-sm font-semibold">
                    Data e hora
                    <Input type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} className="mt-2" />
                  </label>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="secondary" onClick={() => setEventOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateEvent} disabled={!eventTitle.trim() || !eventStartsAt}>Salvar evento</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <MonthCalendar month={month} tasks={tasks} selectedDate={selectedDate} onMonthChange={setMonth} onSelectDate={openTaskPanel} />
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>{new Date(`${selectedDate}T12:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => openTaskPanel(selectedDate)}><Plus className="h-4 w-4" /> Tarefa</Button>
          </CardHeader>
          <CardContent>
            <TaskList tasks={selectedTasks} classrooms={classrooms} onEdit={editTask} onDelete={removeTask} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Resumo do mês</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-white/[0.045] p-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4" /> Tarefas no mês</span>
              <strong>{monthTasks.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/[0.045] p-3">
              <span className="inline-flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Concluídas</span>
              <strong>{monthTasks.filter((task) => task.status === "done").length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/[0.045] p-3">
              <span className="text-muted-foreground">Atrasadas</span>
              <strong className="text-rose-300">{overdueCount}</strong>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Timeline semanal</CardTitle></CardHeader>
          <CardContent><EventTimeline events={events} /></CardContent>
        </Card>
      </div>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>
            A tarefa será criada para {new Date(`${selectedDate}T12:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}.
          </DialogDescription>
          <div className="mt-6 space-y-4">
            {!classrooms.length && (
              <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                Crie uma matéria antes de adicionar tarefas na agenda.
              </p>
            )}
            <label className="block text-sm font-semibold">
              Título
              <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} className="mt-2" autoFocus />
            </label>
            <label className="block text-sm font-semibold">
              Descrição
              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                className="focus-ring mt-2 min-h-28 w-full resize-y rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="Resumo da entrega, checklist ou orientação do professor."
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Horário opcional
                <Input type="time" value={taskDueTime} onChange={(event) => setTaskDueTime(event.target.value)} className="mt-2" />
              </label>
              <label className="block text-sm font-semibold">
                Prioridade
                <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as Task["priority"])} className="focus-ring mt-2 h-11 w-full rounded-lg border border-white/10 bg-vault-ink px-3 text-sm text-foreground">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Matéria relacionada
              <select value={taskClassroomId} onChange={(event) => setTaskClassroomId(event.target.value)} className="focus-ring mt-2 h-11 w-full rounded-lg border border-white/10 bg-vault-ink px-3 text-sm text-foreground">
                {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.title}</option>)}
              </select>
            </label>
            {taskFeedback && <p className="rounded-xl border border-vault-mint/30 bg-vault-mint/10 p-3 text-sm text-vault-mint">{taskFeedback}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setTaskOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateTask} disabled={savingTask || !taskTitle.trim() || !classrooms.length}>{savingTask ? "Salvando..." : "Criar tarefa"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
