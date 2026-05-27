import { FileText, Image, Sheet } from "lucide-react";
import type { VaultFile } from "@/modules/files/types/file.types";
import { Card } from "@/shared/components/ui/card";

const iconMap = {
  pdf: FileText,
  docx: FileText,
  text: FileText,
  image: Image,
  sheet: Sheet
};

export function FileList({ files }: { files: VaultFile[] }) {
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
          </Card>
        );
      })}
    </div>
  );
}
