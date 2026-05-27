import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import type { Task } from "@/modules/tasks/types/task.types";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

const priorityClass = {
  low: "text-vault-fog",
  medium: "text-vault-mint",
  high: "text-rose-300"
};

export function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="flex items-center gap-3 p-4">
          {task.status === "done" ? <CheckCircle2 className="h-5 w-5 text-vault-mint" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{task.title}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              {new Date(task.dueAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              <span className={cn("font-semibold", priorityClass[task.priority])}>{task.priority}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
