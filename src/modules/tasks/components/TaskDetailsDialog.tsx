import { CheckCircle2, PartyPopper, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Classroom } from "@/modules/classrooms/types/classroom.types";
import type { Task } from "@/modules/tasks/types/task.types";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

type TaskDetailsDialogProps = {
  task: Task | null;
  open: boolean;
  classrooms?: Classroom[];
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => Promise<unknown> | unknown;
  onDelete?: (id: string) => Promise<void> | void;
};

const statusLabels: Record<Task["status"], string> = {
  todo: "Pendente",
  doing: "Em andamento",
  done: "Finalizada"
};

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function taskStatusLabel(status: Task["status"]) {
  return statusLabels[status];
}

export function isTaskOverdue(task: Task) {
  return task.status !== "done" && task.dueDate < localDateKey();
}

export function isTaskToday(task: Task) {
  return task.dueDate === localDateKey();
}

export function TaskProgressBar({ progress, className }: { progress: number; className?: string }) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className="h-full rounded-full bg-vault-mint transition-all duration-500"
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
}

export function TaskDetailsDialog({ task, open, classrooms = [], onOpenChange, onSave, onDelete }: TaskDetailsDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [progress, setProgress] = useState(0);
  const [subjectId, setSubjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRockets, setShowRockets] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setDueDate(task.dueDate);
    setDueTime(task.dueTime ?? "");
    setPriority(task.priority);
    setStatus(task.status);
    setProgress(task.status === "done" ? 100 : task.progress ?? 0);
    setSubjectId(task.subjectId ?? task.classroomId);
    setConfirmDelete(false);
    setFeedback(null);
    setError(null);
  }, [task]);

  const selectedClassroom = useMemo(
    () => classrooms.find((classroom) => classroom.id === subjectId || classroom.id === task?.classroomId),
    [classrooms, subjectId, task?.classroomId]
  );

  function updateProgress(value: number) {
    const nextProgress = Math.min(100, Math.max(0, value));
    setProgress(nextProgress);
    if (nextProgress >= 100) {
      setStatus("done");
      setShowRockets(true);
      window.setTimeout(() => setShowRockets(false), 1600);
    } else if (status === "done") {
      setStatus("doing");
    }
  }

  function updateStatus(value: Task["status"]) {
    setStatus(value);
    if (value === "done") {
      setProgress(100);
      setShowRockets(true);
      window.setTimeout(() => setShowRockets(false), 1600);
    }
    if (value === "todo" && progress >= 100) setProgress(0);
    if (value === "doing" && progress >= 100) setProgress(75);
  }

  async function handleSave() {
    if (!task || !title.trim() || !dueDate) return;
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const nextStatus = progress >= 100 ? "done" : status;
      await onSave({
        ...task,
        classroomId: subjectId || task.classroomId,
        subjectId: subjectId || task.classroomId,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime: dueTime || undefined,
        priority,
        status: nextStatus,
        progress: nextStatus === "done" ? 100 : progress
      });
      setFeedback("Tarefa salva com sucesso.");
      window.setTimeout(() => onOpenChange(false), 450);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nao foi possivel salvar a tarefa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task || !onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await onDelete(task.id);
      onOpenChange(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir a tarefa.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {showRockets && (
          <div className="pointer-events-none absolute inset-x-0 top-8 z-10 flex justify-center gap-3 text-3xl animate-in fade-in slide-in-from-bottom-3 duration-300">
            <span>🚀</span>
            <span>🚀</span>
            <span>🚀</span>
          </div>
        )}
        <DialogTitle>Detalhes da tarefa</DialogTitle>
        <DialogDescription>
          Atualize prazo, progresso, status e matéria. As alterações são salvas no Firebase.
        </DialogDescription>

        <div className="mt-6 space-y-5">
          <label className="block text-sm font-semibold">
            Título
            <Input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" />
          </label>

          <label className="block text-sm font-semibold">
            Descrição
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="focus-ring mt-2 min-h-32 w-full resize-y rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Detalhe requisitos, links, critérios de entrega ou próximos passos."
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Data
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-2" />
            </label>
            <label className="block text-sm font-semibold">
              Horário opcional
              <Input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} className="mt-2" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-semibold">
              Status
              <select value={status} onChange={(event) => updateStatus(event.target.value as Task["status"])} className="focus-ring mt-2 h-11 w-full rounded-lg border border-white/10 bg-vault-ink px-3 text-sm text-foreground">
                <option value="todo">Pendente</option>
                <option value="doing">Em andamento</option>
                <option value="done">Finalizada</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Prioridade
              <select value={priority} onChange={(event) => setPriority(event.target.value as Task["priority"])} className="focus-ring mt-2 h-11 w-full rounded-lg border border-white/10 bg-vault-ink px-3 text-sm text-foreground">
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Matéria
              <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="focus-ring mt-2 h-11 w-full rounded-lg border border-white/10 bg-vault-ink px-3 text-sm text-foreground">
                {classrooms.length ? classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>{classroom.title}</option>
                )) : <option value={task?.classroomId ?? ""}>Sem matéria</option>}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Progresso</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ao chegar em 100%, a tarefa vira finalizada automaticamente.
                </p>
              </div>
              <span className="rounded-full bg-vault-mint/10 px-3 py-1 text-sm font-bold text-vault-mint">{progress}%</span>
            </div>
            <TaskProgressBar progress={progress} className="mt-4" />
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(event) => updateProgress(Number(event.target.value))}
              className="mt-4 w-full accent-vault-mint"
              aria-label="Progresso da tarefa"
            />
          </div>

          {selectedClassroom && (
            <p className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-muted-foreground">
              Relacionada a <strong className="text-foreground">{selectedClassroom.title}</strong>.
            </p>
          )}

          {feedback && (
            <p className="flex items-center gap-2 rounded-xl border border-vault-mint/30 bg-vault-mint/10 p-3 text-sm text-vault-mint">
              <CheckCircle2 className="h-4 w-4" /> {feedback}
            </p>
          )}
          {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {onDelete ? (
              <Button variant="secondary" className={cn("w-full sm:w-auto", confirmDelete && "border-rose-400/40 text-rose-200")} onClick={handleDelete} disabled={deleting}>
                <Trash2 className="h-4 w-4" />
                {deleting ? "Excluindo..." : confirmDelete ? "Confirmar exclusão" : "Excluir"}
              </Button>
            ) : <span />}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !title.trim() || !dueDate}>
                {progress >= 100 ? <PartyPopper className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saving ? "Salvando..." : "Salvar tarefa"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
