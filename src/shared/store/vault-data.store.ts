import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarEvent } from "@/modules/calendar/types/calendar.types";
import type { Classroom } from "@/modules/classrooms/types/classroom.types";
import type { VaultFile } from "@/modules/files/types/file.types";
import type { Note } from "@/modules/notes/types/note.types";
import type { Task } from "@/modules/tasks/types/task.types";
import { supabase } from "@/shared/services/supabase.client";
import { useAuthStore } from "@/modules/auth/store/auth.store";

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

type VaultDataState = {
  userId: string | null;
  classrooms: Classroom[];
  notes: Note[];
  files: VaultFile[];
  tasks: Task[];
  events: CalendarEvent[];
  addClassroom: (input: CreateClassroomInput) => Classroom | null;
  editClassroom: (classroom: Partial<Classroom> & { id: string }) => void;
  removeClassroom: (id: string) => void;
  addNote: (input: CreateNoteInput) => Note;
  addTask: (input: CreateTaskInput) => Task;
  addQuickEntry: (title: string) => Task;
  loadRemoteData: (userId: string) => Promise<void>;
};

const colors = ["#8fce9e", "#39ff88", "#b7e4c7", "#dff5e5"];

const canSync = () => useAuthStore.getState().paymentStatus === "active";

export const useVaultDataStore = create<VaultDataState>()(
  persist(
    (set, get) => ({
      userId: null,
      classrooms: [],
      notes: [],
      files: [],
      tasks: [],
      events: [],
      addClassroom: ({ title, professor, color, description, categories, lessons }) => {
        const paymentStatus = useAuthStore.getState().paymentStatus;
        const BETA_MAX_CLASSROOMS = 3;
        if (paymentStatus === 'beta' && get().classrooms.length >= BETA_MAX_CLASSROOMS) {
          console.warn('Limite de matérias para modo Beta atingido');
          return null;
        }
        const nextCount = get().classrooms.length + 1;
        const classroom: Classroom = {
          id: crypto.randomUUID(),
          title,
          code: `CV-${String(nextCount).padStart(3, "0")}`,
          professor: professor || "Professor a definir",
          color: color ?? colors[nextCount % colors.length],
          icon: "graduation-cap",
          progress: 0,
          nextClass: "Sem aula marcada",
          fileCount: 0,
          noteCount: 0,
          taskCount: 0,
          description: description ?? "",
          categories: categories ?? [],
          lessons: (lessons ?? []).map((lessonTitle, index) => ({
            id: crypto.randomUUID(),
            classroomId: "",
            title: lessonTitle,
            startsAt: "",
            description: ""
          }))
        };
        set((state) => ({ classrooms: [classroom, ...state.classrooms] }));
        const userId = get().userId;
        if (supabase && userId && canSync()) {
          void supabase.from("classrooms").insert({
            id: classroom.id,
            user_id: userId,
            title: classroom.title,
            code: classroom.code,
            color: classroom.color,
            icon: classroom.icon,
            professor: classroom.professor,
            description: classroom.description,
            categories: classroom.categories
          } as any);
        }
        return classroom;
      },
      editClassroom: (classroom) => {
        set((state) => ({
          classrooms: state.classrooms.map((item) =>
            item.id === classroom.id ? { ...item, ...classroom } : item
          )
        }));
        const userId = get().userId;
        if (supabase && userId && canSync()) {
          void supabase.from("classrooms").update({
            title: classroom.title,
            professor: classroom.professor,
            color: classroom.color,
            description: classroom.description,
            categories: classroom.categories
          } as any).eq("id", classroom.id);
        }
      },
      removeClassroom: (id) => {
        set((state) => ({
          classrooms: state.classrooms.filter((item) => item.id !== id),
          notes: state.notes.filter((item) => item.classroomId !== id),
          tasks: state.tasks.filter((item) => item.classroomId !== id),
          files: state.files.filter((item) => item.classroomId !== id),
          events: state.events.filter((item) => item.classroomId !== id)
        }));
        const userId = get().userId;
        if (supabase && userId && canSync()) {
          void supabase.from("classrooms").delete().eq("id", id);
        }
      },
      addNote: ({ classroomId, title, preview }) => {
        const note: Note = {
          id: crypto.randomUUID(),
          classroomId,
          title,
          preview: preview || "Nova anotacao criada no ClassVault.",
          updatedAt: "Agora"
        };
        set((state) => ({
          notes: [note, ...state.notes],
          classrooms: state.classrooms.map((classroom) =>
            classroom.id === classroomId ? { ...classroom, noteCount: classroom.noteCount + 1 } : classroom
          )
        }));
        if (supabase && get().userId && canSync()) {
          void supabase.from("notes").insert({
            id: note.id,
            classroom_id: note.classroomId,
            title: note.title,
            content: note.preview
          });
        }
        return note;
      },
      addTask: ({ classroomId, title }) => {
        const task: Task = {
          id: crypto.randomUUID(),
          classroomId,
          title,
          dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
          priority: "medium",
          status: "todo"
        };
        set((state) => ({
          tasks: [task, ...state.tasks],
          classrooms: state.classrooms.map((classroom) =>
            classroom.id === classroomId ? { ...classroom, taskCount: classroom.taskCount + 1 } : classroom
          )
        }));
        if (supabase && get().userId && canSync()) {
          void supabase.from("tasks").insert({
            id: task.id,
            classroom_id: task.classroomId,
            title: task.title,
            status: task.status,
            priority: task.priority,
            due_at: task.dueAt
          });
        }
        return task;
      },
      addQuickEntry: (title) => {
        const classroomId = get().classrooms[0]?.id ?? "inbox";
        return get().addTask({ classroomId, title });
      },
      loadRemoteData: async (userId) => {
        set({ userId });
        if (!supabase) return;

        const [classroomsResult, notesResult, tasksResult, filesResult, eventsResult] = await Promise.all([
          supabase.from("classrooms").select("*").order("created_at", { ascending: false }),
          supabase.from("notes").select("*").order("created_at", { ascending: false }),
          supabase.from("tasks").select("*").order("created_at", { ascending: false }),
          supabase.from("files").select("*").order("created_at", { ascending: false }),
          supabase.from("events").select("*").order("starts_at", { ascending: true })
        ]);

        if (classroomsResult.error) {
          set({ classrooms: [], notes: [], tasks: [], files: [], events: [] });
          return;
        }

        const remoteClassrooms: Classroom[] = (classroomsResult.data ?? []).map((item: any) => ({
          id: item.id,
          title: item.title,
          code: item.code,
          professor: item.professor ?? "Professor a definir",
          color: item.color,
          icon: item.icon as Classroom["icon"],
          progress: 0,
          nextClass: "Sem aula marcada",
          fileCount: 0,
          noteCount: (notesResult.data ?? []).filter((note: any) => note.classroom_id === item.id).length,
          taskCount: (tasksResult.data ?? []).filter((task: any) => task.classroom_id === item.id).length,
          description: item.description ?? "",
          categories: item.categories ?? [],
          lessons: []
        }));

        set({
          classrooms: remoteClassrooms,
          notes: (notesResult.data ?? []).map((item) => ({
            id: item.id,
            classroomId: item.classroom_id,
            lessonId: item.lesson_id ?? undefined,
            title: item.title,
            preview: item.content,
            updatedAt: "Cloud"
          })),
          tasks: (tasksResult.data ?? []).map((item) => ({
            id: item.id,
            classroomId: item.classroom_id,
            title: item.title,
            dueAt: item.due_at ?? new Date().toISOString(),
            priority: item.priority as Task["priority"],
            status: item.status as Task["status"]
          })),
          files: (filesResult.data ?? []).map((item) => ({
            id: item.id,
            classroomId: item.classroom_id,
            lessonId: item.lesson_id ?? undefined,
            name: item.name,
            type: item.mime_type.includes("image") ? "image" : item.mime_type.includes("pdf") ? "pdf" : "text",
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
          }))
        });
      }
    }),
    {
      name: "classvault-data"
    }
  )
);
