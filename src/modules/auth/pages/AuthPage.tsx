import { BookOpen, Lock, Mail, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Logo } from "@/shared/components/Logo";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { GoogleSignInButton } from "@/modules/auth/components/GoogleSignInButton";
import type { AuthMode } from "@/modules/auth/types/auth.types";

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, error, signIn, signUp, signInWithGoogle } = useAuthStore();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === "signin") {
      await signIn(email, password);
      return;
    }
    await signUp(email, password);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-white/[0.055] shadow-glass backdrop-blur-2xl light:bg-white/85">
        <div className="grid lg:grid-cols-[1fr_420px]">
          <section className="relative min-h-[360px] p-8 sm:p-10">
            <Logo />
            <div className="mt-16 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">ClassVault Cloud</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-normal sm:text-5xl">
                Seus estudos salvos na sua conta.
              </h1>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Crie seu usuário para acessar matérias, notas, tarefas e agenda em qualquer dispositivo.
              </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {["Matérias", "Notas", "Agenda"].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-white/[0.055] p-4 light:bg-white/70">
                  <BookOpen className="h-5 w-5 text-vault-mint" />
                  <p className="mt-3 text-sm font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <Card className="m-4 border-vault-mint/25 bg-vault-ink/70 light:bg-white">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex rounded-lg border border-border bg-white/[0.055] p-1 light:bg-emerald-50">
                <button
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  onClick={() => setMode("signin")}
                >
                  Entrar
                </button>
                <button
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  onClick={() => setMode("signup")}
                >
                  Criar conta
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-semibold">
                  Email
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                  </div>
                </label>
                <label className="block text-sm font-semibold">
                  Senha
                  <div className="relative mt-2">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
                  </div>
                </label>
                {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
                <Button className="w-full" disabled={loading}>
                  <Sparkles className="h-4 w-4" />
                  {mode === "signin" ? "Entrar no ClassVault" : "Criar minha conta"}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou continue com</span>
                  </div>
                </div>

                <div className="mt-6">
                  <GoogleSignInButton onClick={signInWithGoogle} disabled={loading} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
