import { useVaultDataStore } from "@/shared/store/vault-data.store";

export async function listTasks(userId: string) {
  const state = useVaultDataStore.getState();
  return state.tasks.filter((t) => t.ownerId === userId || t.classroomId === userId);
}

export async function createTask(userId: string, subjectId: string | undefined, taskData: any) {
  const state = useVaultDataStore.getState();
  // Delegate to the centralized store implementation to keep a single source of truth
  const created = await state.addTask({
    classroomId: taskData.classroomId ?? subjectId ?? "",
    subjectId: subjectId,
    title: taskData.title,
    description: taskData.description,
    dueDate: taskData.dueDate,
    dueTime: taskData.dueTime,
    priority: taskData.priority,
    status: taskData.status,
    progress: taskData.progress
  });
  return created.id ?? created;
}
