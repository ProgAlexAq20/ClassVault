import { CalendarDays, FileText, LayoutDashboard, ListTodo, NotebookPen, Sparkles, Video } from "lucide-react";
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
import { classrooms } from "@/shared/data/mock-data";
import { useNavigationStore } from "@/shared/store/navigation.store";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export function ClassroomPage() {
  const selectedId = useNavigationStore((state) => state.selectedClassroomId);
  const classroom = classrooms.find((item) => item.id === selectedId) ?? classrooms[0];
  const { data: files = [] } = useFiles();
  const { data: notes = [] } = useNotes();
  const { data: tasks = [] } = useTasks();
  const { data: events = [] } = useEvents();
  const scopedFiles = files.filter((item) => item.classroomId === classroom.id);
  const scopedNotes = notes.filter((item) => item.classroomId === classroom.id);
  const scopedTasks = tasks.filter((item) => item.classroomId === classroom.id);
  const scopedEvents = events.filter((item) => item.classroomId === classroom.id);

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <section className="rounded-2xl border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-vault-mint">{classroom.code}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-normal sm:text-4xl">{classroom.title}</h1>
            <p className="mt-2 text-muted-foreground">{classroom.professor} · Próxima aula {classroom.nextClass}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button><NotebookPen className="h-4 w-4" /> Nota</Button>
            <Button variant="secondary"><FileText className="h-4 w-4" /> Upload</Button>
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
          <Card><CardHeader><CardTitle>Arquivos recentes</CardTitle></CardHeader><CardContent><FileList files={scopedFiles} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Notas</CardTitle></CardHeader><CardContent><NotesList notes={scopedNotes} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Trabalhos</CardTitle></CardHeader><CardContent><TaskList tasks={scopedTasks} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="files" className="space-y-5"><FileDropzone /><FileList files={scopedFiles} /></TabsContent>
        <TabsContent value="lessons" className="grid gap-4 md:grid-cols-2">
          {["Introdução", "Laboratório", "Revisão final"].map((lesson, index) => (
            <Card key={lesson} className="p-5">
              <Video className="h-5 w-5 text-vault-mint" />
              <h3 className="mt-4 font-semibold">Aula {index + 1}: {lesson}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Materiais, fotos, notas e tarefas vinculadas a esta aula.</p>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="notes"><NotesList notes={scopedNotes} /></TabsContent>
        <TabsContent value="tasks"><TaskList tasks={scopedTasks} /></TabsContent>
        <TabsContent value="agenda"><EventTimeline events={scopedEvents} /></TabsContent>
        <TabsContent value="ai"><SummaryStudio /></TabsContent>
      </Tabs>
    </div>
  );
}
