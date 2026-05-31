import { FileText, LayoutDashboard, NotebookPen, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { EventTimeline } from "@/modules/calendar/components/EventTimeline";
import { useEvents } from "@/modules/calendar/hooks/use-events";
import { FileDropzone } from "@/modules/files/components/FileDropzone";
import { FileList } from "@/modules/files/components/FileList";
import { useFiles } from "@/modules/files/hooks/use-files";
import { NotesList } from "@/modules/notes/components/NotesList";
import { useNotes } from "@/modules/notes/hooks/use-notes";
import { SummaryStudio } from "@/modules/summaries/components/SummaryStudio";
import { TaskList } from "@/modules/tasks/components/TaskList";
import { useTasks } from "@/modules/tasks/hooks/use-tasks";
import { useNavigationStore } from "@/shared/store/navigation.store";
import { useVaultDataStore } from "@/shared/store/vault-data.store";
import { BetaStatusBanner } from "@/shared/components/BetaStatusBanner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import type { Lesson } from "@/modules/classrooms/types/classroom.types";

export function ClassroomPage() {
  const selectedId = useNavigationStore((state) => state.selectedClassroomId);
  const classrooms = useVaultDataStore((state) => state.classrooms);
  const addNote = useVaultDataStore((state) => state.addNote);
  const addTask = useVaultDataStore((state) => state.addTask);
  const addFile = useVaultDataStore((state) => state.addFile);
  const editClassroom = useVaultDataStore((state) => state.editClassroom);
  const removeClassroom = useVaultDataStore((state) => state.removeClassroom);
  const classroom = selectedId ? classrooms.find((item) => item.id === selectedId) : undefined;
  const { data: files = [] } = useFiles();
  const { data: notes = [] } = useNotes();
  const { data: tasks = [] } = useTasks();
  const { data: events = [] } = useEvents();
  const scopedFiles = classroom ? files.filter((item) => item.classroomId === classroom.id) : [];
  const scopedNotes = classroom ? notes.filter((item) => item.classroomId === classroom.id) : [];
  const scopedTasks = classroom ? tasks.filter((item) => item.classroomId === classroom.id) : [];
  const scopedEvents = classroom ? events.filter((item) => item.classroomId === classroom.id) : [];
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [notePreview, setNotePreview] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [title, setTitle] = useState("");
  const [professor, setProfessor] = useState("");
  const [color, setColor] = useState("#8fce9e");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState("");

  useEffect(() => {
    if (!classroom) return;
    setTitle(classroom.title);
    setProfessor(classroom.professor);
    setColor(classroom.color);
    setDescription(classroom.description ?? "");
    setCategories((classroom.categories ?? []).join(", "));
  }, [classroom]);

  async function handleNewNote() {
    if (!noteTitle.trim() || !classroom) return;
    try {
      await addNote({ classroomId: classroom.id, title: noteTitle.trim(), preview: notePreview.trim() });
      setNoteTitle("");
      setNotePreview("");
      setNoteDialogOpen(false);
    } catch {
      // The store logs and exposes the sync error.
    }
  }

  async function handleNewTask() {
    if (!taskTitle.trim() || !classroom) return;
    try {
      await addTask({ classroomId: classroom.id, title: taskTitle.trim() });
      setTaskTitle("");
      setTaskDialogOpen(false);
    } catch {
      // The store logs and exposes the sync error.
    }
  }

  async function handleSaveClassroom() {
    if (!classroom) return;
    try {
      await editClassroom({
        id: classroom.id,
        title: title.trim() || classroom.title,
        professor: professor.trim() || classroom.professor,
        color,
        description: description.trim(),
        categories: categories.split(",").map((item) => item.trim()).filter(Boolean)
      });
      setEditOpen(false);
    } catch {
      // The store logs and exposes the sync error.
    }
  }

  async function handleDeleteClassroom() {
    if (!classroom) return;
    try {
      await removeClassroom(classroom.id);
      setDeleteOpen(false);
    } catch {
      // The store logs and exposes the sync error.
    }
  }

  async function handleFileUpload(filesToUpload: File[]) {
    if (!classroom) return;
    await Promise.all(filesToUpload.map((file) => addFile({ classroomId: classroom.id, file })));
  }

  if (!classroom) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 pb-24 text-center">
        <Card className="max-w-3xl rounded-[2rem] border border-white/10 bg-vault-ink/50 p-10 shadow-glass">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Sala não encontrada</p>
            <h1 className="text-3xl font-extrabold">Nenhuma matéria selecionada</h1>
            <p className="text-sm leading-6 text-muted-foreground">Acesse o dashboard para criar sua primeira sala de aula e manter seu semestre organizado.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => useNavigationStore.getState().setRoute("dashboard")}>Ir para dashboard</Button>
              <Button variant="secondary" onClick={() => useNavigationStore.getState().setRoute("dashboard")}>Nova matéria</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <BetaStatusBanner />

      <section className="rounded-2xl border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-vault-mint">{classroom.code}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-normal sm:text-4xl">{classroom.title}</h1>
            <p className="mt-2 text-muted-foreground">{classroom.professor} · Próxima aula {classroom.nextClass}</p>
            {classroom.description && <p className="mt-4 text-sm leading-6 text-muted-foreground">{classroom.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button><NotebookPen className="h-4 w-4" /> Nota</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Criar nova nota</DialogTitle>
                <DialogDescription>Adicione uma anotação para esta matéria.</DialogDescription>
                <div className="mt-6 space-y-4">
                  <label className="block text-sm font-semibold">
                    Título da nota
                    <Input
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Ex: Conceitos fundamentais"
                      autoFocus
                      className="mt-2"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Resumo ou primeira ideia
                    <textarea
                      value={notePreview}
                      onChange={(e) => setNotePreview(e.target.value)}
                      placeholder="Ex: Primeira observação sobre o tema"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground outline-none focus:border-vault-mint"
                      rows={3}
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setNoteDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleNewNote} disabled={!noteTitle.trim()}>Criar nota</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary"><FileText className="h-4 w-4" /> Trabalho</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Criar novo trabalho</DialogTitle>
                <DialogDescription>Adicione uma tarefa ou trabalho para esta matéria.</DialogDescription>
                <div className="mt-6 space-y-4">
                  <label className="block text-sm font-semibold">
                    Nome da tarefa
                    <Input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleNewTask()}
                      placeholder="Ex: Entregar trabalho de pesquisa"
                      autoFocus
                      className="mt-2"
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setTaskDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleNewTask} disabled={!taskTitle.trim()}>Criar trabalho</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost">Editar matéria</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Editar matéria</DialogTitle>
                <DialogDescription>Atualize nome, cor, descrição e categorias da sala.</DialogDescription>
                <div className="mt-6 space-y-4">
                  <label className="block text-sm font-semibold">
                    Nome da matéria
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground outline-none focus:border-vault-mint"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Professor
                    <input
                      value={professor}
                      onChange={(event) => setProfessor(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground outline-none focus:border-vault-mint"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">
                      Cor
                      <input
                        type="color"
                        value={color}
                        onChange={(event) => setColor(event.target.value)}
                        className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] p-0"
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Categorias
                      <input
                        value={categories}
                        onChange={(event) => setCategories(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground outline-none focus:border-vault-mint"
                        placeholder="Ex: Projeto, Revisão"
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-semibold">
                    Descrição
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-foreground outline-none focus:border-vault-mint"
                      rows={4}
                    />
                  </label>
                  <div className="flex justify-between gap-2 pt-3">
                    <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveClassroom}>Salvar alterações</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">Excluir sala</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Tem certeza que deseja excluir esta matéria?</DialogTitle>
                <DialogDescription>Essa ação removerá a sala e o conteúdo vinculado localmente. Confirme apenas se tiver certeza.</DialogDescription>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                  <Button className="bg-rose-500 text-foreground hover:bg-rose-400" onClick={handleDeleteClassroom}>Excluir</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4" />Visão Geral</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="lessons">Aulas</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="tasks">Trabalhos</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="ai">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-5 xl:grid-cols-3">
          <Card><CardHeader><CardTitle>Arquivos recentes</CardTitle></CardHeader><CardContent>{scopedFiles.length ? <FileList files={scopedFiles} /> : <p className="text-sm text-muted-foreground">Nenhum arquivo nesta sala.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Notas</CardTitle></CardHeader><CardContent>{scopedNotes.length ? <NotesList notes={scopedNotes} /> : <p className="text-sm text-muted-foreground">Nenhuma nota criada ainda.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Trabalhos</CardTitle></CardHeader><CardContent>{scopedTasks.length ? <TaskList tasks={scopedTasks} /> : <p className="text-sm text-muted-foreground">Nenhum trabalho vinculado.</p>}</CardContent></Card>
        </TabsContent>
        <TabsContent value="files" className="space-y-5"><FileDropzone onUpload={handleFileUpload} /><FileList files={scopedFiles} /></TabsContent>
        <TabsContent value="lessons" className="grid gap-4 md:grid-cols-2">
          {((classroom.lessons?.length ? classroom.lessons : [{ id: "empty-lesson", classroomId: classroom.id, title: "Sem aulas cadastradas", startsAt: "" }]) as Lesson[]).map((lesson, index) => (
            <Card key={lesson.id} className="p-5">
              <Video className="h-5 w-5 text-vault-mint" />
              <h3 className="mt-4 font-semibold">{lesson.title || `Aula ${index + 1}`}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{lesson.description ?? "Nenhuma descrição adicionada."}</p>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="notes">{scopedNotes.length ? <NotesList notes={scopedNotes} /> : <p className="text-sm text-muted-foreground">Crie uma nota para começar a mapear sua sala.</p>}</TabsContent>
        <TabsContent value="tasks">{scopedTasks.length ? <TaskList tasks={scopedTasks} /> : <p className="text-sm text-muted-foreground">Sem tarefas para esta sala.</p>}</TabsContent>
        <TabsContent value="agenda">{scopedEvents.length ? <EventTimeline events={scopedEvents} /> : <p className="text-sm text-muted-foreground">Sem eventos agendados para esta sala.</p>}</TabsContent>
        <TabsContent value="ai"><SummaryStudio /></TabsContent>
      </Tabs>
    </div>
  );
}
