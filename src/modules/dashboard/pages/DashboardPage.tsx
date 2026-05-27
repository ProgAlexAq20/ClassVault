import { CalendarDays, FilePlus2, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { ClassroomCard } from "@/modules/classrooms/components/ClassroomCard";
import { useClassrooms } from "@/modules/classrooms/hooks/use-classrooms";
import { EventTimeline } from "@/modules/calendar/components/EventTimeline";
import { useEvents } from "@/modules/calendar/hooks/use-events";
import { FileList } from "@/modules/files/components/FileList";
import { useFiles } from "@/modules/files/hooks/use-files";
import { NotesList } from "@/modules/notes/components/NotesList";
import { useNotes } from "@/modules/notes/hooks/use-notes";
import { TaskList } from "@/modules/tasks/components/TaskList";
import { useTasks } from "@/modules/tasks/hooks/use-tasks";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { BetaStatusBanner } from "@/shared/components/BetaStatusBanner";
import { useNavigationStore } from "@/shared/store/navigation.store";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

export function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProfessor, setNewProfessor] = useState("");
  const { data: classrooms = [] } = useClassrooms();
  const { data: files = [] } = useFiles();
  const { data: notes = [] } = useNotes();
  const { data: tasks = [] } = useTasks();
  const { data: events = [] } = useEvents();
  const openClassroom = useNavigationStore((state) => state.openClassroom);
  const setRoute = useNavigationStore((state) => state.setRoute);
  const addClassroom = useVaultDataStore((state) => state.addClassroom);

  function handleCreateClassroom() {
    const title = newTitle.trim();
    if (!title) return;
    const classroom = addClassroom({ title, professor: newProfessor.trim() });
    if (!classroom) {
      // Beta limit hit — redirect to premium page
      setCreateOpen(false);
      return setRoute('premium');
    }
    openClassroom(classroom.id);
    setNewTitle("");
    setNewProfessor("");
    setCreateOpen(false);
  }

  const hasClassrooms = classrooms.length > 0;

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <BetaStatusBanner />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-vault-mint/18 via-white/[0.055] to-transparent p-6 shadow-glass">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">ClassVault</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-normal sm:text-5xl">
                Seu semestre inteiro em um lugar claro.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                Matérias, arquivos, aulas, notas, entregas e IA organizados em salas modernas.
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4" /> Matéria</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Criar nova matéria</DialogTitle>
                  <DialogDescription>Personalize o nome e o professor da sua primeira sala de aula.</DialogDescription>
                  <div className="mt-6 space-y-4">
                    <label className="block text-sm font-semibold">
                      Nome da matéria
                      <input
                        value={newTitle}
                        onChange={(event) => setNewTitle(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground outline-none focus:border-vault-mint"
                        placeholder="Ex: Física moderna"
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Professor ou responsável
                      <input
                        value={newProfessor}
                        onChange={(event) => setNewProfessor(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground outline-none focus:border-vault-mint"
                        placeholder="Ex: Prof. Mariana Silva"
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCreateClassroom}>Criar matéria</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="secondary"><FilePlus2 className="h-4 w-4" /> Arquivo</Button>
            </div>
          </div>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Foco de hoje</p>
              <p className="text-sm text-muted-foreground">2 aulas, 1 entrega e 3 notas recentes</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-white/[0.055] p-4">
            <p className="text-sm text-muted-foreground">Próximo compromisso</p>
            <p className="mt-1 font-semibold">Design de Produto · 19:00</p>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Matérias</h2>
          <Button variant="ghost" size="sm">Ver todas</Button>
        </div>
        {!hasClassrooms ? (
          <Card className="rounded-3xl border border-white/10 bg-vault-ink/50 p-8 text-center shadow-glass">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Sem matérias ainda</p>
            <h2 className="mt-4 text-3xl font-bold">Comece criando sua primeira sala de aula.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Organize seu semestre com matérias personalizadas e mantenha todo conteúdo em um único lugar.</p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setCreateOpen(true)}>Nova Matéria</Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classrooms.map((classroom) => <ClassroomCard key={classroom.id} classroom={classroom} />)}
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Próximas entregas</CardTitle></CardHeader>
          <CardContent>{tasks.length ? <TaskList tasks={tasks} /> : <p className="text-sm text-muted-foreground">Nenhuma tarefa adicionada ainda. Crie uma matéria para começar.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Últimos arquivos</CardTitle></CardHeader>
          <CardContent>{files.length ? <FileList files={files} /> : <p className="text-sm text-muted-foreground">Armazene documentos e anotações para acompanhar o semestre.</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Agenda resumida</CardTitle><CalendarDays className="h-4 w-4 text-vault-mint" /></CardHeader>
          <CardContent>{events.length ? <EventTimeline events={events.slice(0, 3)} /> : <p className="text-sm text-muted-foreground">Sem eventos programados. Adicione aulas e prazos para aparecer aqui.</p>}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Últimas anotações</CardTitle></CardHeader>
        <CardContent>{notes.length ? <NotesList notes={notes} /> : <p className="text-sm text-muted-foreground">Ainda não há anotações. Crie sua primeira ideia dentro de uma sala.</p>}</CardContent>
      </Card>
    </div>
  );
}
