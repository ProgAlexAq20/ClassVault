import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";

type ThemeState = {
  theme: Theme;
  toggleTheme: () => void;
  applyTheme: () => void;
};

function syncDocumentTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      toggleTheme: () => {
        const theme = get().theme === "dark" ? "light" : "dark";
        syncDocumentTheme(theme);
        set({ theme });
      },
      applyTheme: () => syncDocumentTheme(get().theme)
    }),
    {
      name: "classvault-theme",
      onRehydrateStorage: () => (state) => state?.applyTheme()
    }
  )
);
