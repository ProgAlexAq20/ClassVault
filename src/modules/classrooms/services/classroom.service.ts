import { supabase } from "@/shared/services/supabase.client";

export async function listClassrooms() {
  if (!supabase) return [];

  const { data, error } = await supabase.from("classrooms").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  return (data as any[]).map((item) => ({
    id: item.id,
    title: item.title,
    code: item.code,
    professor: item.professor ?? "Professor",
    color: item.color,
    icon: item.icon as "graduation-cap",
    progress: item.progress ?? 0,
    nextClass: item.next_class ?? "Sem aula",
    fileCount: item.file_count ?? 0,
    noteCount: item.note_count ?? 0,
    taskCount: item.task_count ?? 0
  }));
}
