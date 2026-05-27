import { Brain, GraduationCap, Search } from "lucide-react";
import { motion } from "framer-motion";
import type { Classroom } from "@/modules/classrooms/types/classroom.types";
import { Card } from "@/shared/components/ui/card";
import { useNavigationStore } from "@/shared/store/navigation.store";

const icons = {
  "graduation-cap": GraduationCap,
  brain: Brain,
  search: Search
};

export function ClassroomCard({ classroom }: { classroom: Classroom }) {
  const openClassroom = useNavigationStore((state) => state.openClassroom);
  const Icon = icons[classroom.icon];

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => openClassroom(classroom.id)}
      className="focus-ring text-left"
    >
      <Card className="relative min-h-[210px] overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: classroom.color }} />
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/8" style={{ color: classroom.color }}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-xs text-muted-foreground">
            {classroom.code}
          </span>
        </div>
        <div className="mt-5">
          <h3 className="text-xl font-bold tracking-normal">{classroom.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{classroom.professor}</p>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${classroom.progress}%`, backgroundColor: classroom.color }} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
          <span>{classroom.fileCount} arquivos</span>
          <span>{classroom.noteCount} notas</span>
          <span>{classroom.taskCount} tarefas</span>
        </div>
      </Card>
    </motion.button>
  );
}
