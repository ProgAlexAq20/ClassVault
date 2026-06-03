import { Download, FileText, Image, Sheet, Trash2 } from "lucide-react";
import type { VaultFile } from "@/modules/files/types/file.types";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

const iconMap = {
  pdf: FileText,
  docx: FileText,
  text: FileText,
  image: Image,
  sheet: Sheet
};

export function FileList({ files, onDelete }: { files: VaultFile[]; onDelete?: (id: string) => Promise<void> | void }) {
  return (
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
              <p className="text-xs text-muted-foreground">{file.category} · {file.size} · {file.createdAt}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {file.downloadUrl && (
                <Button asChild variant="secondary" size="icon" aria-label={`Baixar ${file.name}`}>
                  <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" aria-label={`Remover ${file.name}`} onClick={() => void onDelete(file.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
