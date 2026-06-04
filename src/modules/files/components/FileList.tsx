import { Download, FileText, Image, Sheet, Trash2 } from "lucide-react";
import { useState } from "react";
import type { VaultFile } from "@/modules/files/types/file.types";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/components/ui/dialog";

const iconMap = {
  pdf: FileText,
  docx: FileText,
  text: FileText,
  image: Image,
  sheet: Sheet
};

export function FileList({ files, onDelete }: { files: VaultFile[]; onDelete?: (id: string) => Promise<void> | void }) {
  const [deletingFile, setDeletingFile] = useState<VaultFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!deletingFile) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete?.(deletingFile.id);
      setDeletingFile(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Nao foi possivel excluir o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  if (!files.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.035] p-6 text-center">
        <p className="text-sm font-semibold text-foreground">Nenhum arquivo salvo.</p>
        <p className="mt-1 text-sm text-muted-foreground">Arraste documentos para guardar materiais da disciplina com download posterior.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {files.map((file) => {
          const Icon = iconMap[file.type];
          return (
            <Card key={file.id} className="flex items-center gap-4 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/8 text-vault-mint">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.category} · {file.size} · {new Date(file.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {file.downloadUrl ? (
                  <Button asChild variant="secondary" size="icon" aria-label={`Baixar ${file.name}`}>
                    <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <span className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-300">Sem URL</span>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" aria-label={`Remover ${file.name}`} onClick={() => setDeletingFile(file)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <Dialog open={Boolean(deletingFile)} onOpenChange={(open) => !open && setDeletingFile(null)}>
        <DialogContent>
          <DialogTitle>Excluir arquivo?</DialogTitle>
          <DialogDescription>O arquivo será removido do Firestore e do Firebase Storage quando houver caminho armazenado.</DialogDescription>
          {error && <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeletingFile(null)}>Cancelar</Button>
            <Button className="bg-rose-500 text-foreground hover:bg-rose-400" onClick={handleDelete} disabled={busy}>
              {busy ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
