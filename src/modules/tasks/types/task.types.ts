export type Task = {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  dueAt: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "doing" | "done";
};
