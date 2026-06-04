export type Task = {
  id: string;
  classroomId: string;
  subjectId?: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  dueAt: string;
  progress: number;
  priority: "low" | "medium" | "high";
  status: "todo" | "doing" | "done";
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
};
