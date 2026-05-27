export type Task = {
  id: string;
  classroomId: string;
  title: string;
  dueAt: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "doing" | "done";
};
