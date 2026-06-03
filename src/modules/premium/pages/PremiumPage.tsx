import { useMemo, useState } from "react";
import { Copy, Sparkles, CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useNavigationStore } from "@/shared/store/navigation.store";

const pixCode = "00020126580014br.gov.bcb.pix01365b255237-3763-4fcd-b6cc-ddc26503b67052040000530398654047.995802BR5924Alexandre Ferreira de Aq6009Sao Paulo62240520daqr294077717255092163041A6F";

export function PremiumPage() {
  const { paymentStatus, requestPremiumReview } = useAuth();
  const setRoute = useNavigationStore((state) => state.setRoute);
  const [copySuccess, setCopySuccess] = useState(false);
  const qrDataUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(pixCode)}`,
    []
  );

  const statusLabel = useMemo(() => {
    if (paymentStatus === "active") return "Acesso vitalício desbloqueado";
    if (paymentStatus === "pending") return "Pagamento recebido. Aguardando liberação.";
    return "Beta gratuito — atualize para liberar o app totalmente.";
  }, [paymentStatus]);

  async function handleCopy() {
    await navigator.clipboard.writeText(pixCode);
    setCopySuccess(true);
    window.setTimeout(() => setCopySuccess(false), 2000);
  }

  async function handleAlreadyPaid() {
    if (paymentStatus === "active") return;
    try {
      await requestPremiumReview();
    } catch {
      // The auth store exposes and logs the error.
    }
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Premium</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal">Acesso vitalício estudante</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glass backdrop-blur-2xl">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-vault-mint/10 px-3 py-2 text-sm font-semibold text-vault-mint">{statusLabel}</span>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Desbloqueie a experiência completa do ClassVault: IA premium, organização sem limites e uso permanente na sua conta.
            </p>
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-vault-ink/50 p-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Sparkles className="h-5 w-5 text-vault-mint" />
                Acesso vitalício por apenas <strong>R$ 7,99</strong>.
              </div>
              <div className="grid gap-3 rounded-3xl bg-white/5 p-4 text-sm text-foreground">
                <p className="font-semibold">O que acompanha:</p>
                <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
                  <li>Dados locais separados por conta Firebase.</li>
                  <li>IA completa para resumos e planos de estudo.</li>
                  <li>Sem limites de criação de matérias, arquivos e notas.</li>
                </ul>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Valor</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">R$ 7,99</div>
              </div>
            </div>
            <Button className="w-full sm:w-auto" onClick={handleAlreadyPaid} disabled={paymentStatus === "pending" || paymentStatus === "active"}>
              <CreditCard className="h-4 w-4" />
              {paymentStatus === "pending" ? "Aguardando liberação" : paymentStatus === "active" ? "Já desbloqueado" : "Já paguei"}
            </Button>
            <Button variant="secondary" onClick={() => setRoute("settings")}>Voltar para ajustes</Button>
          </div>
        </Card>

        <div className="grid gap-5">
          <Card className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glass">
            <CardHeader>
              <CardTitle>Pagamento via Pix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-3xl border border-white/10 bg-vault-ink/60 p-4">
                <p className="text-sm text-muted-foreground">Chave Pix</p>
                <p className="font-semibold break-all">5b255237-3763-4fcd-b6cc-ddc26503b670</p>
              </div>
              <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-muted-foreground">Código Pix</p>
                <pre className="whitespace-pre-wrap break-words text-sm text-foreground">{pixCode}</pre>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleCopy}>
                    <Copy className="h-4 w-4" /> {copySuccess ? "Copiado" : "Copiar código"}
                  </Button>
                  <Button variant="ghost" onClick={() => setRoute("settings")}>Ver condições</Button>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QRCode Pix" className="mx-auto h-72 w-72 rounded-3xl object-contain" />
                ) : (
                  <div className="grid min-h-[288px] place-items-center text-sm text-muted-foreground">Carregando QRCode...</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <CardHeader>
              <CardTitle>Boas-vindas premium</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>Após o pagamento, clique em “Já paguei” para avisar nossa equipe. O status será marcado como pendente até confirmação.</p>
              <p>Em breve, esta tela será integrada a um webhook para automação de liberação.</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-vault-mint/30 bg-vault-mint/5 px-3 py-2 text-xs text-vault-mint">
                <ShieldCheck className="h-4 w-4" /> Pagamento seguro e verificado manualmente.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
