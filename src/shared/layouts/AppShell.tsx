import { Bell, Brain, CalendarDays, CheckSquare, GraduationCap, Home, Menu, Moon, Search, Sparkles, Sun } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Logo } from "@/shared/components/Logo";
import { AppRoute, useNavigationStore } from "@/shared/store/navigation.store";
import { useThemeStore } from "@/shared/store/theme.store";
import { useVaultDataStore } from "@/shared/store/vault-data.store";
import { cn } from "@/shared/utils/cn";

const navItems: Array<{ route: AppRoute; label: string; icon: typeof Home }> = [
  { route: "dashboard", label: "Dashboard", icon: Home },
  { route: "classroom", label: "Matérias", icon: GraduationCap },
  { route: "calendar", label: "Agenda", icon: CalendarDays },
  { route: "tasks", label: "Tarefas", icon: CheckSquare },
  { route: "summaries", label: "IA", icon: Brain }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const activeRoute = useNavigationStore((state) => state.activeRoute);
  const setRoute = useNavigationStore((state) => state.setRoute);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const addQuickEntry = useVaultDataStore((state) => state.addQuickEntry);

  function handleQuickEntry() {
    const title = window.prompt("Nome da nova entrada rapida:");
    if (!title?.trim()) return;
    addQuickEntry(title.trim());
    setRoute("tasks");
  }

  return (
    <div className="min-h-screen overflow-hidden text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-vault-ink/55 px-5 py-6 backdrop-blur-2xl light:bg-white/85 lg:block">
          <Logo />
          <nav className="mt-9 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => setRoute(item.route)}
                  className={cn(
                    "focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition",
                    isActive ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-white/8 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-xl border border-vault-mint/20 bg-vault-mint/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-vault-fog">
              <Sparkles className="h-4 w-4 text-vault-mint" />
              Capture rápido
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Salve ideias, fotos ou entregas em segundos e organize depois.
            </p>
            <Button className="mt-4 w-full" size="sm" onClick={handleQuickEntry}>Nova entrada</Button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/78 px-4 py-3 backdrop-blur-2xl sm:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar matérias, notas, arquivos e eventos..." />
              </div>
              <Button variant="secondary" size="icon" aria-label="Notificações">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>

          <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-vault-ink/90 px-2 py-2 backdrop-blur-2xl light:bg-white/90 lg:hidden">
            <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => setRoute(item.route)}
                    className={cn(
                      "focus-ring flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition",
                      isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </main>
      </div>
    </div>
  );
}
