import { create } from "zustand";

type TaskStore = {
  filter: "all" | "todo" | "doing" | "done";
  setFilter: (filter: "all" | "todo" | "doing" | "done") => void;
};

export const useTaskStore = create<TaskStore>((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter })
}));
