import { KanbanSquare, Plus } from "lucide-react";
import { useState } from "react";
import { TaskList } from "@/modules/tasks/components/TaskList";
import { useTasks } from "@/modules/tasks/hooks/use-tasks";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function TasksPage() {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const { data: tasks = [] } = useTasks();
  const classrooms = useVaultDataStore((state) => state.classrooms);
  const addTask = useVaultDataStore((state) => state.addTask);
  const editTask = useVaultDataStore((state) => state.editTask);
  const removeTask = useVaultDataStore((state) => state.removeTask);
  const todo = tasks.filter((task) => task.status === "todo");
  const doing = tasks.filter((task) => task.status === "doing");
  const done = tasks.filter((task) => task.status === "done");

  async function handleNewTask() {
    const title = newTaskTitle.trim();
    const classroomId = classrooms[0]?.id;
    if (!title || !classroomId) return;
    try {
      await addTask({ classroomId, title, description: newTaskDescription });
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskOpen(false);
    } catch {
      // The store logs and exposes the sync error.
    }
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Trabalhos</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-normal">Tarefas acadêmicas em foco.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Organize trabalhos com contexto completo, prioridade e status para não depender de memória solta.</p>
        </div>
        <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Nova tarefa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Criar nova tarefa</DialogTitle>
            <DialogDescription>Adicione uma tarefa rápida à sua lista de afazeres.</DialogDescription>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold">
                Nome do trabalho
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNewTask()}
                  placeholder="Ex: Entregar relatório"
                  autoFocus
                  className="mt-2"
                />
              </label>
              <label className="block text-sm font-semibold">
                Descrição
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Inclua requisitos, links, formato de entrega e observações importantes."
                  className="focus-ring mt-2 min-h-32 w-full resize-y rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setNewTaskOpen(false)}>Cancelar</Button>
                <Button onClick={handleNewTask} disabled={!newTaskTitle.trim()}>Criar tarefa</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><KanbanSquare className="h-4 w-4 text-vault-mint" />A fazer</CardTitle></CardHeader><CardContent><TaskList tasks={todo} onEdit={editTask} onDelete={removeTask} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Em andamento</CardTitle></CardHeader><CardContent><TaskList tasks={doing} onEdit={editTask} onDelete={removeTask} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Concluídas</CardTitle></CardHeader><CardContent><TaskList tasks={done} onEdit={editTask} onDelete={removeTask} /></CardContent></Card>
      </div>
    </div>
  );
}
