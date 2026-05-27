import { LogOut, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useThemeStore } from "@/shared/store/theme.store";
import { useNavigationStore } from "@/shared/store/navigation.store";

export function SettingsPage() {
  const { user, paymentStatus, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const setRoute = useNavigationStore((state) => state.setRoute);

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24 lg:pb-0">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Configurações</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal">Conta e preferências.</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-vault-mint" /> Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border bg-white/[0.055] p-4 light:bg-emerald-50/70">
            <p className="text-sm text-muted-foreground">Email cadastrado</p>
            <p className="mt-1 font-semibold">{user?.email}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-vault-ink/60 p-4 text-sm text-muted-foreground">
            <p className="font-semibold">Status de acesso</p>
            <p className="mt-1 text-sm text-foreground">{paymentStatus === "active" ? "Premium ativo" : paymentStatus === "pending" ? "Pagando - aguardando liberação" : "Beta gratuito"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setRoute("premium")}>Gerenciar Premium</Button>
            <Button variant="secondary" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-vault-mint/25 bg-vault-mint/10 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-vault-mint" />
            Seus novos dados são enviados para o Supabase quando a conta está ativa.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Tema atual: {theme === "dark" ? "Escuro" : "Claro"}</p>
            <p className="text-sm text-muted-foreground">O modo claro usa branco limpo com detalhes verdes vivos.</p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Alternar tema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
