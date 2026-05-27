import type { CalendarEvent } from "@/modules/calendar/types/calendar.types";
import type { Classroom } from "@/modules/classrooms/types/classroom.types";
import type { VaultFile } from "@/modules/files/types/file.types";
import type { Note } from "@/modules/notes/types/note.types";
import type { Task } from "@/modules/tasks/types/task.types";

export const classrooms: Classroom[] = [
  {
    id: "classroom-product-design",
    title: "Design de Produto",
    code: "DP-302",
    professor: "Marina Lopes",
    color: "#8fce9e",
    icon: "graduation-cap",
    progress: 74,
    nextClass: "Hoje, 19:00",
    fileCount: 18,
    noteCount: 12,
    taskCount: 5
  },
  {
    id: "classroom-data",
    title: "Ciência de Dados",
    code: "CD-210",
    professor: "Rafael Kim",
    color: "#b7e4c7",
    icon: "brain",
    progress: 62,
    nextClass: "Amanhã, 08:30",
    fileCount: 25,
    noteCount: 9,
    taskCount: 3
  },
  {
    id: "classroom-ux-research",
    title: "Pesquisa UX",
    code: "UX-118",
    professor: "Aline Costa",
    color: "#dff5e5",
    icon: "search",
    progress: 88,
    nextClass: "Sex, 14:00",
    fileCount: 11,
    noteCount: 16,
    taskCount: 2
  }
];

export const tasks: Task[] = [
  { id: "task-1", classroomId: "classroom-product-design", title: "Entrega do estudo de caso", dueAt: "2026-05-29T21:00:00", priority: "high", status: "todo" },
  { id: "task-2", classroomId: "classroom-data", title: "Notebook de regressão", dueAt: "2026-06-02T23:00:00", priority: "medium", status: "doing" },
  { id: "task-3", classroomId: "classroom-ux-research", title: "Roteiro de entrevistas", dueAt: "2026-06-05T18:00:00", priority: "low", status: "todo" }
];

export const files: VaultFile[] = [
  { id: "file-1", classroomId: "classroom-product-design", name: "Briefing sprint final.pdf", type: "pdf", category: "Trabalhos", size: "2.4 MB", createdAt: "2026-05-24" },
  { id: "file-2", classroomId: "classroom-data", name: "Dataset limpo.csv", type: "sheet", category: "Aulas", size: "840 KB", createdAt: "2026-05-23" },
  { id: "file-3", classroomId: "classroom-ux-research", name: "Mapa de afinidade.png", type: "image", category: "Fotos", size: "4.1 MB", createdAt: "2026-05-22" }
];

export const notes: Note[] = [
  { id: "note-1", classroomId: "classroom-product-design", title: "Critérios de avaliação", preview: "Clareza do problema, evidência do processo e protótipo navegável.", updatedAt: "Hoje" },
  { id: "note-2", classroomId: "classroom-data", title: "Modelos lineares", preview: "Checar multicolinearidade antes do ajuste final.", updatedAt: "Ontem" },
  { id: "note-3", classroomId: "classroom-ux-research", title: "Perguntas abertas", preview: "Evitar indução e pedir exemplos concretos de rotina.", updatedAt: "Seg" }
];

export const events: CalendarEvent[] = [
  { id: "event-1", classroomId: "classroom-product-design", title: "Aula: narrativa visual", startsAt: "2026-05-26T19:00:00", type: "lesson" },
  { id: "event-2", classroomId: "classroom-product-design", title: "Entrega estudo de caso", startsAt: "2026-05-29T21:00:00", type: "deadline" },
  { id: "event-3", classroomId: "classroom-data", title: "Laboratório Python", startsAt: "2026-05-28T08:30:00", type: "lesson" },
  { id: "event-4", classroomId: "classroom-ux-research", title: "Sessão de entrevistas", startsAt: "2026-06-01T14:00:00", type: "event" }
];
