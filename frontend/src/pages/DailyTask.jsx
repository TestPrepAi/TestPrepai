import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import StreakCard from "@/components/StreakCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, Loader2, Calendar, CheckCircle2 } from "lucide-react";

const SUBJECTS_BY_EXAM = {
  jee_main: ["physics", "chemistry", "mathematics"],
  jee_advanced: ["physics", "chemistry", "mathematics"],
  neet: ["physics", "chemistry", "biology"],
};

export default function DailyTask() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState(null);
  const [num, setNum] = useState(5);
  const [busy, setBusy] = useState(false);

  const targetExam = user?.target_exam || "jee_main";
  const subjects = SUBJECTS_BY_EXAM[targetExam] || SUBJECTS_BY_EXAM.jee_main;

  useEffect(() => {
    if (!subject && subjects.length) setSubject(subjects[0]);
  }, [subjects, subject]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/daily/today");
        setExisting(data.task);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const remaining = Math.max(0, 5 - (user?.questions_used || 0));
  const isSub = user?.is_subscribed;
  const capped = isSub ? num : Math.min(num, Math.max(1, remaining));

  const generate = async () => {
    if (!topic.trim() || topic.trim().length < 2) {
      toast.error("Please enter today's topic");
      return;
    }
    if (!isSub && remaining <= 0) {
      toast.error("Free limit reached. Please upgrade.");
      nav("/pricing");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/daily/generate", {
        topic: topic.trim(),
        subject,
        num_questions: capped,
      });
      await refresh();
      toast.success("Daily quiz ready — go!");
      nav(`/test/${data.id}`);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 402) {
        toast.error(detail || "Free limit reached");
        nav("/pricing");
      } else toast.error(detail || "Could not generate quiz");
    } finally { setBusy(false); }
  };

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <AppShell title="Daily Task">
      <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">Today's practice</h1>
            <p className="text-sm text-slate-500">{today}</p>
          </div>
        </div>

        {loading ? (
          <Card className="p-10 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-violet-600" /></Card>
        ) : existing ? (
          <Card className="p-6 bg-emerald-50 border-emerald-200" data-testid="daily-existing-card">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
              <CheckCircle2 className="w-5 h-5" /> {existing.completed ? "Today's quiz completed — streak protected!" : "Already generated for today"}
            </div>
            <div className="text-sm text-slate-700">
              Topic: <span className="font-semibold">{existing.topic}</span> · Subject: <span className="capitalize font-semibold">{existing.subject}</span>
              {existing.completed && existing.score_pct != null && (
                <> · Score: <span className="font-mono font-semibold" data-testid="daily-score">{existing.score_pct}%</span></>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {existing.completed ? (
                <Button
                  data-testid="daily-view-result"
                  onClick={() => nav(`/result/${existing.attempt_id}`)}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  View result
                </Button>
              ) : (
                <Button
                  data-testid="daily-open-test"
                  onClick={() => nav(`/test/${existing.test_id}`)}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Open quiz
                </Button>
              )}
              <Button
                data-testid="daily-regenerate"
                variant="outline"
                onClick={() => setExisting(null)}
                className="border-slate-300"
              >
                Change topic
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 md:p-8 bg-white border-slate-200 space-y-6">
            <div>
              <Label htmlFor="topic" className="text-slate-900 font-semibold">
                What was taught in class today?
              </Label>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Enter the exact chapter / topic — we'll generate questions specifically on it.
              </p>
              <Input
                id="topic"
                data-testid="daily-topic-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={user?.coaching_enrolled ? "e.g. Rotational Motion - Moment of Inertia" : "e.g. Thermodynamics - First Law"}
                className="h-11"
              />
            </div>

            <div>
              <Label className="text-slate-900 font-semibold mb-3 block">Subject</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => (
                  <button
                    key={s}
                    type="button"
                    data-testid={`daily-subject-${s}`}
                    onClick={() => setSubject(s)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-smooth capitalize ${
                      subject === s
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="num" className="text-slate-900 font-semibold">
                Questions {!isSub && <span className="text-slate-500 font-normal">(free left: {remaining})</span>}
              </Label>
              <Input
                id="num"
                data-testid="daily-num-input"
                type="number"
                min={3}
                max={isSub ? 10 : Math.max(3, remaining)}
                value={num}
                onChange={(e) => setNum(Math.max(3, parseInt(e.target.value || "3", 10)))}
                className="mt-1.5 h-11 max-w-[160px]"
              />
            </div>

            <Button
              data-testid="daily-generate-btn"
              onClick={generate}
              disabled={busy}
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {busy ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating with GPT-5.6…</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate today's quiz</>
              )}
            </Button>

            {user?.coaching_enrolled && (
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                Tip: You're enrolled at <span className="font-semibold">{user?.coaching_name || "your coaching"}</span> — paste the exact topic your teacher covered today for best alignment.
              </div>
            )}
          </Card>
        )}
      </div>
      <aside className="space-y-4">
        <StreakCard />
        <div className="soft-card rounded-2xl p-5 text-sm text-slate-600">
          <div className="font-semibold text-slate-900 mb-1">How streaks work</div>
          Finish today's topic quiz to add a day. Miss a day and the streak resets — come back tomorrow to keep it alive.
        </div>
      </aside>
      </div>
    </AppShell>
  );
}
