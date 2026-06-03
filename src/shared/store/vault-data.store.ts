import { create } from "zustand";
import type { CalendarEvent } from "@/modules/calendar/types/calendar.types";
import type { Classroom, Lesson } from "@/modules/classrooms/types/classroom.types";
import type { VaultFile } from "@/modules/files/types/file.types";
import type { Note } from "@/modules/notes/types/note.types";
import type { SummaryResult } from "@/modules/summaries/types/summary.types";
import type { Task } from "@/modules/tasks/types/task.types";
import { assertNonEmpty, getErrorMessage, logAppError } from "@/shared/services/app-error";

type CreateClassroomInput = {
  title: string;
  professor?: string;
  color?: string;
  description?: string;
  categories?: string[];
  lessons?: string[];
};

type CreateNoteInput = {
  classroomId: string;
  title: string;
  preview?: string;
};

type CreateTaskInput = {
  classroomId: string;
  title: string;
};

type CreateLessonInput = {
  classroomId: string;
  title: string;
  startsAt: string;
  description?: string;
};

type CreateEventInput = {
  classroomId?: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  type?: CalendarEvent["type"];
};

type CreateSummaryInput = {
  classroomId: string;
  provider: string;
  mode: SummaryResult["mode"];
  content: string;
};

type UploadFileInput = {
  classroomId: string;
  file: File;
  category?: VaultFile["category"];
};

type VaultDataSnapshot = {
  classrooms: Classroom[];
  notes: Note[];
  files: VaultFile[];
  tasks: Task[];
  events: CalendarEvent[];
  summaries: SummaryResult[];
};

type VaultDataState = VaultDataSnapshot & {
  userId: string | null;
  syncError: string | null;
  addClassroom: (input: CreateClassroomInput) => Promise<Classroom | null>;
  editClassroom: (classroom: Partial<Classroom> & { id: string }) => Promise<void>;
  removeClassroom: (id: string) => Promise<void>;
  addLesson: (input: CreateLessonInput) => Promise<Lesson>;
  addNote: (input: CreateNoteInput) => Promise<Note>;
  addTask: (input: CreateTaskInput) => Promise<Task>;
  addEvent: (input: CreateEventInput) => Promise<CalendarEvent>;
  addFile: (input: UploadFileInput) => Promise<VaultFile>;
  addSummary: (input: CreateSummaryInput) => Promise<SummaryResult>;
  addQuickEntry: (title: string) => Promise<Task | null>;
  loadRemoteData: (userId: string) => Promise<void>;
  clearUserData: () => void;
};

const colors = ["#8fce9e", "#39ff88", "#b7e4c7", "#dff5e5"];
const emptySnapshot: VaultDataSnapshot = {
  classrooms: [],
  notes: [],
  files: [],
  tasks: [],
  events: [],
  summaries: []
};

function storageKey(userId: string) {
  return `classvault-data:${userId}`;
}

function requireLoadedUserId(userId: string | null) {
  if (!userId) throw new Error("Sessao expirada. Entre novamente para acessar os dados.");
  return userId;
}

function mapFileType(mimeType: string, name: string): VaultFile["type"] {
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("pdf")) return "pdf";
  if (name.toLowerCase().endsWith(".docx")) return "docx";
  return "text";
}

function readSnapshot(userId: string): VaultDataSnapshot {
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return emptySnapshot;

  try {
    const parsed = JSON.parse(raw) as Partial<VaultDataSnapshot>;
    return {
      classrooms: Array.isArray(parsed.classrooms) ? parsed.classrooms : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      files: Array.isArray(parsed.files) ? parsed.files : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      summaries: Array.isArray(parsed.summaries) ? parsed.summaries : []
    };
  } catch {
    return emptySnapshot;
  }
}

function writeSnapshot(userId: string, snapshot: VaultDataSnapshot) {
  localStorage.setItem(storageKey(userId), JSON.stringify(snapshot));
}

function snapshotFromState(state: VaultDataState): VaultDataSnapshot {
  return {
    classrooms: state.classrooms,
    notes: state.notes,
    files: state.files,
    tasks: state.tasks,
    events: state.events,
    summaries: state.summaries
  };
}

function persistNext(state: VaultDataState) {
  if (state.userId) writeSnapshot(state.userId, snapshotFromState(state));
}

