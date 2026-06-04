import { AlertCircle, Brain, FileText, ListChecks, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { useSummaryGenerator } from "@/modules/summaries/hooks/use-summary-generator";
import { ApiKeyVault } from "@/modules/summaries/components/ApiKeyVault";
import { useSummaryStore } from "@/modules/summaries/store/summary.store";
import type { AiProviderId, SummaryMode } from "@/modules/summaries/types/summary.types";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FileDropzone } from "@/modules/files/components/FileDropzone";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useNavigationStore } from "@/shared/store/navigation.store";
import { useVaultDataStore } from "@/shared/store/vault-data.store";

const providers: Array<{ id: AiProviderId; label: string }> = [
  { id: "openai", label: "OpenAI" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" }
];

const modes: Array<{ id: SummaryMode; label: string; icon: typeof Brain }> = [
  { id: "quick", label: "Rápido", icon: Sparkles },
  { id: "technical", label: "Técnico", icon: FileText },
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "key-points", label: "Pontos", icon: Brain },
  { id: "exercises", label: "Exercícios", icon: UploadCloud }
];

export function SummaryStudio() {
  const { provider, mode, input, setProvider, setMode, setInput } = useSummaryStore();
  const generator = useSummaryGenerator();
  const { paymentStatus } = useAuth();
  const setRoute = useNavigationStore((state) => state.setRoute);
  const selectedClassroomId = useNavigationStore((state) => state.selectedClassroomId);
  const classrooms = useVaultDataStore((state) => state.classrooms);
  const addFile = useVaultDataStore((state) => state.addFile);
  const classroomId = selectedClassroomId ?? classrooms[0]?.id;
  const isPremiumLocked = paymentStatus !== "active";

  async function handleFileUpload(files: File[], onProgress: (fileName: string, progress: number) => void) {
    if (!classroomId) return;
    await Promise.all(files.map((file) => addFile({ classroomId, file, onProgress: (progress) => onProgress(file.name, progress) })));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>Estúdio de IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {providers.map((item) => (
              <Button
                key={item.id}
                variant={provider === item.id ? "default" : "secondary"}
                size="sm"
                onClick={() => setProvider(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <ApiKeyVault provider={provider} />
          <FileDropzone onUpload={classroomId ? handleFileUpload : undefined} />
          <textarea
            className="focus-ring min-h-44 w-full resize-none rounded-xl border border-white/10 bg-white/[0.055] p-4 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Cole aqui o texto da aula, briefing, transcrição ou conteúdo extraído de um arquivo..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isPremiumLocked}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {modes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={cn(
                    "focus-ring rounded-lg border border-white/10 p-3 text-left text-sm transition",
                    mode === item.id ? "bg-primary text-primary-foreground" : "bg-white/[0.055] text-muted-foreground hover:text-foreground"
                  )}
                  disabled={isPremiumLocked}
                >
                  <Icon className="mb-2 h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="rounded-3xl border border-white/10 bg-vault-ink/60 p-4 text-sm text-muted-foreground">
            {paymentStatus === "beta" && "Modo Beta: explore a interface e acesse a estrutura do app. Atualize para usar IA completa."}
            {paymentStatus === "pending" && "Pagamento registrado. Aguardando liberação para liberar o acesso premium."}
            {paymentStatus === "active" && "Acesso premium habilitado. Gere resumos com IA em sua conta."}
          </div>
          {generator.error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Não foi possível gerar agora.</p>
                <p className="mt-1">{generator.error.message}</p>
              </div>
            </div>
          )}
          <Button
            className="w-full"
            disabled={!input.trim() || generator.isPending || isPremiumLocked || !classroomId}
            onClick={() => classroomId && generator.mutate({ provider, mode, input, classroomId, sourceName: "Entrada manual" })}
          >
            {generator.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : isPremiumLocked ? "Atualize para gerar" : !classroomId ? "Crie uma materia antes" : "Gerar resumo"}
          </Button>
          {isPremiumLocked && (
            <Button variant="secondary" className="w-full" onClick={() => setRoute("premium")}>Ir para Premium</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          {generator.isPending ? (
            <div className="grid min-h-72 place-items-center rounded-xl border border-white/10 bg-white/[0.035] p-6 text-center">
              <div>
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-vault-mint" />
                <p className="mt-3 text-sm text-muted-foreground">A IA está organizando o material. Isso pode levar alguns segundos.</p>
              </div>
            </div>
          ) : generator.data ? (
            <div className="prose prose-invert max-w-none text-sm leading-7">
              <h3 className="text-lg font-semibold">{generator.data.title}</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">{generator.data.content}</p>
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center rounded-xl border border-white/10 bg-white/[0.035] p-6 text-center">
              <div>
                <Brain className="mx-auto h-8 w-8 text-vault-mint" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Importe conteúdo, escolha um modo e gere materiais de estudo prontos para revisar.
                </p>
                {generator.error && <p className="mt-3 text-sm text-rose-300">{generator.error.message}</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
