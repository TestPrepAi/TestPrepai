import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [exam, setExam] = useState("jee_main");
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
    <div className="min-h-screen bg-[#0B0F19] pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-slate-500">Create test</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Design your mock test</h1>
          <p className="text-slate-400 text-sm mt-1">AI will generate fresh, syllabus-accurate MCQs.</p>
        </div>

        <Card className="p-6 md:p-8 bg-slate-900/60 border-slate-800 space-y-8">
          <div>
            <Label className="text-slate-300 mb-3 block">Exam</Label>
            <RadioGroup
              value={exam}
              onValueChange={(v) => { setExam(v); const cfg = EXAM_OPTIONS.find(e => e.value === v); setSubjects([cfg.subjects[0]]); }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {EXAM_OPTIONS.map((e) => (
                <label
                  key={e.value}
                  data-testid={`create-exam-${e.value}`}
                  className={`cursor-pointer rounded-xl p-4 border transition-smooth ${
                    exam === e.value ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 hover:border-slate-700 bg-slate-900/50"
                  }`}
                >
                  <RadioGroupItem value={e.value} className="sr-only" />
                  <div className="font-semibold">{e.label}</div>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    {e.subjects.join(" · ")}
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-slate-300 mb-3 block">Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {examCfg.subjects.map((s) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`create-subject-${s}`}
                  onClick={() => toggleSubject(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-smooth ${
                    subjects.includes(s)
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-slate-300 mb-3 block">Difficulty</Label>
            <div className="flex flex-wrap gap-2">
              {DIFF.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-testid={`create-difficulty-${d}`}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-smooth capitalize ${
                    difficulty === d
                      ? "bg-amber-500 border-amber-500 text-slate-900"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="num" className="text-slate-300">Number of questions {!isSub && `(free left: ${remaining})`}</Label>
              <Input
                id="num"
                data-testid="create-num-input"
                type="number"
                min={1}
                max={isSub ? 30 : Math.max(1, remaining)}
                value={num}
                onChange={(e) => setNum(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="mt-1.5 bg-slate-800 border-slate-700"
              />
              {!isSub && num > remaining && (
                <p className="text-xs text-amber-400 mt-1.5">Will be capped to {remaining} free question(s).</p>
              )}
            </div>
            <div>
              <Label htmlFor="topics" className="text-slate-300">Focus topics (optional)</Label>
              <Input
                id="topics"
                data-testid="create-topics-input"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="e.g. Kinematics, Thermodynamics"
                className="mt-1.5 bg-slate-800 border-slate-700"
              />
            </div>
          </div>

          <Button
            data-testid="create-generate-btn"
            size="lg"
            disabled={loading}
            onClick={submit}
            className="w-full bg-indigo-500 hover:bg-indigo-600 h-12"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating with GPT-5.6…</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate mock test</>}
          </Button>
        </Card>
      </div>
    </div>
  );
}
