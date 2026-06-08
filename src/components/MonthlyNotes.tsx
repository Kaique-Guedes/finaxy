import { useEffect, useState } from "react";
import { useMonthlyNote, useSaveMonthlyNote } from "@/hooks/useMonthlyNote";
import { formatMonthLabel } from "./MonthSelector";
import { NotebookPen, Save } from "lucide-react";

export default function MonthlyNotes({ monthKey }: { monthKey: string }) {
  const { data: note } = useMonthlyNote(monthKey);
  const save = useSaveMonthlyNote();
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setContent(note?.content ?? "");
  }, [note, monthKey]);

  const dirty = content !== (note?.content ?? "");

  return (
    <div className="mx-5 mt-5 glass-card p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <NotebookPen className="w-4 h-4 text-accent" />
          Observações de <span className="capitalize">{formatMonthLabel(monthKey)}</span>
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Recolher" : "Abrir"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Anote eventos, lembretes ou observações deste mês…"
            rows={4}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
          />
          <button
            onClick={() => save.mutate({ monthKey, content })}
            disabled={!dirty || save.isPending}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Salvar observações
          </button>
        </div>
      )}
    </div>
  );
}
