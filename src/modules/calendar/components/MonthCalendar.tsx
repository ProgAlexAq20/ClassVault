import { ChevronLeft, ChevronRight, Clock3, Plus } from "lucide-react";
import { localDateKey } from "@/modules/tasks/components/TaskDetailsDialog";
import type { Task } from "@/modules/tasks/types/task.types";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

type MonthCalendarProps = {
  month: Date;
  tasks: Task[];
  selectedDate?: string;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: string) => void;
};

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function startOfCalendar(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const weekday = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - weekday);
  return start;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function MonthCalendar({ month, tasks, selectedDate, onMonthChange, onSelectDate }: MonthCalendarProps) {
  const today = localDateKey();
  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const start = startOfCalendar(month);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-vault-mint">Calendário</p>
          <h2 className="mt-1 text-xl font-bold capitalize">{monthLabel}</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="secondary" size="sm" onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Próximo mês">
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-semibold text-muted-foreground sm:text-xs">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const key = localDateKey(day);
          const dayTasks = tasks.filter((task) => task.dueDate === key);
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const hasOverdue = dayTasks.some((task) => task.status !== "done" && task.dueDate < today);
          const hasDone = dayTasks.some((task) => task.status === "done");

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={cn(
                "focus-ring group min-h-24 rounded-lg border border-white/8 bg-white/[0.045] p-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-vault-mint/30 sm:min-h-32",
                !isCurrentMonth && "opacity-45",
                isToday && "border-vault-mint bg-vault-mint/10",
                isSelected && "ring-2 ring-vault-mint",
                hasOverdue && "border-rose-400/40",
                hasDone && !hasOverdue && "border-vault-mint/25"
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn("text-sm font-semibold", isToday && "text-vault-mint")}>{day.getDate()}</span>
                <Plus className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="mt-2 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "truncate rounded-md px-2 py-1 text-[11px]",
                      task.status === "done"
                        ? "bg-vault-mint/10 text-vault-mint"
                        : task.dueDate < today
                          ? "bg-rose-400/10 text-rose-200"
                          : "bg-white/8 text-foreground"
                    )}
                    title={task.title}
                  >
                    {task.dueTime && <Clock3 className="mr-1 inline h-3 w-3" />}
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <p className="text-[11px] text-muted-foreground">+{dayTasks.length - 3} tarefas</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
