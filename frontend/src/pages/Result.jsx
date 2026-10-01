import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import ShareScoreCard from "@/components/ShareScoreCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, XCircle, MinusCircle, Loader2, PlusCircle, Share2, NotebookPen } from "lucide-react";

export default function Result() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/attempts/${id}`);
        setData(data);
      } catch { nav("/dashboard"); }
    })();
  }, [id, nav]);

  if (!data) {
    return (
      <AppShell title="Result">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>
      </AppShell>
    );
  }

  const wrongCount = data.details.filter((d) => d.selected_index != null && !d.is_correct).length;

  return (
    <AppShell title="Result">
      <div className="max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-violet-600 font-semibold">Result</div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900 mt-1" data-testid="result-heading">
              {data.exam.replace("_", " ").toUpperCase()} · Score {data.score_pct}%
            </h1>
          </div>
          <Button
            data-testid="result-share-btn"
            onClick={() => setShareOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-5"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share score card
          </Button>
        </div>
        <ShareScoreCard open={shareOpen} onOpenChange={setShareOpen} result={data} userName={user?.name} />

        {wrongCount > 0 && (
          <div
            data-testid="result-notebook-banner"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-sm text-rose-800">
              <NotebookPen className="w-4 h-4" />
              <span><span className="font-semibold">{wrongCount}</span> wrong answer{wrongCount === 1 ? "" : "s"} saved to your Mistake Notebook.</span>
            </div>
            <Button data-testid="result-notebook-link" size="sm" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100" onClick={() => nav("/notebook")}>
              Open notebook
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Correct" value={data.correct} accent="text-emerald-600" />
          <Stat label="Attempted" value={data.attempted} accent="text-violet-600" />
          <Stat label="Total" value={data.total} />
          <Stat label="Score" value={`${data.score_pct}%`} accent="text-amber-600" />
        </div>

        <h2 className="font-display text-xl font-bold mt-10 mb-4 text-slate-900">By subject</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(data.subject_stats || {}).map(([subj, s]) => (
            <Card key={subj} className="p-5 soft-card">
              <div className="text-xs uppercase tracking-widest text-slate-500 capitalize font-semibold">{subj}</div>
              <div className="mt-2 font-mono text-3xl font-extrabold text-slate-900">
                {s.total ? Math.round((s.correct / s.total) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-500 mt-1">{s.correct}/{s.total} correct · {s.attempted} attempted</div>
            </Card>
          ))}
        </div>

        <h2 className="font-display text-xl font-bold mt-10 mb-4 text-slate-900">Detailed solutions</h2>
        <Accordion type="multiple" className="space-y-2">
          {data.details.map((d, idx) => {
            const Icon = d.is_correct ? CheckCircle2 : d.selected_index == null ? MinusCircle : XCircle;
            const color = d.is_correct ? "text-emerald-500" : d.selected_index == null ? "text-slate-400" : "text-rose-500";
            return (
              <AccordionItem
                key={d.question_id}
                value={d.question_id}
                data-testid={`result-item-${idx + 1}`}
                className="soft-card rounded-xl px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="text-slate-400 font-mono text-xs">Q{idx + 1}</span>
                    <span className="text-slate-800 line-clamp-1">{d.text}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="whitespace-pre-wrap text-slate-800 mb-3">{d.text}</div>
                  <div className="space-y-2 mb-4">
                    {d.options.map((opt, i) => {
                      const isCorrect = i === d.correct_index;
                      const isSelected = i === d.selected_index;
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border text-sm ${
                            isCorrect ? "border-emerald-300 bg-emerald-50"
                            : isSelected ? "border-rose-300 bg-rose-50"
                            : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <span className="font-mono text-xs text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                          {isCorrect && <Badge className="ml-2 bg-emerald-500 text-white">Correct</Badge>}
                          {isSelected && !isCorrect && <Badge className="ml-2 bg-rose-500 text-white">Your choice</Badge>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-lg p-4 bg-violet-50 border border-violet-200">
                    <div className="text-xs uppercase tracking-widest text-violet-700 mb-2 font-semibold">AI Explanation</div>
                    <div className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">{d.explanation}</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="mt-10 flex gap-3">
          <Button data-testid="result-new-test-btn" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => nav("/create-test")}>
            <PlusCircle className="w-4 h-4 mr-2" /> New test
          </Button>
          <Button variant="outline" className="border-slate-300" onClick={() => nav("/dashboard")}>Back to dashboard</Button>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, accent = "text-slate-900" }) {
  return (
    <Card className="p-5 soft-card">
      <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className={`mt-2 font-mono text-3xl font-extrabold ${accent}`}>{value}</div>
    </Card>
  );
}