export const useVaultDataStore = create<VaultDataState>((set, get) => ({
  userId: null,
  syncError: null,
  ...emptySnapshot,
  addClassroom: async ({ title, professor, color, description, categories }) => {
    try {
      requireLoadedUserId(get().userId);
      if (get().classrooms.length >= 3) return null;

      const normalizedTitle = assertNonEmpty(title, "Nome da materia");
      const nextCount = get().classrooms.length + 1;
      const classroom: Classroom = {
        id: crypto.randomUUID(),
        title: normalizedTitle,
        code: `CV-${String(nextCount).padStart(3, "0")}`,
        color: color ?? colors[nextCount % colors.length],
        icon: "graduation-cap",
        professor: professor?.trim() || "Professor a definir",
        progress: 0,
        nextClass: "Sem aula marcada",
        fileCount: 0,
        noteCount: 0,
        taskCount: 0,
        description: description?.trim() || "",
        categories: categories ?? [],
        lessons: []
      };

      set((state) => ({ classrooms: [classroom, ...state.classrooms], syncError: null }));
      persistNext(get());
      return classroom;
    } catch (error) {
      logAppError("vault.addClassroom", error);
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  editClassroom: async (classroom) => {
    try {
      requireLoadedUserId(get().userId);
      set((state) => ({
        classrooms: state.classrooms.map((item) =>
          item.id === classroom.id
            ? {
                ...item,
                title: classroom.title ? assertNonEmpty(classroom.title, "Nome da materia") : item.title,
                professor: classroom.professor?.trim() || item.professor,
                color: classroom.color ?? item.color,
                description: classroom.description?.trim() ?? item.description,
                categories: classroom.categories ?? item.categories
              }
            : item
        ),
        syncError: null
      }));
      persistNext(get());
    } catch (error) {
      logAppError("vault.editClassroom", error, { classroomId: classroom.id });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  removeClassroom: async (id) => {
    try {
      requireLoadedUserId(get().userId);
      set((state) => ({
        classrooms: state.classrooms.filter((item) => item.id !== id),
        notes: state.notes.filter((item) => item.classroomId !== id),
        tasks: state.tasks.filter((item) => item.classroomId !== id),
        files: state.files.filter((item) => item.classroomId !== id),
        events: state.events.filter((item) => item.classroomId !== id),
        summaries: state.summaries.filter((item) => item.classroomId !== id),
        syncError: null
      }));
      persistNext(get());
    } catch (error) {
      logAppError("vault.removeClassroom", error, { classroomId: id });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addLesson: async ({ classroomId, title, startsAt, description }) => {
    try {
      requireLoadedUserId(get().userId);
      const normalizedTitle = assertNonEmpty(title, "Titulo da aula");
      if (!startsAt) throw new Error("Data da aula e obrigatoria.");

      const lesson: Lesson = {
        id: crypto.randomUUID(),
        classroomId,
        title: normalizedTitle,
        startsAt,
        description: description?.trim() || undefined
      };

      set((state) => ({
        classrooms: state.classrooms.map((item) =>
          item.id === classroomId ? { ...item, lessons: [lesson, ...(item.lessons ?? [])] } : item
        ),
        syncError: null
      }));
      persistNext(get());
      return lesson;
    } catch (error) {
      logAppError("vault.addLesson", error, { classroomId });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addNote: async ({ classroomId, title, preview }) => {
    try {
      requireLoadedUserId(get().userId);
      const note: Note = {
        id: crypto.randomUUID(),
        classroomId,
        title: assertNonEmpty(title, "Titulo da nota"),
        preview: preview?.trim() || "Nova anotacao criada no ClassVault.",
        updatedAt: "Agora"
      };

      set((state) => ({
        notes: [note, ...state.notes],
        classrooms: state.classrooms.map((item) =>
          item.id === classroomId ? { ...item, noteCount: item.noteCount + 1 } : item
        ),
        syncError: null
      }));
      persistNext(get());
      return note;
    } catch (error) {
      logAppError("vault.addNote", error, { classroomId });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addTask: async ({ classroomId, title }) => {
    try {
      requireLoadedUserId(get().userId);
      const dueAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
      const task: Task = {
        id: crypto.randomUUID(),
        classroomId,
        title: assertNonEmpty(title, "Nome da tarefa"),
        dueAt,
        priority: "medium",
        status: "todo"
      };

      set((state) => ({
        tasks: [task, ...state.tasks],
        classrooms: state.classrooms.map((item) =>
          item.id === classroomId ? { ...item, taskCount: item.taskCount + 1 } : item
        ),
        syncError: null
      }));
      persistNext(get());
      return task;
    } catch (error) {
      logAppError("vault.addTask", error, { classroomId });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addEvent: async ({ classroomId, title, startsAt, endsAt, type = "event" }) => {
    try {
      requireLoadedUserId(get().userId);
      if (!startsAt) throw new Error("Data do evento e obrigatoria.");

      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        classroomId,
        title: assertNonEmpty(title, "Titulo do evento"),
        startsAt,
        endsAt: endsAt || undefined,
        type
      };

      set((state) => ({
        events: [...state.events, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
        syncError: null
      }));
      persistNext(get());
      return event;
    } catch (error) {
      logAppError("vault.addEvent", error, { classroomId: classroomId ?? null });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addFile: async ({ classroomId, file, category = "Referências" }) => {
    try {
      requireLoadedUserId(get().userId);
      if (file.size > 20 * 1024 * 1024) throw new Error("Arquivo acima do limite de 20 MB.");

      const vaultFile: VaultFile = {
        id: crypto.randomUUID(),
        classroomId,
        name: file.name,
        type: mapFileType(file.type || "application/octet-stream", file.name),
        category,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        createdAt: new Date().toISOString()
      };

      set((state) => ({
        files: [vaultFile, ...state.files],
        classrooms: state.classrooms.map((item) =>
          item.id === classroomId ? { ...item, fileCount: item.fileCount + 1 } : item
        ),
        syncError: null
      }));
      persistNext(get());
      return vaultFile;
    } catch (error) {
      logAppError("vault.addFile", error, { classroomId, fileName: file.name });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addSummary: async ({ classroomId, mode, content }) => {
    try {
      requireLoadedUserId(get().userId);
      const summary: SummaryResult = {
        id: crypto.randomUUID(),
        classroomId,
        title: "Resumo salvo",
        mode,
        content: assertNonEmpty(content, "Conteudo do resumo", 60000),
        createdAt: new Date().toISOString()
      };

      set((state) => ({ summaries: [summary, ...state.summaries], syncError: null }));
      persistNext(get());
      return summary;
    } catch (error) {
      logAppError("vault.addSummary", error, { classroomId });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addQuickEntry: async (title) => {
    const classroomId = get().classrooms[0]?.id;
    if (!classroomId) {
      set({ syncError: "Crie uma materia antes de adicionar tarefas rapidas." });
      return null;
    }
    return get().addTask({ classroomId, title });
  },
  loadRemoteData: async (userId) => {
    const snapshot = readSnapshot(userId);
    set({ userId, syncError: null, ...snapshot });
  },
  clearUserData: () => {
    set({ userId: null, syncError: null, ...emptySnapshot });
  }
}));
