import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, BookOpen, Target } from "lucide-react";

const EXAMS = [
  { value: "jee_main", label: "JEE Main", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "jee_advanced", label: "JEE Advanced", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "neet", label: "NEET", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

export default function OnboardingDialog() {
  const { user, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [coaching, setCoaching] = useState(null); // true/false
  const [coachingName, setCoachingName] = useState("");
  const [targetExam, setTargetExam] = useState(null);
  const [examDate, setExamDate] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && !user.onboarded) {
      setOpen(true);
      setStep(1);
    }
  }, [user]);

  const canFinish = targetExam && examDate && coaching !== null;

  const submit = async () => {
    if (!canFinish) return;
    setBusy(true);
    try {
      await api.post("/user/onboarding", {
        coaching_enrolled: coaching,
        coaching_name: coaching ? coachingName : null,
        target_exam: targetExam,
        target_exam_date: examDate,
      });
      await refresh();
      toast.success("You're all set! Let's start preparing.");
      setOpen(false);
    } catch {
      toast.error("Could not save. Please try again.");
    } finally { setBusy(false); }
  };

  if (!user) return null;

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={(v) => user?.onboarded && setOpen(v)}>
      <DialogContent className="max-w-xl bg-white" data-testid="onboarding-dialog">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-violet-600" />
          </div>
          <DialogTitle className="font-display text-2xl">Welcome to TrackPrep, {user.name.split(" ")[0]}!</DialogTitle>
          <DialogDescription>Two quick questions so we can personalise your daily plan.</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <Label className="flex items-center gap-2 mb-3 text-slate-900 font-semibold">
                <BookOpen className="w-4 h-4 text-violet-600" /> Are you enrolled in any coaching?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  data-testid="onboarding-coaching-yes"
                  onClick={() => setCoaching(true)}
                  className={`p-4 rounded-xl border-2 text-left transition-smooth ${
                    coaching === true
                      ? "border-violet-600 bg-violet-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-semibold">Yes, I attend coaching</div>
                  <div className="text-xs text-slate-500 mt-1">We'll align daily questions with your classes</div>
                </button>
                <button
                  data-testid="onboarding-coaching-no"
                  onClick={() => { setCoaching(false); setCoachingName(""); }}
                  className={`p-4 rounded-xl border-2 text-left transition-smooth ${
                    coaching === false
                      ? "border-violet-600 bg-violet-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="font-semibold">No, I self-study</div>
                  <div className="text-xs text-slate-500 mt-1">We'll follow a structured syllabus plan</div>
                </button>
              </div>
            </div>

            {coaching === true && (
              <div>
                <Label htmlFor="cname" className="text-slate-700">Coaching institute (optional)</Label>
                <Input
                  id="cname"
                  data-testid="onboarding-coaching-name"
                  value={coachingName}
                  onChange={(e) => setCoachingName(e.target.value)}
                  placeholder="e.g. Allen, Aakash, Physics Wallah"
                  className="mt-1.5"
                />
              </div>
            )}

            <Button
              data-testid="onboarding-step1-next"
              disabled={coaching === null}
              onClick={() => setStep(2)}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="flex items-center gap-2 mb-3 text-slate-900 font-semibold">
                <Target className="w-4 h-4 text-violet-600" /> Which exam are you targeting?
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {EXAMS.map((e) => (
                  <button
                    key={e.value}
                    data-testid={`onboarding-exam-${e.value}`}
                    onClick={() => setTargetExam(e.value)}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition-smooth ${
                      targetExam === e.value ? "border-violet-600 bg-violet-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="exam-date" className="text-slate-700">Expected exam date</Label>
              <Input
                id="exam-date"
                data-testid="onboarding-exam-date"
                type="date"
                min={todayISO}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-slate-500 mt-1.5">We'll show a live countdown on your dashboard.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button
                data-testid="onboarding-finish-btn"
                disabled={!canFinish || busy}
                onClick={submit}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {busy ? "Saving…" : "Start preparing"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
