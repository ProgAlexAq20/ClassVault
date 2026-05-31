export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; email: string | null; full_name: string | null; avatar_url: string | null; payment_status: "beta" | "pending" | "active"; is_admin: boolean; created_at: string; updated_at: string }>;
      classrooms: Table<{ id: string; user_id: string; title: string; code: string; color: string; icon: string; professor: string | null; description: string | null; categories: string[]; created_at: string; updated_at: string }>;
      lessons: Table<{ id: string; user_id: string; classroom_id: string; title: string; starts_at: string; description: string | null; created_at: string }>;
      files: Table<{ id: string; user_id: string; classroom_id: string; lesson_id: string | null; name: string; storage_path: string; mime_type: string; category: string; size_bytes: number; created_at: string }>;
      notes: Table<{ id: string; user_id: string; classroom_id: string; lesson_id: string | null; title: string; content: string; created_at: string; updated_at: string }>;
      tasks: Table<{ id: string; user_id: string; classroom_id: string; title: string; description: string | null; status: string; priority: string; due_at: string | null; created_at: string }>;
      events: Table<{ id: string; user_id: string; classroom_id: string | null; title: string; starts_at: string; ends_at: string | null; type: string; created_at: string }>;
      summaries: Table<{ id: string; user_id: string; classroom_id: string; source_file_id: string | null; provider: string; mode: string; content: string; created_at: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};
