export type VaultFile = {
  id: string;
  classroomId: string;
  lessonId?: string;
  name: string;
  type: "pdf" | "docx" | "image" | "sheet" | "text";
  category: "Aulas" | "Fotos" | "Trabalhos" | "Referências";
  size: string;
  createdAt: string;
};
