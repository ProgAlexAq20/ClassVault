import { CheckCircle2, Circle, Clock3, Edit3, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Task } from "@/modules/tasks/types/task.types";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

const priorityClass = {
  low: "text-vault-fog",
  medium: "text-vault-mint",
  high: "text-rose-300"
};

type TaskListProps = {
  tasks: Task[];
  onEdit?: (task: Task) => Promise<unknown> | unknown;
  onDelete?: (id: string) => Promise<void> | void;
};

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingTask) return;
    setTitle(editingTask.title);
    setDescription(editingTask.description);
    setPriority(editingTask.priority);
    setStatus(editingTask.status);
    setError(null);
  }, [editingTask]);

  async function handleSave() {
    if (!editingTask || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onEdit?.({ ...editingTask, title: title.trim(), description: description.trim(), priority, status });
      setEditingTask(null);
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "Nao foi possivel salvar o trabalho.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingTask) return;
    setSaving(true);
    setError(null);
    try {
      await onDelete?.(deletingTask.id);
      setDeletingTask(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir o trabalho.");
    } finally {
      setSaving(false);
    }
  }

  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.035] p-6 text-center">
        <p className="text-sm font-semibold text-foreground">Nenhum trabalho por aqui.</p>
        <p className="mt-1 text-sm text-muted-foreground">Crie um trabalho com descrição para acompanhar entregas sem perder contexto.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex items-start gap-3">
              {task.status === "done" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-vault-mint" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{task.title}</p>
                {task.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sem descrição adicionada.</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(task.dueAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                  <span className={cn("font-semibold", priorityClass[task.priority])}>{task.priority}</span>
                  <span className="rounded-full bg-white/8 px-2 py-0.5">{task.status}</span>
                </div>
              </div>
              {(onEdit || onDelete) && (
                <div className="flex shrink-0 gap-1">
                  {onEdit && (
                    <Button variant="ghost" size="icon" aria-label={`Editar ${task.title}`} onClick={() => setEditingTask(task)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" aria-label={`Excluir ${task.title}`} onClick={() => setDeletingTask(task)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogTitle>Editar trabalho</DialogTitle>
          <DialogDescription>Atualize descrição, prioridade e status do trabalho.</DialogDescription>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">
              Nome do trabalho
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
                Prioridade
                <select value={priority} onChange={(event) => setPriority(event.target.value as Task["priority"])} className="focus-ring mt-2 h-10 w-full rounded-lg border border-white/10 bg-vault-ink px-3 text-sm text-foreground">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value as Task["status"])} className="focus-ring mt-2 h-10 w-full rounded-lg border border-white/10 bg-vault-ink px-3 text-sm text-foreground">
                  <option value="todo">A fazer</option>
                  <option value="doing">Em andamento</option>
                  <option value="done">Concluído</option>
                </select>
              </label>
            </div>
            {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditingTask(null)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !title.trim()}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingTask)} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <DialogContent>
          <DialogTitle>Excluir trabalho?</DialogTitle>
          <DialogDescription>Essa ação remove o trabalho da sua conta e não pode ser desfeita.</DialogDescription>
          {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeletingTask(null)}>Cancelar</Button>
            <Button className="bg-rose-500 text-foreground hover:bg-rose-400" onClick={handleDelete} disabled={saving}>
              {saving ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
