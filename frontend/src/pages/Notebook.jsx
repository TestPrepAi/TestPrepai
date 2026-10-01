import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { NotebookPen, CheckCircle2, RotateCcw, Trash2, Loader2, Sparkles } from "lucide-react";

const SUBJECT_COLORS = {
  physics: "bg-violet-100 text-violet-700",
  chemistry: "bg-amber-100 text-amber-700",
  mathematics: "bg-sky-100 text-sky-700",
  biology: "bg-emerald-100 text-emerald-700",
};

export default function Notebook() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ open: 0, mastered: 0, by_subject: {} });
  const [subject, setSubject] = useState("");
  const [tab, setTab] = useState("open");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status_filter: tab };
      if (subject) params.subject = subject;
      const { data } = await api.get("/mistakes", { params });
      setItems(data.mistakes || []);
      setCounts(data.counts);
    } catch { toast.error("Could not load notebook"); }
    finally { setLoading(false); }
  }, [tab, subject]);

  useEffect(() => { load(); }, [load]);

  const setMastered = async (id, mastered) => {
    try {
      await api.patch(`/mistakes/${id}`, { mastered });
      toast.success(mastered ? "Marked as revised" : "Moved back to review");
      load();
    } catch { toast.error("Update failed"); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/mistakes/${id}`);
      load();
    } catch { toast.error("Delete failed"); }
  };

  const subjects = Object.keys(counts.by_subject || {});

  return (
    <AppShell title="Mistake Notebook">
      <div className="max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
              <NotebookPen className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">Mistake Notebook</h1>
              <p className="text-sm text-slate-500">Every wrong answer lands here. Revise, then mark it done.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Stat label="To revise" value={counts.open} accent="text-rose-600" testid="notebook-open-count" />
            <Stat label="Revised" value={counts.mastered} accent="text-emerald-600" testid="notebook-mastered-count" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            {["open", "mastered"].map((t) => (
              <button
                key={t}
                data-testid={`notebook-tab-${t}`}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-smooth ${
                  tab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                }`}
              >
                {t === "open" ? "To revise" : "Revised"}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
          <Chip active={!subject} onClick={() => setSubject("")} testid="notebook-subject-all">All</Chip>
          {subjects.map((s) => (
            <Chip key={s} active={subject === s} onClick={() => setSubject(s)} testid={`notebook-subject-${s}`}>
              <span className="capitalize">{s}</span>
              <span className="ml-1.5 text-[10px] opacity-70">{counts.by_subject[s][tab]}</span>
            </Chip>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>
        ) : items.length === 0 ? (
          <div className="soft-card rounded-2xl p-12 text-center" data-testid="notebook-empty">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-semibold text-slate-900">
              {tab === "open" ? "Nothing to revise — clean slate!" : "No revised mistakes yet"}
            </p>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              {tab === "open" ? "Wrong answers from your tests will appear here automatically." : "Mark mistakes as revised once you've understood them."}
            </p>
            <Button data-testid="notebook-empty-cta" onClick={() => nav("/create-test")} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Sparkles className="w-4 h-4 mr-2" /> Take a test
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {items.map((m, idx) => (
              <AccordionItem key={m.id} value={m.id} data-testid={`notebook-item-${idx + 1}`} className="soft-card rounded-xl px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left w-full pr-2">
                    <span className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${SUBJECT_COLORS[m.subject] || "bg-slate-100 text-slate-600"}`}>
                      {m.subject.slice(0, 4)}
                    </span>
                    <span className="text-slate-800 line-clamp-1 flex-1">{m.text}</span>
                    {m.topic && <span className="hidden md:inline text-xs text-slate-400 truncate max-w-[160px]">{m.topic}</span>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="whitespace-pre-wrap text-slate-800 mb-3">{m.text}</div>
                  <div className="space-y-2 mb-4">
                    {m.options.map((opt, i) => {
                      const isCorrect = i === m.correct_index;
                      const isSelected = i === m.selected_index;
                      return (
                        <div key={i} className={`p-3 rounded-lg border text-sm ${
                          isCorrect ? "border-emerald-300 bg-emerald-50" : isSelected ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"
                        }`}>
                          <span className="font-mono text-xs text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                          {isCorrect && <Badge className="ml-2 bg-emerald-500 text-white">Correct</Badge>}
                          {isSelected && !isCorrect && <Badge className="ml-2 bg-rose-500 text-white">You chose</Badge>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-lg p-4 bg-violet-50 border border-violet-200">
                    <div className="text-xs uppercase tracking-widest text-violet-700 mb-2 font-semibold">AI Explanation</div>
                    <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">{m.explanation}</div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    {m.mastered ? (
                      <Button data-testid={`notebook-unmaster-${idx + 1}`} size="sm" variant="outline" className="border-slate-300" onClick={() => setMastered(m.id, false)}>
                        <RotateCcw className="w-3.5 h-3.5 mr-2" /> Revise again
                      </Button>
                    ) : (
                      <Button data-testid={`notebook-master-${idx + 1}`} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setMastered(m.id, true)}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark as revised
                      </Button>
                    )}
                    <Button data-testid={`notebook-delete-${idx + 1}`} size="sm" variant="ghost" className="text-slate-500 hover:text-rose-600" onClick={() => remove(m.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove
                    </Button>
                    <span className="ml-auto text-xs text-slate-400 font-mono">{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </AppShell>
  );
}

function Chip({ active, onClick, children, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-smooth ${
        active ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, accent, testid }) {
  return (
    <div className="soft-card rounded-xl px-4 py-2.5 min-w-[96px]" data-testid={testid}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className={`font-mono text-2xl font-extrabold ${accent}`}>{value}</div>
    </div>
  );
}
