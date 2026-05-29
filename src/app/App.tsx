import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DashboardPage } from "@/modules/dashboard/pages/DashboardPage";
import { ClassroomPage } from "@/modules/classrooms/pages/ClassroomPage";
import { CalendarPage } from "@/modules/calendar/pages/CalendarPage";
import { PremiumPage } from "@/modules/premium/pages/PremiumPage";
import { SummariesPage } from "@/modules/summaries/pages/SummariesPage";
import { TasksPage } from "@/modules/tasks/pages/TasksPage";
import { AuthPage } from "@/modules/auth/pages/AuthPage";
import { SettingsPage } from "@/modules/settings/pages/SettingsPage";
import { AdminPage } from "@/modules/admin/pages/AdminPage";
import { AppShell } from "@/shared/layouts/AppShell";
import { useNavigationStore } from "@/shared/store/navigation.store";
import { useThemeStore } from "@/shared/store/theme.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useVaultDataStore } from "@/shared/store/vault-data.store";
import { supabase } from "@/shared/services/supabase.client";

const pageMap = {
  dashboard: DashboardPage,
  classroom: ClassroomPage,
  calendar: CalendarPage,
  premium: PremiumPage,
  summaries: SummariesPage,
  tasks: TasksPage,
  settings: SettingsPage,
  admin: AdminPage
};

export function App() {
  const activeRoute = useNavigationStore((state) => state.activeRoute);
  const applyTheme = useThemeStore((state) => state.applyTheme);
  const { user, loading, init } = useAuthStore();
  const loadRemoteData = useVaultDataStore((state) => state.loadRemoteData);
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const Page = pageMap[activeRoute];

  // Handle OAuth callback
  useEffect(() => {
    async function handleOAuthCallback() {
      if (!supabase || isProcessingCallback) return;

      // Check if this is an OAuth callback
      const hash = window.location.hash;
      const hasAuthParams = hash.includes('access_token') || hash.includes('refresh_token') || hash.includes('type=signup');
      
      if (hasAuthParams) {
        setIsProcessingCallback(true);
        try {
          // Use the built-in session recovery from URL
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('OAuth callback error:', error);
          } else if (data.session) {
            // Successfully authenticated
            await init();
            // Clean URL - remove auth params but keep the path
            const cleanUrl = window.location.pathname + window.location.search;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } catch (err) {
          console.error('Error processing OAuth callback:', err);
        } finally {
          setIsProcessingCallback(false);
        }
      }
    }

    void handleOAuthCallback();
  }, [isProcessingCallback, init]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (user) void loadRemoteData(user.id);
  }, [loadRemoteData, user]);

  if (loading || isProcessingCallback) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <div className="text-center space-y-4">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-vault-mint border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {isProcessingCallback ? 'Conectando sua conta...' : 'Carregando ClassVault...'}
          </p>
        </div>
      </div>
    );
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
