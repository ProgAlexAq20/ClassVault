import { create } from "zustand";

type FileStore = {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
};

export const useFileStore = create<FileStore>((set) => ({
  selectedCategory: "Todos",
  setSelectedCategory: (selectedCategory) => set({ selectedCategory })
}));
