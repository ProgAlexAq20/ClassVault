import { useState } from "react";
import { CheckCircle2, Search, User, CreditCard, Clock, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { supabase } from "@/shared/services/supabase.client";
import type { PaymentStatus } from "@/modules/auth/types/auth.types";

// Lista de emails autorizados a acessar o painel admin
const ADMIN_EMAILS = [
  "aquino.alexandre08@gmail.com"
  // Adicione outros emails de administradores aqui
];

type Profile = {
  id: string;
  email: string;
  payment_status: PaymentStatus;
  created_at: string;
};

export function AdminPage() {
  const { user } = useAuthStore();
  const [searchEmail, setSearchEmail] = useState("");
  
  // Verifica se o usuário atual tem permissão de admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  
  if (!isAdmin) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 pb-24 text-center">
        <Card className="max-w-3xl rounded-[2rem] border border-white/10 bg-vault-ink/50 p-10 shadow-glass">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Lock className="h-12 w-12 text-rose-400" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-400">Acesso negado</p>
            <h1 className="text-3xl font-extrabold">Você não tem permissão para acessar esta área.</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Esta página é restrita a administradores do ClassVault. Se você acredita que isso é um erro, entre em contato com o suporte.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.history.back()}>Voltar</Button>
              <Button variant="secondary" onClick={() => window.location.href = "/"}>Ir para Dashboard</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function searchProfiles() {
    if (!searchEmail.trim() || !supabase) return;
    setLoading(true);
    setMessage(null);

    try {
      // Busca na tabela profiles usando o campo id (que referencia auth.users.id)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, payment_status, created_at")
        .ilike("id", `%${searchEmail.trim()}%`);

      if (error) throw error;

      // Enrich with email from auth (this is a simplified version)
      const enrichedProfiles: Profile[] = (data || []).map((p: any) => ({
        id: p.id,
        email: searchEmail, // Simplified - in production you'd fetch from auth.users
        payment_status: p.payment_status as PaymentStatus,
        created_at: p.created_at
      }));

      setProfiles(enrichedProfiles);
      if (enrichedProfiles.length === 0) {
        setMessage({ type: "error", text: "Nenhum perfil encontrado para este email." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: `Erro ao buscar: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function activatePremium(userId: string) {
    if (!supabase) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await (supabase.from("profiles") as any)
        .update({ payment_status: "active" })
        .eq("id", userId);

      if (error) throw error;

      setProfiles(profiles.map(p => 
        p.id === userId ? { ...p, payment_status: "active" as PaymentStatus } : p
      ));
      setMessage({ type: "success", text: "Conta ativada com sucesso!" });
    } catch (err: any) {
      setMessage({ type: "error", text: `Erro ao ativar: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function deactivatePremium(userId: string) {
    if (!supabase) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await (supabase.from("profiles") as any)
        .update({ payment_status: "beta" })
        .eq("id", userId);

      if (error) throw error;

      setProfiles(profiles.map(p => 
        p.id === userId ? { ...p, payment_status: "beta" as PaymentStatus } : p
      ));
      setMessage({ type: "success", text: "Conta desativada." });
    } catch (err: any) {
      setMessage({ type: "error", text: `Erro ao desativar: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Admin</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal">Gerenciamento de contas.</h1>
      </div>

      {message && (
        <Card className={message.type === "success" ? "border-vault-mint/30 bg-vault-mint/10" : "border-rose-400/30 bg-rose-400/10"}>
          <CardContent className="flex items-center gap-3 p-4">
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-vault-mint" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            <p className="text-sm">{message.text}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Buscar usuário por email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="email@exemplo.com"
              onKeyDown={(e) => e.key === "Enter" && searchProfiles()}
            />
            <Button onClick={searchProfiles} disabled={loading || !searchEmail.trim()}>
              <Search className="h-4 w-4" />
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Digite o email do usuário para localizar sua conta e gerenciar o status de pagamento.
          </p>
        </CardContent>
      </Card>

      {profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.055] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                    <User className="h-5 w-5 text-vault-mint" />
                  </div>
                  <div>
                    <p className="font-semibold">{profile.email}</p>
                    <p className="text-xs text-muted-foreground">ID: {profile.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      profile.payment_status === "active"
                        ? "bg-vault-mint/10 text-vault-mint"
                        : profile.payment_status === "pending"
                        ? "bg-amber-400/10 text-amber-400"
                        : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {profile.payment_status === "active" ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Premium
                      </>
                    ) : profile.payment_status === "pending" ? (
                      <>
                        <Clock className="h-3 w-3" />
                        Pendente
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        Beta
                      </>
                    )}
                  </div>
                  {profile.payment_status !== "active" ? (
                    <Button
                      size="sm"
                      onClick={() => activatePremium(profile.id)}
                      disabled={loading}
                    >
                      <CreditCard className="h-3 w-3" />
                      Ativar Premium
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => deactivatePremium(profile.id)}
                      disabled={loading}
                    >
                      Revogar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Métodos de liberação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">1. Via painel admin (este painel)</p>
            <p>Busque o email do usuário e clique em "Ativar Premium".</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">2. Via SQL direto no Supabase</p>
            <pre className="mt-2 rounded-xl bg-vault-ink p-3 text-xs">
{`UPDATE profiles 
SET payment_status = 'active' 
WHERE id = 'UUID_DO_USUARIO';`}
            </pre>
          </div>
          <div>
            <p className="font-semibold text-foreground">3. Via webhook automático (futuro)</p>
            <p>Configure o webhook do seu gateway de pagamento para chamar o endpoint em <code className="rounded bg-white/10 px-1">src/api/webhooks/pixWebhook.ts</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}