import { logAppError } from "@/shared/services/app-error";
import { requireSupabaseClient } from "@/shared/services/supabase.client";

export async function listClassrooms() {
  const supabase = requireSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    logAppError("classroom.listClassrooms.auth", userError);
    throw userError;
  }

  const userId = userData.user?.id;
  if (!userId) throw new Error("Sessao expirada.");

  const { data, error } = await supabase
    .from("classrooms")
    .select("id,title,code,professor,color,icon,description,categories,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    logAppError("classroom.listClassrooms", error, { userId });
    throw error;
  }

  return data.map((item) => ({
    id: item.id,
    title: item.title,
    code: item.code,
    professor: item.professor ?? "Professor a definir",
    color: item.color,
    icon: item.icon as "graduation-cap",
    progress: 0,
    nextClass: "Sem aula marcada",
    fileCount: 0,
    noteCount: 0,
    taskCount: 0,
    description: item.description ?? "",
    categories: item.categories ?? [],
    lessons: []
  }));
}
