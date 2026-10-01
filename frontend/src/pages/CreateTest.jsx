import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

const EXAM_OPTIONS = [
  { value: "jee_main", label: "JEE Main", subjects: ["physics", "chemistry", "mathematics"] },
  { value: "jee_advanced", label: "JEE Advanced", subjects: ["physics", "chemistry", "mathematics"] },
  { value: "neet", label: "NEET", subjects: ["physics", "chemistry", "biology"] },
];
const DIFF = ["easy", "medium", "hard", "mixed"];

export default function CreateTest() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [exam, setExam] = useState(user?.target_exam || "jee_main");
  const [subjects, setSubjects] = useState(["physics"]);
  const [difficulty, setDifficulty] = useState("mixed");
  const [num, setNum] = useState(5);
  const [topics, setTopics] = useState("");
  const [loading, setLoading] = useState(false);

  const examCfg = EXAM_OPTIONS.find((e) => e.value === exam);
  const remaining = Math.max(0, 5 - (user?.questions_used || 0));
  const isSub = user?.is_subscribed;
  const capped = isSub ? num : Math.min(num, Math.max(1, remaining));

  const toggleSubject = (s) => {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const submit = async () => {
    if (!isSub && remaining <= 0) {
      toast.error("Free limit reached. Please upgrade.");
      nav("/pricing");
      return;
    }
    if (subjects.length === 0) {
      toast.error("Pick at least one subject");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/tests/generate", {
        exam, subjects, difficulty, num_questions: capped,
        topics: topics.trim() || null,
      });
      toast.success("Test ready. Best of luck!");
      await refresh();
      nav(`/test/${data.id}`);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 402) {
        toast.error(detail || "Free limit reached");
        nav("/pricing");
      } else {
        toast.error(detail || "Failed to generate test");
      }
    } finally { setLoading(false); }
  };

  return (
    <AppShell title="Custom Test">
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">Design your mock test</h1>
          <p className="text-sm text-slate-500 mt-1">AI will generate fresh, syllabus-accurate MCQs.</p>
        </div>

        <Card className="p-6 md:p-8 soft-card space-y-6">
          <div>
            <Label className="text-slate-900 font-semibold mb-3 block">Exam</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {EXAM_OPTIONS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  data-testid={`create-exam-${e.value}`}
                  onClick={() => { setExam(e.value); setSubjects([e.subjects[0]]); }}
                  className={`rounded-xl p-4 border-2 text-left transition-smooth ${
                    exam === e.value ? "border-violet-600 bg-violet-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-semibold text-slate-900">{e.label}</div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">{e.subjects.join(" · ")}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-slate-900 font-semibold mb-3 block">Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {examCfg.subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`create-subject-${s}`}
                  onClick={() => toggleSubject(s)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-smooth capitalize ${
                    subjects.includes(s) ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-slate-900 font-semibold mb-3 block">Difficulty</Label>
            <div className="flex flex-wrap gap-2">
              {DIFF.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-testid={`create-difficulty-${d}`}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-smooth capitalize ${
                    difficulty === d ? "bg-amber-400 border-amber-400 text-slate-900" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="num" className="text-slate-900 font-semibold">
                Number of questions {!isSub && <span className="text-slate-500 font-normal">(free left: {remaining})</span>}
              </Label>
              <Input
                id="num"
                data-testid="create-num-input"
                type="number"
                min={1}
                max={isSub ? 30 : Math.max(1, remaining)}
                value={num}
                onChange={(e) => setNum(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="mt-1.5 h-11"
              />
              {!isSub && num > remaining && (
                <p className="text-xs text-amber-600 mt-1.5">Will be capped to {remaining} free question(s).</p>
              )}
            </div>
            <div>
              <Label htmlFor="topics" className="text-slate-900 font-semibold">Focus topics (optional)</Label>
              <Input
                id="topics"
                data-testid="create-topics-input"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="e.g. Kinematics, Thermodynamics"
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <Button
            data-testid="create-generate-btn"
            disabled={loading}
            onClick={submit}
            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating with GPT-5.6…</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate mock test</>}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
