import { BookOpen } from "lucide-react";
import { cn } from "@/shared/utils/cn";

type LogoProps = {
  compact?: boolean;
  className?: string;
};

export function Logo({ compact, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="grid h-11 w-11 place-items-center rounded-xl border border-vault-mint/40 bg-gradient-to-br from-vault-mint to-vault-leaf text-vault-ink shadow-glow">
        <BookOpen className="h-5 w-5" />
      </div>
      {!compact && (
        <div>
          <div className="text-lg font-extrabold tracking-normal">
            Class<span className="text-vault-mint">Vault</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">Organize. Estude. Conquiste.</div>
        </div>
      )}
    </div>
  );
}
