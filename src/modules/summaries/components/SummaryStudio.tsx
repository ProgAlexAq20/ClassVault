import { AlertCircle, Brain, FileText, ListChecks, Loader2, Paperclip, Sparkles, UploadCloud, X } from "lucide-react";
import { useSummaryGenerator } from "@/modules/summaries/hooks/use-summary-generator";
import { ApiKeyVault } from "@/modules/summaries/components/ApiKeyVault";
import { useSummaryStore } from "@/modules/summaries/store/summary.store";
import type { AiProviderId, GeminiModelId, SummaryMode } from "@/modules/summaries/types/summary.types";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FileDropzone } from "@/modules/files/components/FileDropzone";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useNavigationStore } from "@/shared/store/navigation.store";
import { useVaultDataStore } from "@/shared/store/vault-data.store";
import { useEffect, useRef, useState } from "react";

const providers: Array<{ id: AiProviderId; label: string }> = [
  { id: "openai", label: "OpenAI" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" }
];

const geminiModels: Array<{ id: GeminiModelId; label: string; description: string }> = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Padrao rapido para resumos e rotina de estudo." },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Mais forte para analises longas e raciocinio." }
];

const modes: Array<{ id: SummaryMode; label: string; icon: typeof Brain }> = [
  { id: "quick", label: "Rápido", icon: Sparkles },
  { id: "technical", label: "Técnico", icon: FileText },
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "key-points", label: "Pontos", icon: Brain },
  { id: "exercises", label: "Exercícios", icon: UploadCloud }
];

export function SummaryStudio() {
  const { provider, geminiModel, mode, input, setProvider, setGeminiModel, setMode, setInput } = useSummaryStore();
  const generator = useSummaryGenerator();
  const { paymentStatus } = useAuth();
  const setRoute = useNavigationStore((state) => state.setRoute);
  const selectedClassroomId = useNavigationStore((state) => state.selectedClassroomId);
  const classrooms = useVaultDataStore((state) => state.classrooms);
  const addFile = useVaultDataStore((state) => state.addFile);
  const classroomId = selectedClassroomId ?? classrooms[0]?.id;
  const isPremiumLocked = paymentStatus !== "active";
  const localFileInputRef = useRef<HTMLInputElement | null>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [localFileError, setLocalFileError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setLocalFileName(null);
      setLocalFileError(null);
    };
  }, []);

  async function handleFileUpload(files: File[], onProgress: (fileName: string, progress: number) => void) {
    if (!classroomId) return;
    await Promise.all(files.map((file) => addFile({ classroomId, file, onProgress: (progress) => onProgress(file.name, progress) })));
  }

  async function handleLocalAiFile(file: File) {
    setLocalFileError(null);
    setLocalFileName(file.name);

    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const text = await file.text();
      setInput(`${input.trim() ? `${input.trim()}\n\n` : ""}Conteudo do arquivo ${file.name}:\n${text}`.slice(0, 60000));
      return;
    }

    setLocalFileError("Extração local automática está disponível para TXT. PDF/DOCX serão suportados com parser dedicado; por enquanto, cole o texto extraído no campo.");
  }

  function clearLocalFile() {
    setLocalFileName(null);
    setLocalFileError(null);
    if (localFileInputRef.current) localFileInputRef.current.value = "";
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
          {provider === "gemini" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <label className="block text-sm font-semibold">
                Modelo Gemini
                <select
                  value={geminiModel}
                  onChange={(event) => setGeminiModel(event.target.value as GeminiModelId)}
                  className="focus-ring mt-2 h-10 w-full rounded-lg border border-white/10 bg-vault-ink px-3 text-sm text-foreground"
                >
                  {geminiModels.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                Em uso: {geminiModels.find((item) => item.id === geminiModel)?.label}. {geminiModels.find((item) => item.id === geminiModel)?.description}
              </p>
            </div>
          )}
          <ApiKeyVault provider={provider} />
          <div className="grid gap-3 rounded-2xl border border-vault-mint/20 bg-vault-mint/8 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Arquivo temporário para IA</p>
                <p className="mt-1 text-sm text-muted-foreground">Este arquivo será usado apenas para gerar a resposta e não será salvo.</p>
              </div>
              <Button variant="secondary" onClick={() => localFileInputRef.current?.click()} disabled={isPremiumLocked}>
                <Paperclip className="h-4 w-4" />
                Anexar local
              </Button>
            </div>
            <input
              ref={localFileInputRef}
              type="file"
              accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleLocalAiFile(file);
              }}
            />
            {localFileName && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white/8 px-3 py-2 text-sm">
                <span className="truncate">{localFileName}</span>
                <Button variant="ghost" size="icon" aria-label="Remover arquivo local" onClick={clearLocalFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {localFileError && <p className="text-sm text-amber-300">{localFileError}</p>}
          </div>
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
            onClick={() => classroomId && generator.mutate({ provider, geminiModel, mode, input, classroomId, sourceName: localFileName ?? "Entrada manual" })}
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
