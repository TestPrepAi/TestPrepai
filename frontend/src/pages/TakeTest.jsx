import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Clock, ChevronLeft, ChevronRight } from "lucide-react";

// status: 0=notVisited, 1=notAnswered, 2=answered, 3=marked, 4=answeredMarked
const STATUS_STYLE = {
  0: "bg-slate-700 text-slate-300",
  1: "bg-rose-500 text-white",
  2: "bg-emerald-500 text-white",
  3: "bg-violet-500 text-white",
  4: "bg-violet-500 text-white ring-2 ring-emerald-400",
};

export default function TakeTest() {
  const { id } = useParams();
  const nav = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // qid -> {selected, marked, time}
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startAtRef = useRef(Date.now());
  const qStartRef = useRef(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/tests/${id}`);
        setTest(data);
        setRemaining(data.duration_seconds);
        const init = {};
        data.questions.forEach((q) => { init[q.id] = { selected: null, marked: false, time: 0, status: 0 }; });
        // mark first as visited
        if (data.questions[0]) init[data.questions[0].id].status = 1;
        setAnswers(init);
      } catch {
        toast.error("Unable to load test");
        nav("/dashboard");
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, [id]);

  // Timer
  useEffect(() => {
    if (!test) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [test]);

  const q = test?.questions[current];

  const commitTime = () => {
    if (!q) return;
    const dt = Math.floor((Date.now() - qStartRef.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [q.id]: { ...prev[q.id], time: (prev[q.id]?.time || 0) + dt },
    }));
    qStartRef.current = Date.now();
  };

  const goTo = (idx) => {
    if (idx < 0 || idx >= test.questions.length) return;
    commitTime();
    setCurrent(idx);
    const nid = test.questions[idx].id;
    setAnswers((prev) => {
      const cur = prev[nid] || { selected: null, marked: false, time: 0, status: 0 };
      if (cur.status === 0) return { ...prev, [nid]: { ...cur, status: 1 } };
      return prev;
    });
  };

  const selectOption = (idx) => {
    setAnswers((prev) => {
      const cur = prev[q.id];
      const marked = cur.marked;
      return {
        ...prev,
        [q.id]: { ...cur, selected: idx, status: marked ? 4 : 2 },
      };
    });
  };

  const clearResponse = () => {
    setAnswers((prev) => {
      const cur = prev[q.id];
      return { ...prev, [q.id]: { ...cur, selected: null, status: cur.marked ? 3 : 1 } };
    });
  };

  const markForReviewNext = () => {
    setAnswers((prev) => {
      const cur = prev[q.id];
      const marked = true;
      const status = cur.selected != null ? 4 : 3;
      return { ...prev, [q.id]: { ...cur, marked, status } };
    });
    goTo(current + 1);
  };

  const saveNext = () => goTo(current + 1);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    commitTime();
    const payload = {
      test_id: id,
      total_time_seconds: Math.floor((Date.now() - startAtRef.current) / 1000),
      answers: test.questions.map((qq) => ({
        question_id: qq.id,
        selected_index: answers[qq.id]?.selected ?? null,
        time_spent_seconds: answers[qq.id]?.time || 0,
      })),
    };
    try {
      const { data } = await api.post("/tests/submit", payload);
      toast.success(`Submitted! Score: ${data.score_pct}%`);
      nav(`/result/${data.id}`);
    } catch (err) {
      toast.error("Submission failed");
    } finally { setSubmitting(false); }
  };

  const counts = useMemo(() => {
    const c = { answered: 0, notAnswered: 0, marked: 0, notVisited: 0 };
    if (!test) return c;
    test.questions.forEach((qq) => {
      const s = answers[qq.id]?.status ?? 0;
      if (s === 0) c.notVisited++;
      else if (s === 1) c.notAnswered++;
      else if (s === 2) c.answered++;
      else if (s === 3) c.marked++;
      else if (s === 4) c.marked++;
    });
    return c;
  }, [answers, test]);

  const timeColor = remaining > (test?.duration_seconds || 1) * 0.5 ? "text-emerald-400"
    : remaining > (test?.duration_seconds || 1) * 0.2 ? "text-amber-400" : "text-rose-400";

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }
  if (!test) return null;

  const sel = answers[q.id]?.selected;

  return (
    <div className="min-h-screen bg-[#0B0F19] pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Badge className="uppercase bg-indigo-500/20 border-indigo-500/40 text-indigo-300">
              {test.exam.replace("_", " ")}
            </Badge>
            <span className="text-xs text-slate-400 font-mono uppercase">{test.subjects.join(" · ")}</span>
          </div>
          <div className={`flex items-center gap-2 font-mono text-2xl font-bold ${timeColor}`} data-testid="test-timer">
            <Clock className="w-5 h-5" /> {fmt(remaining)}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Question panel */}
          <Card className="lg:col-span-8 p-6 md:p-8 bg-slate-900/70 border-slate-800">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500">
              <span>Question {current + 1} of {test.questions.length}</span>
              <span className="font-mono capitalize">{q.subject} · {q.difficulty}</span>
            </div>
            <div className="mt-4 font-display text-lg md:text-xl leading-relaxed whitespace-pre-wrap" data-testid="question-text">
              {q.text}
            </div>
            <div className="mt-6 space-y-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  data-testid={`option-${idx}`}
                  onClick={() => selectOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-smooth ${
                    sel === idx
                      ? "border-indigo-500 bg-indigo-500/15 text-white"
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-200"
                  }`}
                >
                  <span className="font-mono text-xs text-slate-500 mr-3">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                data-testid="test-prev-btn"
                variant="outline"
                className="border-slate-700"
                onClick={() => goTo(current - 1)}
                disabled={current === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                data-testid="test-clear-btn"
                variant="outline"
                className="border-slate-700"
                onClick={clearResponse}
              >
                Clear
              </Button>
              <Button
                data-testid="test-mark-review-btn"
                variant="outline"
                className="border-violet-500/50 text-violet-300"
                onClick={markForReviewNext}
              >
                Mark for review & next
              </Button>
              <Button
                data-testid="test-save-next-btn"
                className="bg-indigo-500 hover:bg-indigo-600 ml-auto"
                onClick={saveNext}
                disabled={current === test.questions.length - 1}
              >
                Save & Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>

          {/* Palette */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-4 bg-slate-900/70 border-slate-800">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">Question palette</div>
              <div className="grid grid-cols-6 gap-2">
                {test.questions.map((qq, idx) => {
                  const st = answers[qq.id]?.status ?? 0;
                  return (
                    <button
                      key={qq.id}
                      data-testid={`palette-q-${idx + 1}`}
                      onClick={() => goTo(idx)}
                      className={`h-9 rounded-md font-mono text-xs font-semibold transition-smooth ${STATUS_STYLE[st]} ${
                        current === idx ? "ring-2 ring-white/70" : ""
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Legend color="bg-emerald-500" label={`Answered ${counts.answered}`} />
                <Legend color="bg-rose-500" label={`Not answered ${counts.notAnswered}`} />
                <Legend color="bg-violet-500" label={`Marked ${counts.marked}`} />
                <Legend color="bg-slate-700" label={`Not visited ${counts.notVisited}`} />
              </div>
            </Card>
            <Button
              data-testid="test-submit-btn"
              size="lg"
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
            >
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : "Submit Test"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-slate-300">
      <span className={`w-3 h-3 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}
