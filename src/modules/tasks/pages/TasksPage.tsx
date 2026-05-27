import { KanbanSquare, Plus } from "lucide-react";
import { TaskList } from "@/modules/tasks/components/TaskList";
import { useTasks } from "@/modules/tasks/hooks/use-tasks";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function TasksPage() {
  const { data: tasks = [] } = useTasks();
  const todo = tasks.filter((task) => task.status === "todo");
  const doing = tasks.filter((task) => task.status === "doing");
  const done = tasks.filter((task) => task.status === "done");

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Trabalhos</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-normal">Tarefas acadêmicas em foco.</h1>
        </div>
        <Button><Plus className="h-4 w-4" /> Nova tarefa</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><KanbanSquare className="h-4 w-4 text-vault-mint" />A fazer</CardTitle></CardHeader><CardContent><TaskList tasks={todo} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Em andamento</CardTitle></CardHeader><CardContent><TaskList tasks={doing} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Concluídas</CardTitle></CardHeader><CardContent><TaskList tasks={done} /></CardContent></Card>
      </div>
    </div>
  );
}
