import { CheckCircle2, Circle, Clock3, Edit3, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Classroom } from "@/modules/classrooms/types/classroom.types";
import { isTaskOverdue, isTaskToday, TaskDetailsDialog, TaskProgressBar, taskStatusLabel } from "@/modules/tasks/components/TaskDetailsDialog";
import type { Task } from "@/modules/tasks/types/task.types";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

const priorityClass = {
  low: "text-vault-fog",
  medium: "text-vault-mint",
  high: "text-rose-300"
};

type TaskListProps = {
  tasks: Task[];
  classrooms?: Classroom[];
  onEdit?: (task: Task) => Promise<unknown> | unknown;
  onDelete?: (id: string) => Promise<void> | void;
  interactive?: boolean;
};

export function TaskList({ tasks, classrooms = [], onEdit, onDelete, interactive = Boolean(onEdit) }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
          <Card
            key={task.id}
            className={cn("p-4", interactive && "cursor-pointer hover:-translate-y-0.5 hover:border-vault-mint/30")}
            onClick={() => interactive && setSelectedTask(task)}
          >
            <div className="flex items-start gap-3">
              {task.status === "done" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-vault-mint" /> : <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{task.title}</p>
                  <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-muted-foreground">{task.progress ?? 0}%</span>
                </div>
                {task.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sem descrição adicionada.</p>
                )}
                <TaskProgressBar progress={task.progress ?? 0} className="mt-3" />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(task.dueAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {task.status !== "done" && isTaskToday(task) && <span className="rounded-full bg-vault-mint/10 px-2 py-0.5 text-vault-mint">Hoje</span>}
                  {isTaskOverdue(task) && <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-rose-300">Atrasada</span>}
                  <span className={cn("font-semibold", priorityClass[task.priority])}>{task.priority}</span>
                  <span className="rounded-full bg-white/8 px-2 py-0.5">{taskStatusLabel(task.status)}</span>
                </div>
              </div>
              {(onEdit || onDelete) && (
                <div className="flex shrink-0 gap-1">
                  {onEdit && (
                    <Button variant="ghost" size="icon" aria-label={`Editar ${task.title}`} onClick={(event) => { event.stopPropagation(); setSelectedTask(task); }}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" aria-label={`Excluir ${task.title}`} onClick={(event) => { event.stopPropagation(); setSelectedTask(task); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <TaskDetailsDialog
        task={selectedTask}
        open={Boolean(selectedTask)}
        classrooms={classrooms}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onSave={async (task) => {
          await onEdit?.(task);
          setSelectedTask(null);
        }}
        onDelete={onDelete}
      />
    </>
  );
}
