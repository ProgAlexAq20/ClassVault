import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useNavigationStore } from "@/shared/store/navigation.store";
import { Button } from "./ui/button";

export function BetaStatusBanner() {
  const { paymentStatus } = useAuthStore();
  const setRoute = useNavigationStore((state) => state.setRoute);

  if (paymentStatus === "active") return null;

  return (
    <div
      className={`mb-6 rounded-2xl border p-4 ${
        paymentStatus === "beta"
          ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
          : "border-vault-mint/30 bg-vault-mint/10 text-vault-mint"
      }`}
    >
      <div className="flex items-start gap-3">
        {paymentStatus === "beta" ? (
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        ) : (
          <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="font-semibold">
            {paymentStatus === "beta"
              ? "Modo Beta: Dados não sincronizam"
              : "Aguardando confirmação de pagamento"}
          </p>
          <p className="mt-1 text-sm opacity-90">
            {paymentStatus === "beta"
              ? "Você está usando o ClassVault em modo beta. Seus dados são salvos localmente, mas não sincronizam com a nuvem. Atualize para premium para sincronizar e acessar a IA completa."
              : "Seu pagamento foi registrado. Aguardamos a confirmação para liberar o acesso premium."}
          </p>
          {paymentStatus === "beta" && (
            <Button
              size="sm"
              onClick={() => setRoute("premium")}
              className="mt-3 w-fit"
              variant="secondary"
            >
              Atualizar para Premium
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
