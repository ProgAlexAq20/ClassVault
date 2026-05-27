import { AnimatePresence, motion } from "framer-motion";
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";
import { ClassroomPage } from "@/modules/classrooms/pages/ClassroomPage";
import { CalendarPage } from "@/modules/calendar/pages/CalendarPage";
import { SummariesPage } from "@/modules/summaries/pages/SummariesPage";
import { TasksPage } from "@/modules/tasks/pages/TasksPage";
import { AppShell } from "@/shared/layouts/AppShell";
import { useNavigationStore } from "@/shared/store/navigation.store";

const pageMap = {
  dashboard: DashboardPage,
  classroom: ClassroomPage,
  calendar: CalendarPage,
  summaries: SummariesPage,
  tasks: TasksPage
};

export function App() {
  const activeRoute = useNavigationStore((state) => state.activeRoute);
  const Page = pageMap[activeRoute];

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRoute}
          initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Page />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
