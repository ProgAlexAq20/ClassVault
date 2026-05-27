import { create } from "zustand";

type CalendarStore = {
  mode: "month" | "week";
  setMode: (mode: "month" | "week") => void;
};

export const useCalendarStore = create<CalendarStore>((set) => ({
  mode: "month",
  setMode: (mode) => set({ mode })
}));
