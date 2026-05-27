import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";
import { ClassroomPage } from "@/modules/classrooms/pages/ClassroomPage";
import { CalendarPage } from "@/modules/calendar/pages/CalendarPage";
import { SummariesPage } from "@/modules/summaries/pages/SummariesPage";
import { TasksPage } from "@/modules/tasks/pages/TasksPage";
import { AuthPage } from "@/modules/auth/pages/AuthPage";
import { SettingsPage } from "@/modules/settings/pages/SettingsPage";
import { AppShell } from "@/shared/layouts/AppShell";
import { useNavigationStore } from "@/shared/store/navigation.store";
import { useThemeStore } from "@/shared/store/theme.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

const pageMap = {
  dashboard: DashboardPage,
  classroom: ClassroomPage,
  calendar: CalendarPage,
  summaries: SummariesPage,
  tasks: TasksPage,
  settings: SettingsPage
};

export function App() {
  const activeRoute = useNavigationStore((state) => state.activeRoute);
  const applyTheme = useThemeStore((state) => state.applyTheme);
  const { user, loading, init } = useAuthStore();
  const loadRemoteData = useVaultDataStore((state) => state.loadRemoteData);
  const Page = pageMap[activeRoute];

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (user) void loadRemoteData(user.id);
  }, [loadRemoteData, user]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando ClassVault...</div>;
  }

  if (!user) return <AuthPage />;

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRoute}
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.992 }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        >
          <Page />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
