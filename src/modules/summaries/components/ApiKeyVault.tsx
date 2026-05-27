import { KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { saveLocalApiKey } from "@/modules/summaries/services/local-key.service";
import type { AiProviderId } from "@/modules/summaries/types/summary.types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

export function ApiKeyVault({ provider }: { provider: AiProviderId }) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!apiKey.trim()) return;
    await saveLocalApiKey(provider, apiKey.trim());
    setSaved(true);
    setApiKey("");
  }

  return (
    <div className="rounded-xl border border-vault-mint/20 bg-vault-mint/8 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-vault-mint" />
        BYOK local criptografado
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            type="password"
            placeholder={`Cole sua API key ${provider}`}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
        <Button onClick={handleSave}>Salvar chave</Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {saved ? "Chave salva localmente no navegador." : "A chave nunca vai para o Supabase e nao fica no codigo."}
      </p>
    </div>
  );
}
