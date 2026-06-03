import { create } from "zustand";
import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore/lite";
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import type { CalendarEvent } from "@/modules/calendar/types/calendar.types";
import type { Classroom, Lesson } from "@/modules/classrooms/types/classroom.types";
import type { VaultFile } from "@/modules/files/types/file.types";
import type { Note } from "@/modules/notes/types/note.types";
import type { SummaryResult } from "@/modules/summaries/types/summary.types";
import type { Task } from "@/modules/tasks/types/task.types";
import { assertNonEmpty, getErrorMessage, logAppError } from "@/shared/services/app-error";
import { requireFirestore, requireStorage } from "@/shared/services/firebase.client";

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
  removeFile: (id: string) => Promise<void>;
  addSummary: (input: CreateSummaryInput) => Promise<SummaryResult>;
  addQuickEntry: (title: string) => Promise<Task | null>;
  loadRemoteData: (userId: string) => Promise<void>;
  clearUserData: () => void;
};

type FirestoreData = Record<string, unknown>;

const colors = ["#8fce9e", "#39ff88", "#b7e4c7", "#dff5e5"];
const emptySnapshot: VaultDataSnapshot = {
  classrooms: [],
  notes: [],
  files: [],
  tasks: [],
  events: [],
  summaries: []
};

function cacheKey(userId: string) {
  return `classvault-data:${userId}`;
}

function userCollection(userId: string, collectionName: string) {
  return collection(requireFirestore(), "users", userId, collectionName);
}

function userDocument(userId: string, collectionName: string, id: string) {
  return doc(requireFirestore(), "users", userId, collectionName, id);
}

