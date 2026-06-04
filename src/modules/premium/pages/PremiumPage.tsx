import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Sparkles, CreditCard, ShieldCheck, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useNavigationStore } from "@/shared/store/navigation.store";

const pixCode = "00020126580014br.gov.bcb.pix01365b255237-3763-4fcd-b6cc-ddc26503b67052040000530398654047.995802BR5924Alexandre Ferreira de Aq6009Sao Paulo62240520daqr294077717255092163041A6F";

export function PremiumPage() {
  const { error, paymentStatus, paymentStatusLoading, refreshAccess, requestPremiumReview } = useAuth();
  const setRoute = useNavigationStore((state) => state.setRoute);
  const [copySuccess, setCopySuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const qrDataUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(pixCode)}`,
    []
  );

  const statusLabel = useMemo(() => {
    if (paymentStatus === "active") return "Acesso vitalício desbloqueado";
    if (paymentStatus === "pending") return "Pagamento enviado. Aguardando liberação.";
    return "Beta gratuito — atualize para liberar o app totalmente.";
  }, [paymentStatus]);

  const statusTone = {
    active: "border-vault-mint/30 bg-vault-mint/10 text-vault-mint",
    pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    beta: "border-white/10 bg-white/5 text-muted-foreground"
  }[paymentStatus];

  const StatusIcon = paymentStatus === "active" ? CheckCircle2 : paymentStatus === "pending" ? Clock : AlertCircle;

  async function handleCopy() {
    await navigator.clipboard.writeText(pixCode);
    setCopySuccess(true);
    window.setTimeout(() => setCopySuccess(false), 2000);
  }

  async function handleAlreadyPaid() {
    if (paymentStatus === "active") return;
    setSubmitError(null);
    try {
      await requestPremiumReview();
    } catch (paymentError) {
      setSubmitError(paymentError instanceof Error ? paymentError.message : "Nao foi possivel registrar o pagamento.");
    }
  }

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">Premium</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal">Acesso vitalício estudante</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-2xl sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-col gap-4">
            <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${statusTone}`}>
              <StatusIcon className="h-4 w-4" />
              {paymentStatusLoading ? "Atualizando status..." : statusLabel}
            </span>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              {paymentStatus === "active"
                ? "Seu acesso premium esta ativo nesta conta. A IA completa e os recursos premium ficam liberados enquanto este status permanecer ativo no Firestore."
                : paymentStatus === "pending"
                  ? "Seu aviso de pagamento foi registrado. Assim que o campo paymentStatus for alterado para active no Firestore, recarregue ou atualize o status aqui."
                  : "Desbloqueie a experiência completa do ClassVault: IA premium, organização sem limites e uso permanente na sua conta."}
            </p>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-vault-ink/50 p-4 sm:rounded-3xl sm:p-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Sparkles className="h-5 w-5 text-vault-mint" />
                Acesso vitalício por apenas <strong>R$ 7,99</strong>.
              </div>
              <div className="grid gap-3 rounded-3xl bg-white/5 p-4 text-sm text-foreground">
                <p className="font-semibold">O que acompanha:</p>
                <ul className="ml-4 list-disc space-y-2 text-muted-foreground">
                  <li>Dados sincronizados por conta Firebase.</li>
                  <li>IA completa para resumos e planos de estudo.</li>
                  <li>Sem limites de criação de matérias, arquivos e notas.</li>
                </ul>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Valor</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">R$ 7,99</div>
              </div>
            </div>
            {(submitError || error) && (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
                {submitError ?? error}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="w-full sm:w-auto" onClick={handleAlreadyPaid} disabled={paymentStatusLoading || paymentStatus === "pending" || paymentStatus === "active"}>
                <CreditCard className="h-4 w-4" />
                {paymentStatusLoading ? "Salvando..." : paymentStatus === "pending" ? "Pagamento enviado" : paymentStatus === "active" ? "Já desbloqueado" : "Já paguei"}
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => void refreshAccess()} disabled={paymentStatusLoading}>
                <RefreshCw className="h-4 w-4" />
                Atualizar status
              </Button>
            </div>
            <Button variant="secondary" onClick={() => setRoute("settings")}>Voltar para ajustes</Button>
          </div>
        </Card>

        <div className="grid min-w-0 gap-5">
          <Card className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-glass sm:rounded-[2rem] sm:p-6">
            <CardHeader>
              <CardTitle>Pagamento via Pix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-2xl border border-white/10 bg-vault-ink/60 p-4 sm:rounded-3xl">
                <p className="text-sm text-muted-foreground">Chave Pix</p>
                <p className="font-semibold break-all">5b255237-3763-4fcd-b6cc-ddc26503b670</p>
              </div>
              <div className="grid min-w-0 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-3xl">
                <p className="text-sm text-muted-foreground">Código Pix</p>
                <pre className="whitespace-pre-wrap break-words text-sm text-foreground">{pixCode}</pre>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button variant="secondary" className="w-full sm:w-auto" onClick={handleCopy}>
                    <Copy className="h-4 w-4" /> {copySuccess ? "Copiado" : "Copiar código"}
                  </Button>
                  <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setRoute("settings")}>Ver condições</Button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:rounded-3xl sm:p-4">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QRCode Pix" className="mx-auto aspect-square w-full max-w-72 rounded-2xl object-contain sm:rounded-3xl" />
                ) : (
                  <div className="grid min-h-[288px] place-items-center text-sm text-muted-foreground">Carregando QRCode...</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:rounded-[2rem] sm:p-6">
            <CardHeader>
              <CardTitle>Boas-vindas premium</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>Após o pagamento, clique em “Já paguei” para salvar o status pending no Firestore.</p>
              <p>A liberação manual acontece alterando userAccess/uid/paymentStatus para active.</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-vault-mint/30 bg-vault-mint/5 px-3 py-2 text-xs text-vault-mint">
                <ShieldCheck className="h-4 w-4" /> Pagamento seguro e verificado manualmente.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
