import { create } from "zustand";

export type AppRoute = "dashboard" | "classroom" | "calendar" | "summaries" | "tasks" | "settings";

type NavigationState = {
  activeRoute: AppRoute;
  selectedClassroomId: string;
  setRoute: (route: AppRoute) => void;
  openClassroom: (id: string) => void;
};

export const useNavigationStore = create<NavigationState>((set) => ({
  activeRoute: "dashboard",
  selectedClassroomId: "classroom-product-design",
  setRoute: (route) => set({ activeRoute: route }),
  openClassroom: (id) => set({ selectedClassroomId: id, activeRoute: "classroom" })
}));