function requireLoadedUserId(userId: string | null) {
  if (!userId) throw new Error("Sessao expirada. Entre novamente para sincronizar os dados.");
  return userId;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function dataOf(value: unknown): FirestoreData {
  return value && typeof value === "object" ? (value as FirestoreData) : {};
}

function mapFileType(mimeType: string, name: string): VaultFile["type"] {
  if (mimeType.includes("image")) return "image";
  if (mimeType.includes("pdf")) return "pdf";
  if (name.toLowerCase().endsWith(".docx")) return "docx";
  return "text";
}

function safeStorageName(fileName: string) {
  return fileName.normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

function readCache(userId: string): VaultDataSnapshot {
  const raw = localStorage.getItem(cacheKey(userId));
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

function writeCache(userId: string, snapshot: VaultDataSnapshot) {
  localStorage.setItem(cacheKey(userId), JSON.stringify(snapshot));
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

function persistCache(state: VaultDataState) {
  if (state.userId) writeCache(state.userId, snapshotFromState(state));
}

function classroomFromData(id: string, raw: unknown, lessons: Lesson[], counts: { files: number; notes: number; tasks: number }): Classroom {
  const data = dataOf(raw);
  return {
    id,
    title: isString(data.title) ? data.title : "Materia sem titulo",
    code: isString(data.code) ? data.code : "CV-000",
    professor: isString(data.professor) ? data.professor : "Professor a definir",
    color: isString(data.color) ? data.color : colors[0],
    icon: data.icon === "brain" || data.icon === "search" ? data.icon : "graduation-cap",
    progress: typeof data.progress === "number" ? data.progress : 0,
    nextClass: isString(data.nextClass) ? data.nextClass : "Sem aula marcada",
    fileCount: counts.files,
    noteCount: counts.notes,
    taskCount: counts.tasks,
    description: optionalString(data.description) ?? "",
    categories: isStringArray(data.categories) ? data.categories : [],
    lessons
  };
}

function lessonFromData(id: string, raw: unknown): Lesson {
  const data = dataOf(raw);
  return {
    id,
    classroomId: isString(data.classroomId) ? data.classroomId : "",
    title: isString(data.title) ? data.title : "Aula sem titulo",
    startsAt: isString(data.startsAt) ? data.startsAt : new Date().toISOString(),
    description: optionalString(data.description)
  };
}

function noteFromData(id: string, raw: unknown): Note {
  const data = dataOf(raw);
  return {
    id,
    classroomId: isString(data.classroomId) ? data.classroomId : "",
    lessonId: optionalString(data.lessonId),
    title: isString(data.title) ? data.title : "Nota sem titulo",
    preview: isString(data.preview) ? data.preview : "",
    updatedAt: isString(data.updatedAt) ? data.updatedAt : "Cloud"
  };
}

function taskFromData(id: string, raw: unknown): Task {
  const data = dataOf(raw);
  const priority = data.priority === "low" || data.priority === "high" ? data.priority : "medium";
  const status = data.status === "doing" || data.status === "done" ? data.status : "todo";
  return {
    id,
    classroomId: isString(data.classroomId) ? data.classroomId : "",
    title: isString(data.title) ? data.title : "Tarefa sem titulo",
    dueAt: isString(data.dueAt) ? data.dueAt : new Date().toISOString(),
    priority,
    status
  };
}

function eventFromData(id: string, raw: unknown): CalendarEvent {
  const data = dataOf(raw);
  const type = data.type === "lesson" || data.type === "deadline" || data.type === "exam" ? data.type : "event";
  return {
    id,
    classroomId: optionalString(data.classroomId),
    title: isString(data.title) ? data.title : "Evento sem titulo",
    startsAt: isString(data.startsAt) ? data.startsAt : new Date().toISOString(),
    endsAt: optionalString(data.endsAt),
    type
  };
}

function fileFromData(id: string, raw: unknown): VaultFile {
  const data = dataOf(raw);
  const name = isString(data.name) ? data.name : "arquivo";
  const mimeType = isString(data.mimeType) ? data.mimeType : "application/octet-stream";
  const category =
    data.category === "Aulas" || data.category === "Fotos" || data.category === "Trabalhos" || data.category === "Referências"
      ? data.category
      : "Referências";
  return {
    id,
    classroomId: isString(data.classroomId) ? data.classroomId : "",
    lessonId: optionalString(data.lessonId),
    name,
    type: mapFileType(mimeType, name),
    category,
    size: isString(data.size) ? data.size : "0 KB",
    createdAt: isString(data.createdAt) ? data.createdAt : new Date().toISOString(),
    storagePath: optionalString(data.storagePath),
    downloadUrl: optionalString(data.downloadUrl)
  };
}

function summaryFromData(id: string, raw: unknown): SummaryResult {
  const data = dataOf(raw);
  const mode =
    data.mode === "technical" || data.mode === "checklist" || data.mode === "key-points" || data.mode === "exercises"
      ? data.mode
      : "quick";
  return {
    id,
    classroomId: isString(data.classroomId) ? data.classroomId : "",
    title: isString(data.title) ? data.title : "Resumo salvo",
    mode,
    content: isString(data.content) ? data.content : "",
    createdAt: isString(data.createdAt) ? data.createdAt : new Date().toISOString()
  };
}

async function fetchCollection(userId: string, collectionName: string) {
  const snapshot = await getDocs(query(userCollection(userId, collectionName), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ id: item.id, data: item.data() }));
}

export const useVaultDataStore = create<VaultDataState>((set, get) => ({
  userId: null,
  syncError: null,
  ...emptySnapshot,
  addClassroom: async ({ title, professor, color, description, categories }) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      if (get().classrooms.length >= 3) return null;

      const normalizedTitle = assertNonEmpty(title, "Nome da materia");
      const nextCount = get().classrooms.length + 1;
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const classroom: Classroom = {
        id,
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

      await setDoc(userDocument(userId, "classrooms", id), {
        ...classroom,
        ownerId: userId,
        createdAt,
        updatedAt: createdAt,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp()
      });

      set((state) => ({ classrooms: [classroom, ...state.classrooms], syncError: null }));
      persistCache(get());
      return classroom;
    } catch (error) {
      logAppError("vault.addClassroom", error);
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  editClassroom: async (classroom) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      const current = get().classrooms.find((item) => item.id === classroom.id);
      if (!current) throw new Error("Materia nao encontrada.");

      const next: Classroom = {
        ...current,
        title: classroom.title ? assertNonEmpty(classroom.title, "Nome da materia") : current.title,
        professor: classroom.professor?.trim() || current.professor,
        color: classroom.color ?? current.color,
        description: classroom.description?.trim() ?? current.description,
        categories: classroom.categories ?? current.categories
      };

      await updateDoc(userDocument(userId, "classrooms", classroom.id), {
        title: next.title,
        professor: next.professor,
        color: next.color,
        description: next.description ?? "",
        categories: next.categories ?? [],
        updatedAt: new Date().toISOString(),
        updatedAtServer: serverTimestamp()
      });

      set((state) => ({
        classrooms: state.classrooms.map((item) => (item.id === classroom.id ? next : item)),
        syncError: null
      }));
      persistCache(get());
    } catch (error) {
      logAppError("vault.editClassroom", error, { classroomId: classroom.id });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  removeClassroom: async (id) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      const batch = writeBatch(requireFirestore());
      const filesToRemove = get().files.filter((item) => item.classroomId === id);

      batch.delete(userDocument(userId, "classrooms", id));
      for (const lesson of get().classrooms.find((item) => item.id === id)?.lessons ?? []) {
        batch.delete(userDocument(userId, "lessons", lesson.id));
      }
      for (const note of get().notes.filter((item) => item.classroomId === id)) batch.delete(userDocument(userId, "notes", note.id));
      for (const task of get().tasks.filter((item) => item.classroomId === id)) batch.delete(userDocument(userId, "tasks", task.id));
      for (const event of get().events.filter((item) => item.classroomId === id)) batch.delete(userDocument(userId, "events", event.id));
      for (const summary of get().summaries.filter((item) => item.classroomId === id)) batch.delete(userDocument(userId, "summaries", summary.id));
      for (const file of filesToRemove) batch.delete(userDocument(userId, "files", file.id));
      await batch.commit();

      await Promise.all(
        filesToRemove
          .map((file) => file.storagePath)
          .filter(isString)
          .map((path) => deleteObject(storageRef(requireStorage(), path)).catch(() => undefined))
      );

      set((state) => ({
        classrooms: state.classrooms.filter((item) => item.id !== id),
        notes: state.notes.filter((item) => item.classroomId !== id),
        tasks: state.tasks.filter((item) => item.classroomId !== id),
        files: state.files.filter((item) => item.classroomId !== id),
        events: state.events.filter((item) => item.classroomId !== id),
        summaries: state.summaries.filter((item) => item.classroomId !== id),
        syncError: null
      }));
      persistCache(get());
    } catch (error) {
      logAppError("vault.removeClassroom", error, { classroomId: id });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addLesson: async ({ classroomId, title, startsAt, description }) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      const normalizedTitle = assertNonEmpty(title, "Titulo da aula");
      if (!startsAt) throw new Error("Data da aula e obrigatoria.");

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const lesson: Lesson = {
        id,
        classroomId,
        title: normalizedTitle,
        startsAt,
        description: description?.trim() || undefined
      };

      await setDoc(userDocument(userId, "lessons", id), {
        ...lesson,
        ownerId: userId,
        createdAt,
        updatedAt: createdAt,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp()
      });

      set((state) => ({
        classrooms: state.classrooms.map((item) =>
          item.id === classroomId ? { ...item, lessons: [lesson, ...(item.lessons ?? [])] } : item
        ),
        syncError: null
      }));
      persistCache(get());
      return lesson;
    } catch (error) {
      logAppError("vault.addLesson", error, { classroomId });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addNote: async ({ classroomId, title, preview }) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      const createdAt = new Date().toISOString();
      const note: Note = {
        id: crypto.randomUUID(),
        classroomId,
        title: assertNonEmpty(title, "Titulo da nota"),
        preview: preview?.trim() || "Nova anotacao criada no ClassVault.",
        updatedAt: "Agora"
      };

      await setDoc(userDocument(userId, "notes", note.id), {
        ...note,
        ownerId: userId,
        createdAt,
        updatedAt: createdAt,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp()
      });

      set((state) => ({
        notes: [note, ...state.notes],
        classrooms: state.classrooms.map((item) =>
          item.id === classroomId ? { ...item, noteCount: item.noteCount + 1 } : item
        ),
        syncError: null
      }));
      persistCache(get());
      return note;
    } catch (error) {
      logAppError("vault.addNote", error, { classroomId });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addTask: async ({ classroomId, title }) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      const createdAt = new Date().toISOString();
      const dueAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
      const task: Task = {
        id: crypto.randomUUID(),
        classroomId,
        title: assertNonEmpty(title, "Nome da tarefa"),
        dueAt,
        priority: "medium",
        status: "todo"
      };

      await setDoc(userDocument(userId, "tasks", task.id), {
        ...task,
        ownerId: userId,
        createdAt,
        updatedAt: createdAt,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp()
      });

      set((state) => ({
        tasks: [task, ...state.tasks],
        classrooms: state.classrooms.map((item) =>
          item.id === classroomId ? { ...item, taskCount: item.taskCount + 1 } : item
        ),
        syncError: null
      }));
      persistCache(get());
      return task;
    } catch (error) {
      logAppError("vault.addTask", error, { classroomId });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addEvent: async ({ classroomId, title, startsAt, endsAt, type = "event" }) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      if (!startsAt) throw new Error("Data do evento e obrigatoria.");

      const createdAt = new Date().toISOString();
      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        classroomId,
        title: assertNonEmpty(title, "Titulo do evento"),
        startsAt,
        endsAt: endsAt || undefined,
        type
      };

      await setDoc(userDocument(userId, "events", event.id), {
        ...event,
        ownerId: userId,
        createdAt,
        updatedAt: createdAt,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp()
      });

      set((state) => ({
        events: [...state.events, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
        syncError: null
      }));
      persistCache(get());
      return event;
    } catch (error) {
      logAppError("vault.addEvent", error, { classroomId: classroomId ?? null });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addFile: async ({ classroomId, file, category = "Referências" }) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      if (file.size > 20 * 1024 * 1024) throw new Error("Arquivo acima do limite de 20 MB.");

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const mimeType = file.type || "application/octet-stream";
      const storagePath = `users/${userId}/files/${classroomId}/${id}-${safeStorageName(file.name)}`;
      const uploaded = await uploadBytes(storageRef(requireStorage(), storagePath), file, { contentType: mimeType });
      const downloadUrl = await getDownloadURL(uploaded.ref);
      const vaultFile: VaultFile = {
        id,
        classroomId,
        name: file.name,
        type: mapFileType(mimeType, file.name),
        category,
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        createdAt,
        storagePath,
        downloadUrl
      };

      await setDoc(userDocument(userId, "files", id), {
        ...vaultFile,
        ownerId: userId,
        mimeType,
        sizeBytes: file.size,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp()
      });

      set((state) => ({
        files: [vaultFile, ...state.files],
        classrooms: state.classrooms.map((item) =>
          item.id === classroomId ? { ...item, fileCount: item.fileCount + 1 } : item
        ),
        syncError: null
      }));
      persistCache(get());
      return vaultFile;
    } catch (error) {
      logAppError("vault.addFile", error, { classroomId, fileName: file.name });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  removeFile: async (id) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      const file = get().files.find((item) => item.id === id);
      if (!file) throw new Error("Arquivo nao encontrado.");

      await deleteDoc(userDocument(userId, "files", id));
      if (file.storagePath) await deleteObject(storageRef(requireStorage(), file.storagePath));

      set((state) => ({
        files: state.files.filter((item) => item.id !== id),
        classrooms: state.classrooms.map((item) =>
          item.id === file.classroomId ? { ...item, fileCount: Math.max(0, item.fileCount - 1) } : item
        ),
        syncError: null
      }));
      persistCache(get());
    } catch (error) {
      logAppError("vault.removeFile", error, { fileId: id });
      set({ syncError: getErrorMessage(error) });
      throw error;
    }
  },
  addSummary: async ({ classroomId, provider, mode, content }) => {
    try {
      const userId = requireLoadedUserId(get().userId);
      const createdAt = new Date().toISOString();
      const summary: SummaryResult = {
        id: crypto.randomUUID(),
        classroomId,
        title: "Resumo salvo",
        mode,
        content: assertNonEmpty(content, "Conteudo do resumo", 60000),
        createdAt
      };

      await setDoc(userDocument(userId, "summaries", summary.id), {
        ...summary,
        ownerId: userId,
        provider,
        createdAtServer: serverTimestamp(),
        updatedAtServer: serverTimestamp()
      });

      set((state) => ({ summaries: [summary, ...state.summaries], syncError: null }));
      persistCache(get());
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
    set({ userId, syncError: null, ...readCache(userId) });

    try {
      const [classroomDocs, lessonDocs, noteDocs, taskDocs, fileDocs, eventDocs, summaryDocs] = await Promise.all([
        fetchCollection(userId, "classrooms"),
        fetchCollection(userId, "lessons"),
        fetchCollection(userId, "notes"),
        fetchCollection(userId, "tasks"),
        fetchCollection(userId, "files"),
        fetchCollection(userId, "events"),
        fetchCollection(userId, "summaries")
      ]);

      const lessons = lessonDocs.map((item) => lessonFromData(item.id, item.data));
      const notes = noteDocs.map((item) => noteFromData(item.id, item.data));
      const tasks = taskDocs.map((item) => taskFromData(item.id, item.data));
      const files = fileDocs.map((item) => fileFromData(item.id, item.data));
      const events = eventDocs.map((item) => eventFromData(item.id, item.data)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      const summaries = summaryDocs.map((item) => summaryFromData(item.id, item.data));
      const classrooms = classroomDocs.map((item) =>
        classroomFromData(
          item.id,
          item.data,
          lessons.filter((lesson) => lesson.classroomId === item.id),
          {
            files: files.filter((file) => file.classroomId === item.id).length,
            notes: notes.filter((note) => note.classroomId === item.id).length,
            tasks: tasks.filter((task) => task.classroomId === item.id).length
          }
        )
      );
      const snapshot = { classrooms, notes, files, tasks, events, summaries };

      set({ userId, syncError: null, ...snapshot });
      writeCache(userId, snapshot);
    } catch (error) {
      logAppError("vault.loadRemoteData", error, { userId });
      set({ syncError: getErrorMessage(error), ...readCache(userId) });
    }
  },
  clearUserData: () => {
    set({ userId: null, syncError: null, ...emptySnapshot });
  }
}));
