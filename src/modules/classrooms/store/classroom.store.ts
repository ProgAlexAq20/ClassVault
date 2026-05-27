import { create } from "zustand";

type ClassroomStore = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export const useClassroomStore = create<ClassroomStore>((set) => ({
  activeTab: "overview",
  setActiveTab: (activeTab) => set({ activeTab })
}));
