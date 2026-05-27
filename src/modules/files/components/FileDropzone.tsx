import { FileUp, Image, Paperclip } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/shared/utils/cn";

export function FileDropzone() {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "text/plain": [".txt"]
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
          <p className="font-semibold">Arraste PDFs, DOCX, imagens ou textos</p>
          <p className="mt-1 text-sm text-muted-foreground">Classifique por aula, trabalho ou referência depois do upload.</p>
        </div>
        <div className="flex gap-2 text-vault-mint">
          <Paperclip className="h-4 w-4" />
          <Image className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
