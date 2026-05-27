import { SummaryStudio } from "@/modules/summaries/components/SummaryStudio";

export function SummariesPage() {
  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-vault-mint">IA / Resumos</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-normal">Transforme material bruto em estudo guiado.</h1>
      </div>
      <SummaryStudio />
    </div>
  );
}
