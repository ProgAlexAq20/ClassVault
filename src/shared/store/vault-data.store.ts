import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CalendarEvent } from "@/modules/calendar/types/calendar.types";
import type { Classroom } from "@/modules/classrooms/types/classroom.types";
import type { VaultFile } from "@/modules/files/types/file.types";
import type { Note } from "@/modules/notes/types/note.types";
import type { Task } from "@/modules/tasks/types/task.types";
import { classrooms, events, files, notes, tasks } from "@/shared/data/mock-data";

type CreateClassroomInput = {
  title: string;
  professor?: string;
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
  classrooms: Classroom[];
  notes: Note[];
  files: VaultFile[];
  tasks: Task[];
  events: CalendarEvent[];
  addClassroom: (input: CreateClassroomInput) => Classroom;
  addNote: (input: CreateNoteInput) => Note;
  addTask: (input: CreateTaskInput) => Task;
  addQuickEntry: (title: string) => Task;
};

const colors = ["#8fce9e", "#39ff88", "#b7e4c7", "#dff5e5"];

export const useVaultDataStore = create<VaultDataState>()(
  persist(
    (set, get) => ({
      classrooms,
      notes,
      files,
      tasks,
      events,
      addClassroom: ({ title, professor }) => {
        const nextCount = get().classrooms.length + 1;
        const classroom: Classroom = {
          id: crypto.randomUUID(),
          title,
          code: `CV-${String(nextCount).padStart(3, "0")}`,
          professor: professor || "Professor a definir",
          color: colors[nextCount % colors.length],
          icon: "graduation-cap",
          progress: 0,
          nextClass: "Sem aula marcada",
          fileCount: 0,
          noteCount: 0,
          taskCount: 0
        };
        set((state) => ({ classrooms: [classroom, ...state.classrooms] }));
        return classroom;
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
        return task;
      },
      addQuickEntry: (title) => {
        const classroomId = get().classrooms[0]?.id ?? "inbox";
        return get().addTask({ classroomId, title });
      }
    }),
    {
      name: "classvault-data"
    }
  )
);
