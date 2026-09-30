import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, XCircle, MinusCircle, Loader2, PlusCircle } from "lucide-react";

export default function Result() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/attempts/${id}`);
        setData(data);
      } catch { nav("/dashboard"); }
    })();
  }, [id, nav]);

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs uppercase tracking-widest text-slate-500">Result</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1" data-testid="result-heading">
          {data.exam.replace("_", " ").toUpperCase()} · Score {data.score_pct}%
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Stat label="Correct" value={data.correct} accent="text-emerald-400" />
          <Stat label="Attempted" value={data.attempted} accent="text-indigo-400" />
          <Stat label="Total" value={data.total} accent="text-slate-200" />
          <Stat label="Score" value={`${data.score_pct}%`} accent="text-amber-400" />
        </div>

        {/* Subject breakdown */}
        <h2 className="font-display text-xl font-semibold mt-10 mb-4">By subject</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(data.subject_stats || {}).map(([subj, s]) => (
            <Card key={subj} className="p-5 bg-slate-900/70 border-slate-800">
              <div className="text-xs uppercase tracking-widest text-slate-500 capitalize">{subj}</div>
              <div className="mt-2 font-mono text-3xl font-bold">
                {s.total ? Math.round((s.correct / s.total) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">{s.correct}/{s.total} correct · {s.attempted} attempted</div>
            </Card>
          ))}
        </div>

        {/* Detailed solutions */}
        <h2 className="font-display text-xl font-semibold mt-10 mb-4">Detailed solutions</h2>
        <Accordion type="multiple" className="space-y-2">
          {data.details.map((d, idx) => {
            const Icon = d.is_correct ? CheckCircle2 : d.selected_index == null ? MinusCircle : XCircle;
            const color = d.is_correct ? "text-emerald-400" : d.selected_index == null ? "text-slate-400" : "text-rose-400";
            return (
              <AccordionItem
                key={d.question_id}
                value={d.question_id}
                data-testid={`result-item-${idx + 1}`}
                className="border border-slate-800 rounded-xl bg-slate-900/60 px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <span className="text-slate-500 font-mono text-xs">Q{idx + 1}</span>
                    <span className="text-slate-200 line-clamp-1">{d.text}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="whitespace-pre-wrap text-slate-200 mb-3">{d.text}</div>
                  <div className="space-y-2 mb-4">
                    {d.options.map((opt, i) => {
                      const isCorrect = i === d.correct_index;
                      const isSelected = i === d.selected_index;
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border text-sm ${
                            isCorrect
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : isSelected
                              ? "border-rose-500/60 bg-rose-500/10"
                              : "border-slate-800 bg-slate-900/50"
                          }`}
                        >
                          <span className="font-mono text-xs text-slate-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                          {isCorrect && <Badge className="ml-2 bg-emerald-500 text-slate-900">Correct</Badge>}
                          {isSelected && !isCorrect && <Badge className="ml-2 bg-rose-500">Your choice</Badge>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-lg p-4 bg-slate-950/70 border border-slate-800">
                    <div className="text-xs uppercase tracking-widest text-indigo-400 mb-2">AI Explanation</div>
                    <div className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">{d.explanation}</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="mt-10 flex gap-3">
          <Button data-testid="result-new-test-btn" className="bg-indigo-500 hover:bg-indigo-600" onClick={() => nav("/create-test")}>
            <PlusCircle className="w-4 h-4 mr-2" /> New test
          </Button>
          <Button variant="outline" className="border-slate-700" onClick={() => nav("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <Card className="p-5 bg-slate-900/70 border-slate-800">
      <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-2 font-mono text-3xl font-bold ${accent}`}>{value}</div>
    </Card>
  );
}
