import { FileUp, Image, Paperclip } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/shared/utils/cn";

type FileDropzoneProps = {
  onUpload?: (files: File[]) => Promise<void> | void;
};

export function FileDropzone({ onUpload }: FileDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "text/plain": [".txt"]
    },
    maxSize: 20 * 1024 * 1024,
    onDropAccepted: async (acceptedFiles) => {
      if (!onUpload || acceptedFiles.length === 0) return;
      setError(null);
      setIsUploading(true);
      try {
        await onUpload(acceptedFiles);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel enviar o arquivo.");
      } finally {
        setIsUploading(false);
      }
    },
    onDropRejected: () => {
      setError("Arquivo invalido ou acima do limite de 20 MB.");
    }
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "focus-ring cursor-pointer rounded-xl border border-dashed border-vault-mint/35 bg-vault-mint/8 p-5 transition",
        isDragActive && "border-vault-mint bg-vault-mint/15"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <FileUp className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{isUploading ? "Enviando arquivo..." : "Arraste PDFs, DOCX, imagens ou textos"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Os arquivos sao registrados localmente com acesso isolado por usuario.</p>
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        </div>
        <div className="flex gap-2 text-vault-mint">
          <Paperclip className="h-4 w-4" />
          <Image className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
