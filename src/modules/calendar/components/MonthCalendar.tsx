import { cn } from "@/shared/utils/cn";

const days = Array.from({ length: 35 }, (_, index) => index + 1);
const eventDays = new Set<number>();

export function MonthCalendar() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
        <div key={`${day}-${index}`} className="py-2 text-center text-xs font-semibold text-muted-foreground">
          {day}
        </div>
      ))}
      {days.map((day) => (
        <div
          key={day}
          className={cn(
            "aspect-square rounded-lg border border-white/8 bg-white/[0.045] p-2 text-sm",
            day === 26 && "border-vault-mint bg-vault-mint/15 text-vault-mint"
          )}
        >
          <span>{day <= 31 ? day : ""}</span>
          {eventDays.has(day) && <div className="mt-2 h-1.5 w-1.5 rounded-full bg-vault-mint" />}
        </div>
      ))}
    </div>
  );
}
