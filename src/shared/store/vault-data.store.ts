import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarEvent } from "@/modules/calendar/types/calendar.types";
import type { Classroom } from "@/modules/classrooms/types/classroom.types";
import type { VaultFile } from "@/modules/files/types/file.types";
import type { Note } from "@/modules/notes/types/note.types";
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
  addClassroom: (input: CreateClassroomInput) => Promise<Classroom | null>;
  editClassroom: (classroom: Partial<Classroom> & { id: string }) => Promise<void>;
  removeClassroom: (id: string) => Promise<void>;
  addNote: (input: CreateNoteInput) => Promise<Note>;
  addTask: (input: CreateTaskInput) => Promise<Task>;
  addFile: (input: UploadFileInput) => Promise<VaultFile>;
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
          requireUserId();
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
          requireUserId();
          const client = requireSupabaseClient();
          const { error } = await client.from("classrooms").delete().eq("id", id);
          if (error) throw error;

          set((state) => ({
            classrooms: state.classrooms.filter((item) => item.id !== id),
            notes: state.notes.filter((item) => item.classroomId !== id),
            tasks: state.tasks.filter((item) => item.classroomId !== id),
            files: state.files.filter((item) => item.classroomId !== id),
            events: state.events.filter((item) => item.classroomId !== id),
            syncError: null
          }));
        } catch (error) {
          logAppError("vault.removeClassroom", error, { classroomId: id });
          set({ syncError: getErrorMessage(error) });
          throw error;
        }
      },
      addNote: async ({ classroomId, title, preview }) => {
        try {
          requireUserId();
          const client = requireSupabaseClient();
          const normalizedTitle = assertNonEmpty(title, "Titulo da nota");
          const { data, error } = await client
            .from("notes")
            .insert({
              id: crypto.randomUUID(),
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
          requireUserId();
          const client = requireSupabaseClient();
          const normalizedTitle = assertNonEmpty(title, "Nome da tarefa");
          const dueAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
          const { data, error } = await client
            .from("tasks")
            .insert({
              id: crypto.randomUUID(),
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
          const [classroomsResult, notesResult, tasksResult, filesResult, eventsResult] = await Promise.all([
            supabase
              .from("classrooms")
              .select("id,title,code,color,icon,professor,description,categories,created_at")
              .eq("user_id", userId)
              .order("created_at", { ascending: false }),
            supabase.from("notes").select("*").order("created_at", { ascending: false }),
            supabase.from("tasks").select("*").order("created_at", { ascending: false }),
            supabase.from("files").select("*").order("created_at", { ascending: false }),
            supabase.from("events").select("*").order("starts_at", { ascending: true })
          ]);

          if (classroomsResult.error) throw classroomsResult.error;
          if (notesResult.error) throw notesResult.error;
          if (tasksResult.error) throw tasksResult.error;
          if (filesResult.error) throw filesResult.error;
          if (eventsResult.error) throw eventsResult.error;

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
            lessons: []
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
            syncError: null
          });
        } catch (error) {
          logAppError("vault.loadRemoteData", error, { userId });
          set({ classrooms: [], notes: [], tasks: [], files: [], events: [], syncError: getErrorMessage(error) });
          throw error;
        }
      },
      clearUserData: () => {
        set({ userId: null, classrooms: [], notes: [], files: [], tasks: [], events: [], syncError: null });
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
        events: state.events
      })
    }
  )
);
