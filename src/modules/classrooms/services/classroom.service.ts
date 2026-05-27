import { classrooms } from "@/shared/data/mock-data";
import { supabase } from "@/shared/services/supabase.client";

export async function listClassrooms() {
  if (!supabase) return classrooms;
  const { data, error } = await supabase.from("classrooms").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((item) => ({
    id: item.id,
    title: item.title,
    code: item.code,
    professor: "Professor",
    color: item.color,
    icon: item.icon as "graduation-cap",
    progress: 0,
    nextClass: "Sem aula",
    fileCount: 0,
    noteCount: 0,
    taskCount: 0
  }));
}
