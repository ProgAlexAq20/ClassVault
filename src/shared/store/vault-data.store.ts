import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarEvent } from "@/modules/calendar/types/calendar.types";
import type { Classroom } from "@/modules/classrooms/types/classroom.types";
import type { VaultFile } from "@/modules/files/types/file.types";
import type { Note } from "@/modules/notes/types/note.types";
import type { Lesson } from "@/modules/classrooms/types/classroom.types";
import type { SummaryResult } from "@/modules/summaries/types/summary.types";
import type { Task } from "@/modules/tasks/types/task.types";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { assertNonEmpty, getErrorMessage, logAppError } from "@/shared/services/app-error";
import { requireSupabaseClient, supabase } from "@/shared/services/supabase.client";

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

type VaultDataState = {
  userId: string | null;
  syncError: string | null;
  classrooms: Classroom[];
  notes: Note[];
  files: VaultFile[];
  tasks: Task[];
  events: CalendarEvent[];
  summaries: SummaryResult[];
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

const canSync = () => {
  const paymentStatus = useAuthStore.getState().paymentStatus;
  return paymentStatus === "active" || paymentStatus === "beta";
};

function requireUserId() {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) throw new Error("Sessao expirada. Entre novamente para sincronizar os dados.");
  return userId;
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

export const useVaultDataStore = create<VaultDataState>()(
  persist(
    (set, get) => ({
      userId: null,
      syncError: null,
      classrooms: [],
      notes: [],
      files: [],
      tasks: [],
      events: [],
      summaries: [],
      addClassroom: async ({ title, professor, color, description, categories }) => {
        try {
          const userId = requireUserId();
          if (!canSync()) throw new Error("Sua conta ainda nao esta liberada para sincronizacao.");

          const paymentStatus = useAuthStore.getState().paymentStatus;
          if (paymentStatus === "beta" && get().classrooms.length >= 3) return null;

          const client = requireSupabaseClient();
          const normalizedTitle = assertNonEmpty(title, "Nome da materia");
          const nextCount = get().classrooms.length + 1;
          const id = crypto.randomUUID();
          const row = {
            id,
            user_id: userId,
            title: normalizedTitle,
            code: `CV-${String(nextCount).padStart(3, "0")}`,
            color: color ?? colors[nextCount % colors.length],
            icon: "graduation-cap",
            professor: professor?.trim() || "Professor a definir",
            description: description?.trim() || "",
            categories: categories ?? []
          };

          const { data, error } = await client.from("classrooms").insert(row).select("*").single();
          if (error) throw error;

          const classroom: Classroom = {
            id: data.id,
            title: data.title,
            code: data.code,
            professor: data.professor ?? "Professor a definir",
            color: data.color,
            icon: data.icon as Classroom["icon"],
            progress: 0,
            nextClass: "Sem aula marcada",
            fileCount: 0,
            noteCount: 0,
            taskCount: 0,
            description: data.description ?? "",
            categories: data.categories ?? [],
            lessons: []
          };

          set((state) => ({ classrooms: [classroom, ...state.classrooms], syncError: null, userId }));
          return classroom;
        } catch (error) {
          logAppError("vault.addClassroom", error);
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      editClassroom: async (classroom) => {
        try {
          const userId = requireUserId();
          const client = requireSupabaseClient();
          const update = {
            title: classroom.title ? assertNonEmpty(classroom.title, "Nome da materia") : undefined,
            professor: classroom.professor?.trim(),
            color: classroom.color,
            description: classroom.description?.trim(),
            categories: classroom.categories
          };

          const { data, error } = await client
            .from("classrooms")
            .update(update)
            .eq("id", classroom.id)
            .eq("user_id", userId)
            .select("*")
            .single();
          if (error) throw error;

          set((state) => ({
            classrooms: state.classrooms.map((item) =>
              item.id === classroom.id
                ? {
                    ...item,
                    title: data.title,
                    professor: data.professor ?? "Professor a definir",
                    color: data.color,
                    description: data.description ?? "",
                    categories: data.categories ?? []
                  }
                : item
            ),
            syncError: null
          }));
        } catch (error) {
          logAppError("vault.editClassroom", error, { classroomId: classroom.id });
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      removeClassroom: async (id) => {
        try {
          const userId = requireUserId();
          const client = requireSupabaseClient();
          const { error } = await client.from("classrooms").delete().eq("id", id).eq("user_id", userId);
          if (error) throw error;

          set((state) => ({
            classrooms: state.classrooms.filter((item) => item.id !== id),
            notes: state.notes.filter((item) => item.classroomId !== id),
            tasks: state.tasks.filter((item) => item.classroomId !== id),
            files: state.files.filter((item) => item.classroomId !== id),
            events: state.events.filter((item) => item.classroomId !== id),
            summaries: state.summaries.filter((item) => item.classroomId !== id),
            syncError: null
          }));
        } catch (error) {
          logAppError("vault.removeClassroom", error, { classroomId: id });
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      addLesson: async ({ classroomId, title, startsAt, description }) => {
        try {
          const userId = requireUserId();
          const client = requireSupabaseClient();
          const normalizedTitle = assertNonEmpty(title, "Titulo da aula");
          if (!startsAt) throw new Error("Data da aula e obrigatoria.");

          const { data, error } = await client
            .from("lessons")
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              classroom_id: classroomId,
              title: normalizedTitle,
              starts_at: startsAt,
              description: description?.trim() || null
            })
            .select("*")
            .single();
          if (error) throw error;

          const lesson: Lesson = {
            id: data.id,
            classroomId: data.classroom_id,
            title: data.title,
            startsAt: data.starts_at,
            description: data.description ?? undefined
          };

          set((state) => ({
            classrooms: state.classrooms.map((item) =>
              item.id === classroomId ? { ...item, lessons: [lesson, ...(item.lessons ?? [])] } : item
            ),
            syncError: null
          }));
          return lesson;
        } catch (error) {
          logAppError("vault.addLesson", error, { classroomId });
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      addNote: async ({ classroomId, title, preview }) => {
        try {
          const userId = requireUserId();
          const client = requireSupabaseClient();
          const normalizedTitle = assertNonEmpty(title, "Titulo da nota");
          const { data, error } = await client
            .from("notes")
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              classroom_id: classroomId,
              title: normalizedTitle,
              content: preview?.trim() || "Nova anotacao criada no ClassVault."
            })
            .select("*")
            .single();
          if (error) throw error;

          const note: Note = {
            id: data.id,
            classroomId: data.classroom_id,
            lessonId: data.lesson_id ?? undefined,
            title: data.title,
            preview: data.content,
            updatedAt: "Agora"
          };

          set((state) => ({
            notes: [note, ...state.notes],
            classrooms: state.classrooms.map((item) =>
              item.id === classroomId ? { ...item, noteCount: item.noteCount + 1 } : item
            ),
            syncError: null
          }));
          return note;
        } catch (error) {
          logAppError("vault.addNote", error, { classroomId });
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      addTask: async ({ classroomId, title }) => {
        try {
          const userId = requireUserId();
          const client = requireSupabaseClient();
          const normalizedTitle = assertNonEmpty(title, "Nome da tarefa");
          const dueAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
          const { data, error } = await client
            .from("tasks")
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              classroom_id: classroomId,
              title: normalizedTitle,
              status: "todo",
              priority: "medium",
              due_at: dueAt
            })
            .select("*")
            .single();
          if (error) throw error;

          const task: Task = {
            id: data.id,
            classroomId: data.classroom_id,
            title: data.title,
            dueAt: data.due_at ?? dueAt,
            priority: data.priority as Task["priority"],
            status: data.status as Task["status"]
          };

          set((state) => ({
            tasks: [task, ...state.tasks],
            classrooms: state.classrooms.map((item) =>
              item.id === classroomId ? { ...item, taskCount: item.taskCount + 1 } : item
            ),
            syncError: null
          }));
          return task;
        } catch (error) {
          logAppError("vault.addTask", error, { classroomId });
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      addEvent: async ({ classroomId, title, startsAt, endsAt, type = "event" }) => {
        try {
          const userId = requireUserId();
          const client = requireSupabaseClient();
          const normalizedTitle = assertNonEmpty(title, "Titulo do evento");
          if (!startsAt) throw new Error("Data do evento e obrigatoria.");

          const { data, error } = await client
            .from("events")
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              classroom_id: classroomId ?? null,
              title: normalizedTitle,
              starts_at: startsAt,
              ends_at: endsAt || null,
              type
            })
            .select("*")
            .single();
          if (error) throw error;

          const event: CalendarEvent = {
            id: data.id,
            classroomId: data.classroom_id ?? undefined,
            title: data.title,
            startsAt: data.starts_at,
            endsAt: data.ends_at ?? undefined,
            type: data.type as CalendarEvent["type"]
          };

          set((state) => ({ events: [...state.events, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), syncError: null }));
          return event;
        } catch (error) {
          logAppError("vault.addEvent", error, { classroomId: classroomId ?? null });
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      addFile: async ({ classroomId, file, category = "Referências" }) => {
        try {
          const userId = requireUserId();
          const client = requireSupabaseClient();
          if (file.size > 20 * 1024 * 1024) throw new Error("Arquivo acima do limite de 20 MB.");

          const id = crypto.randomUUID();
          const storagePath = `${userId}/${classroomId}/${id}-${safeStorageName(file.name)}`;
          const upload = await client.storage
            .from("classvault-files")
            .upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
          if (upload.error) throw upload.error;

          const { data, error } = await client
            .from("files")
            .insert({
              id,
              user_id: userId,
              classroom_id: classroomId,
              name: file.name,
              storage_path: storagePath,
              mime_type: file.type || "application/octet-stream",
              category,
              size_bytes: file.size
            })
            .select("*")
            .single();
          if (error) throw error;

          const vaultFile: VaultFile = {
            id: data.id,
            classroomId: data.classroom_id,
            lessonId: data.lesson_id ?? undefined,
            name: data.name,
            type: mapFileType(data.mime_type, data.name),
            category: data.category as VaultFile["category"],
            size: `${Math.max(1, Math.round(data.size_bytes / 1024))} KB`,
            createdAt: data.created_at
          };

          set((state) => ({
            files: [vaultFile, ...state.files],
            classrooms: state.classrooms.map((item) =>
              item.id === classroomId ? { ...item, fileCount: item.fileCount + 1 } : item
            ),
            syncError: null
          }));
          return vaultFile;
        } catch (error) {
          logAppError("vault.addFile", error, { classroomId, fileName: file.name });
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      addSummary: async ({ classroomId, provider, mode, content }) => {
        try {
          const userId = requireUserId();
          const client = requireSupabaseClient();
          const normalizedContent = assertNonEmpty(content, "Conteudo do resumo", 60000);

          const { data, error } = await client
            .from("summaries")
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
              classroom_id: classroomId,
              provider,
              mode,
              content: normalizedContent
            })
            .select("*")
            .single();
          if (error) throw error;

          const summary: SummaryResult = {
            id: data.id,
            classroomId: data.classroom_id,
            title: "Resumo salvo",
            mode: data.mode as SummaryResult["mode"],
            content: data.content,
            createdAt: data.created_at
          };

          set((state) => ({ summaries: [summary, ...state.summaries], syncError: null }));
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
        set({ userId, syncError: null });
        if (!supabase) return;

        try {
          const [classroomsResult, lessonsResult, notesResult, tasksResult, filesResult, eventsResult, summariesResult] = await Promise.all([
            supabase
              .from("classrooms")
              .select("id,title,code,color,icon,professor,description,categories,created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false }),
            supabase.from("lessons").select("*").eq("user_id", userId).order("starts_at", { ascending: true }),
            supabase.from("notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
            supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
            supabase.from("files").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
            supabase.from("events").select("*").eq("user_id", userId).order("starts_at", { ascending: true }),
            supabase.from("summaries").select("*").eq("user_id", userId).order("created_at", { ascending: false })
          ]);

          if (classroomsResult.error) throw classroomsResult.error;
          if (lessonsResult.error) throw lessonsResult.error;
          if (notesResult.error) throw notesResult.error;
          if (tasksResult.error) throw tasksResult.error;
          if (filesResult.error) throw filesResult.error;
          if (eventsResult.error) throw eventsResult.error;
          if (summariesResult.error) throw summariesResult.error;

          const remoteLessons = lessonsResult.data ?? [];
          const remoteNotes = notesResult.data ?? [];
          const remoteTasks = tasksResult.data ?? [];
          const remoteFiles = filesResult.data ?? [];
          const remoteClassrooms: Classroom[] = (classroomsResult.data ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            code: item.code,
            professor: item.professor ?? "Professor a definir",
            color: item.color,
            icon: item.icon as Classroom["icon"],
            progress: 0,
            nextClass: "Sem aula marcada",
            fileCount: remoteFiles.filter((file) => file.classroom_id === item.id).length,
            noteCount: remoteNotes.filter((note) => note.classroom_id === item.id).length,
            taskCount: remoteTasks.filter((task) => task.classroom_id === item.id).length,
            description: item.description ?? "",
            categories: item.categories ?? [],
            lessons: remoteLessons
              .filter((lesson) => lesson.classroom_id === item.id)
              .map((lesson) => ({
                id: lesson.id,
                classroomId: lesson.classroom_id,
                title: lesson.title,
                startsAt: lesson.starts_at,
                description: lesson.description ?? undefined
              }))
          }));

          set({
            classrooms: remoteClassrooms,
            notes: remoteNotes.map((item) => ({
              id: item.id,
              classroomId: item.classroom_id,
              lessonId: item.lesson_id ?? undefined,
              title: item.title,
              preview: item.content,
              updatedAt: "Cloud"
            })),
            tasks: remoteTasks.map((item) => ({
              id: item.id,
              classroomId: item.classroom_id,
              title: item.title,
              dueAt: item.due_at ?? new Date().toISOString(),
              priority: item.priority as Task["priority"],
              status: item.status as Task["status"]
            })),
            files: remoteFiles.map((item) => ({
              id: item.id,
              classroomId: item.classroom_id,
              lessonId: item.lesson_id ?? undefined,
              name: item.name,
              type: mapFileType(item.mime_type, item.name),
              category: item.category as VaultFile["category"],
              size: `${Math.max(1, Math.round(item.size_bytes / 1024))} KB`,
              createdAt: item.created_at
            })),
            events: (eventsResult.data ?? []).map((item) => ({
              id: item.id,
              classroomId: item.classroom_id ?? undefined,
              title: item.title,
              startsAt: item.starts_at,
              endsAt: item.ends_at ?? undefined,
              type: item.type as CalendarEvent["type"]
            })),
            summaries: (summariesResult.data ?? []).map((item) => ({
              id: item.id,
              classroomId: item.classroom_id,
              title: "Resumo salvo",
              mode: item.mode as SummaryResult["mode"],
              content: item.content,
              createdAt: item.created_at
            })),
            syncError: null
          });
        } catch (error) {
          logAppError("vault.loadRemoteData", error, { userId });
          set({ classrooms: [], notes: [], tasks: [], files: [], events: [], summaries: [], syncError: getErrorMessage(error) });
          throw error;
        }
      },
      clearUserData: () => {
        set({ userId: null, classrooms: [], notes: [], files: [], tasks: [], events: [], summaries: [], syncError: null });
      }
    }),
    {
      name: "classvault-data",
      partialize: (state) => ({
        userId: state.userId,
        classrooms: state.classrooms,
        notes: state.notes,
        files: state.files,
        tasks: state.tasks,
        events: state.events,
        summaries: state.summaries
      })
    }
  )
);
