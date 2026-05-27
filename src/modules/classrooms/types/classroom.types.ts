export type Classroom = {
  id: string;
  title: string;
  code: string;
  professor: string;
  color: string;
  icon: "graduation-cap" | "brain" | "search";
  progress: number;
  nextClass: string;
  fileCount: number;
  noteCount: number;
  taskCount: number;
  description?: string;
  categories?: string[];
  lessons?: Lesson[];
};

export type Lesson = {
  id: string;
  classroomId: string;
  title: string;
  startsAt: string;
  description?: string;
};
