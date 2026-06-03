import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Logo } from "@/shared/components/Logo";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { GoogleSignInButton } from "@/modules/auth/components/GoogleSignInButton";

export function AuthPage() {
  const { loading, error, signInWithGoogle } = useAuth();

  return (
    <main className="grid min-h-screen place-items-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-white/[0.055] shadow-glass backdrop-blur-2xl light:bg-white/85">
        <div className="grid lg:grid-cols-[1fr_420px]">
          <section className="relative p-8 sm:min-h-[360px] sm:p-10">
            <Logo />
            <div className="mt-10 max-w-xl sm:mt-16">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">ClassVault Cloud</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-normal sm:text-5xl">
                Seus estudos salvos na sua conta.
              </h1>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Crie seu usuário para acessar matérias, notas, tarefas e agenda em qualquer dispositivo.
              </p>
            </div>
            <div className="mt-10 hidden gap-3 sm:grid sm:grid-cols-3">
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
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Login</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-normal">Entre com sua conta Google.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Sua sessão fica salva neste navegador e seus dados sincronizam pelo seu Firebase uid.
                </p>
              </div>
              <div className="space-y-4">
                {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
                <GoogleSignInButton onClick={signInWithGoogle} disabled={loading} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
