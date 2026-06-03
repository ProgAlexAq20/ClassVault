import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock, CreditCard, Lock, Search, User } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { searchUsersByEmail, updateUserPaymentStatus } from "@/modules/auth/services/firebase-auth.service";
import type { PaymentStatus } from "@/modules/auth/types/auth.types";

type UserAccessRecord = {
  uid: string;
  email: string | null;
  displayName: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export function AdminPage() {
  const { isAdmin } = useAuth();
  const [searchEmail, setSearchEmail] = useState("");
  const [accounts, setAccounts] = useState<UserAccessRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
              <Button variant="secondary" onClick={() => { window.location.href = "/"; }}>Ir para Dashboard</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  async function searchAccounts() {
    if (!searchEmail.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const resultsRaw = await searchUsersByEmail(searchEmail);
      const results = resultsRaw.map((account) => ({
        uid: account.uid,
        email: account.email,
        displayName: account.displayName,
        paymentStatus: account.paymentStatus,
        createdAt: account.createdAt
      }));

      setAccounts(results);
      if (results.length === 0) {
        setMessage({ type: "error", text: "Nenhum usuário encontrado para este email." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao buscar usuários." });
    } finally {
      setLoading(false);
    }
  }

  async function setAccountStatus(uid: string, paymentStatus: PaymentStatus) {
    setLoading(true);
    setMessage(null);

    try {
      await updateUserPaymentStatus(uid, paymentStatus);
      setAccounts((current) => current.map((account) => (account.uid === uid ? { ...account, paymentStatus } : account)));
      setMessage({ type: "success", text: paymentStatus === "active" ? "Conta ativada com sucesso!" : "Conta voltou para beta." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao atualizar usuário." });
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
              onChange={(event) => setSearchEmail(event.target.value)}
              placeholder="email@exemplo.com"
              onKeyDown={(event) => {
                if (event.key === "Enter") searchAccounts();
              }}
            />
            <Button onClick={searchAccounts} disabled={loading || !searchEmail.trim()}>
              <Search className="h-4 w-4" />
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A busca consulta registros do Firestore. Em produção, apenas contas com custom claim admin devem acessar esta área.
          </p>
        </CardContent>
      </Card>

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.uid}
                className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                    <User className="h-5 w-5 text-vault-mint" />
                  </div>
                  <div>
                    <p className="font-semibold">{account.email ?? "email indisponivel"}</p>
                    <p className="text-xs text-muted-foreground">UID: {account.uid}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      account.paymentStatus === "active"
                        ? "bg-vault-mint/10 text-vault-mint"
                        : account.paymentStatus === "pending"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {account.paymentStatus === "active" ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Premium
                      </>
                    ) : account.paymentStatus === "pending" ? (
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
                  {account.paymentStatus !== "active" ? (
                    <Button size="sm" onClick={() => setAccountStatus(account.uid, "active")} disabled={loading}>
                      <CreditCard className="h-3 w-3" />
                      Ativar Premium
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setAccountStatus(account.uid, "beta")} disabled={loading}>
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
            <p className="font-semibold text-foreground">1. Via painel admin</p>
            <p>Busque o email do usuário e clique em "Ativar Premium".</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">2. Via webhook automático</p>
            <p>Configure o webhook do seu gateway de pagamento para chamar o endpoint em <code className="rounded bg-white/10 px-1">src/api/webhooks/pixWebhook.ts</code>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
