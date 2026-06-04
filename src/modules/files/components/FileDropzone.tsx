import { CheckCircle2, FileUp, Image, Paperclip } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/shared/utils/cn";

type FileDropzoneProps = {
  onUpload?: (files: File[], onProgress: (fileName: string, progress: number) => void) => Promise<void> | void;
};

export function FileDropzone({ onUpload }: FileDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [progressByFile, setProgressByFile] = useState<Record<string, number>>({});
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
      setSuccess(null);
      setProgressByFile(Object.fromEntries(acceptedFiles.map((file) => [file.name, 0])));
      setIsUploading(true);
      try {
        await onUpload(acceptedFiles, (fileName, progress) => {
          setProgressByFile((current) => ({ ...current, [fileName]: progress }));
        });
        setSuccess(acceptedFiles.length === 1 ? "Arquivo salvo com sucesso." : `${acceptedFiles.length} arquivos salvos com sucesso.`);
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
          <p className="mt-1 text-sm text-muted-foreground">Fluxo seguro: arquivo no Firebase Storage, URL privada salva no Firestore.</p>
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
          {success && (
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-vault-mint">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </p>
          )}
          {Object.entries(progressByFile).length > 0 && (
            <div className="mt-3 space-y-2">
              {Object.entries(progressByFile).map(([fileName, progress]) => (
                <div key={fileName}>
                  <div className="mb-1 flex justify-between gap-3 text-xs text-muted-foreground">
                    <span className="truncate">{fileName}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-vault-mint transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 text-vault-mint">
          <Paperclip className="h-4 w-4" />
          <Image className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
