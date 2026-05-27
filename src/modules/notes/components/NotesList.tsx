import { NotebookPen } from "lucide-react";
import type { Note } from "@/modules/notes/types/note.types";
import { Card } from "@/shared/components/ui/card";

export function NotesList({ notes }: { notes: Note[] }) {
  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <Card key={note.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-vault-mint/12 text-vault-mint">
              <NotebookPen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{note.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{note.preview}</p>
              <p className="mt-2 text-xs text-vault-mint">{note.updatedAt}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
