import { Bell, Brain, CalendarDays, CheckSquare, GraduationCap, Home, Moon, Search, Settings, Sparkles, Sun, Plus, Zap, Clock, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Logo } from "@/shared/components/Logo";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { AppRoute, useNavigationStore } from "@/shared/store/navigation.store";
import { useThemeStore } from "@/shared/store/theme.store";
import { useVaultDataStore } from "@/shared/store/vault-data.store";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { cn } from "@/shared/utils/cn";

// Lista de emails autorizados a acessar o painel admin
const ADMIN_EMAILS = [
  "aquino.alexandre08@gmail.com"
  // Adicione outros emails de administradores aqui
];

const navItems: Array<{ route: AppRoute; label: string; icon: typeof Home }> = [
  { route: "dashboard", label: "Dashboard", icon: Home },
  { route: "classroom", label: "Matérias", icon: GraduationCap },
  { route: "calendar", label: "Agenda", icon: CalendarDays },
  { route: "tasks", label: "Tarefas", icon: CheckSquare },
  { route: "summaries", label: "IA", icon: Brain },
  { route: "settings", label: "Ajustes", icon: Settings }
];

// Itens de navegação completos (inclui Admin para administradores)
const allNavItems = [...navItems, { route: "admin", label: "Admin", icon: User }];

const mobileNavItems = navItems.filter((item) => item.route !== "settings");

function StatusBadge() {
  const { paymentStatus } = useAuthStore();
  const setRoute = useNavigationStore((state) => state.setRoute);

  if (paymentStatus === "active") {
    return (
      <button
        onClick={() => setRoute("premium")}
        className="inline-flex items-center gap-1.5 rounded-lg bg-vault-mint/10 px-3 py-1.5 text-xs font-semibold text-vault-mint hover:bg-vault-mint/20 transition"
      >
        <Zap className="h-3 w-3" />
        Premium
      </button>
    );
  }

  return (
    <button
      onClick={() => setRoute("premium")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition",
        paymentStatus === "beta"
          ? "bg-amber-400/10 text-amber-300"
          : "bg-vault-mint/10 text-vault-mint"
      )}
    >
      {paymentStatus === "beta" ? (
        <>
          <Sparkles className="h-3 w-3" />
          Beta
        </>
      ) : (
        <>
          <Clock className="h-3 w-3" />
          Pendente
        </>
      )}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [quickEntryTitle, setQuickEntryTitle] = useState("");
  const activeRoute = useNavigationStore((state) => state.activeRoute);
  const setRoute = useNavigationStore((state) => state.setRoute);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const addQuickEntry = useVaultDataStore((state) => state.addQuickEntry);
  const { user } = useAuthStore();
  
  // Verifica se o usuário atual tem permissão de admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  
  // Usa todos os itens de navegação (incluindo Admin) se for administrador
  const displayNavItems = isAdmin ? allNavItems : navItems;

  function handleQuickEntry() {
    const title = quickEntryTitle.trim();
    if (!title) return;
    addQuickEntry(title);
    setQuickEntryTitle("");
    setQuickEntryOpen(false);
    setRoute("tasks");
  }

  return (
    <div className="min-h-screen overflow-hidden text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-vault-ink/55 px-5 py-6 backdrop-blur-2xl light:bg-white/85 lg:block">
          <Logo />
          <nav className="mt-9 space-y-1">
            {displayNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => setRoute(item.route as AppRoute)}
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
            <Dialog open={quickEntryOpen} onOpenChange={setQuickEntryOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 w-full" size="sm"><Plus className="h-4 w-4" /> Nova entrada</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Captura rápida</DialogTitle>
                <DialogDescription>Adicione uma tarefa ou anotação rápida.</DialogDescription>
                <div className="mt-6 space-y-4">
                  <label className="block text-sm font-semibold">
                    O que é?
                    <Input
                      value={quickEntryTitle}
                      onChange={(e) => setQuickEntryTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQuickEntry()}
                      placeholder="Ex: Estudar para prova"
                      autoFocus
                      className="mt-2"
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setQuickEntryOpen(false)}>Cancelar</Button>
                    <Button onClick={handleQuickEntry} disabled={!quickEntryTitle.trim()}>Capturar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background/78 px-4 py-3 backdrop-blur-2xl sm:px-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar matérias, notas, arquivos e eventos..." />
              </div>
              <StatusBadge />
              <Button variant="secondary" size="icon" aria-label="Notificações">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="secondary" size="icon" onClick={() => setRoute("settings")} aria-label="Configurações">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>

          <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-vault-ink/90 px-2 py-2 backdrop-blur-2xl light:bg-white/90 lg:hidden">
            <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
              {mobileNavItems.map((item) => {
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
