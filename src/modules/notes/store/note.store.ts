import { create } from "zustand";

type NoteStore = {
  draft: string;
  setDraft: (draft: string) => void;
};

export const useNoteStore = create<NoteStore>((set) => ({
  draft: "",
  setDraft: (draft) => set({ draft })
}));
