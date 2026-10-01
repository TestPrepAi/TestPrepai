import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  SlidersHorizontal, Clock3, BookMarked, Calendar, LineChart, Flame, Sparkles, ArrowRight
} from "lucide-react";

const TOOLS = [
  { to: "/create-test", title: "Custom Test", sub: "Build your own", color: "bg-violet-100 text-violet-700", icon: SlidersHorizontal, testid: "tool-custom-test" },
  { to: "/daily-task", title: "Daily Task", sub: "Topic → quiz", color: "bg-amber-100 text-amber-700", icon: Calendar, testid: "tool-daily-task" },
  { to: "/analytics", title: "Analytics", sub: "Track growth", color: "bg-rose-100 text-rose-700", icon: LineChart, testid: "tool-analytics" },
  { to: "/history", title: "Past Attempts", sub: "Review mistakes", color: "bg-emerald-100 text-emerald-700", icon: BookMarked, testid: "tool-history" },
  { to: "/create-test", title: "Timed Mock", sub: "NTA simulator", color: "bg-sky-100 text-sky-700", icon: Clock3, testid: "tool-timed-mock" },
  { to: "/pricing", title: "Go PRO", sub: "₹49 / 28 days", color: "bg-slate-900 text-amber-300", icon: Sparkles, testid: "tool-upgrade" },
];

function daysUntil(iso) {
  if (!iso) return null;
  const t = new Date(iso + "T00:00:00").getTime();
  return Math.max(0, Math.ceil((t - Date.now()) / 86400000));
}

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [daily, setDaily] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, s, d] = await Promise.all([
          api.get("/attempts"),
          api.get("/analytics/summary"),
          api.get("/daily/today"),
        ]);
        setAttempts(a.data.attempts || []);
        setAnalytics(s.data);
        setDaily(d.data.task);
      } catch { /* ignore */ }
    })();
  }, []);

  const used = user?.questions_used || 0;
  const remaining = Math.max(0, 5 - used);
  const dLeft = daysUntil(user?.target_exam_date);

  const subjectDonut = useMemo(() => {
    if (!analytics?.subject_breakdown?.length) return [];
    return analytics.subject_breakdown;
  }, [analytics]);

  const totalAcc = analytics?.avg_score ?? 0;

  return (
    <AppShell title="Home">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Study Tools */}
          <section className="soft-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Study Tools</h2>
              <span className="text-xs text-slate-500">Pick an action</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                return (
                  <Link
                    key={t.title}
                    to={t.to}
                    data-testid={t.testid}
                    className="group p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 bg-white transition-smooth"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${t.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{t.title}</div>
                        <div className="text-xs text-slate-500">{t.sub}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Daily Task banner */}
          <section
            className="rounded-2xl p-6 border border-violet-200 bg-gradient-to-r from-violet-50 to-amber-50"
            data-testid="dashboard-daily-banner"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-violet-600 font-semibold mb-1">
                  Today's task
                </div>
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  {daily
                    ? `Topic: ${daily.topic}`
                    : "What did you learn today?"}
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-lg">
                  {daily
                    ? `Review your ${daily.subject} questions and lock in today's class.`
                    : "Tell us the topic from today's class and we'll generate a quick quiz on it."}
                </p>
              </div>
              <Button
                data-testid="dashboard-daily-cta"
                size="lg"
                onClick={() => nav("/daily-task")}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6"
              >
                {daily ? "Review today's quiz" : "Start today's quiz"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </section>

          {/* Recent attempts */}
          <section className="soft-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold">Recent attempts</h2>
              <Link to="/history" className="text-xs text-violet-600 font-semibold hover:text-violet-700">View all</Link>
            </div>
            {attempts.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <LineChart className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 mb-4">No attempts yet. Generate your first AI mock test →</p>
                <Button
                  data-testid="dashboard-empty-cta"
                  onClick={() => nav("/create-test")}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Create test
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {attempts.slice(0, 5).map((a) => (
                  <Link
                    key={a.id}
                    to={`/result/${a.id}`}
                    data-testid={`recent-attempt-${a.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-smooth"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 capitalize text-sm">
                        {a.exam.replace("_", " ")} · {a.subjects.join(", ")}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-slate-900">{a.score_pct}%</div>
                      <div className="text-xs text-slate-500">{a.correct}/{a.total}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          <div className="soft-card rounded-2xl p-6">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl font-extrabold text-violet-600 font-mono" data-testid="rail-days-left">
                {dLeft ?? "—"}
              </span>
              <span className="text-slate-500 text-sm">Days</span>
            </div>
            <div className="text-sm text-slate-500">
              left for {user?.target_exam ? user.target_exam.replace("_", " ").toUpperCase() : "your exam"}
            </div>

            <div className="mt-5 flex items-center gap-5">
              <Donut percentage={totalAcc} />
              <div className="space-y-2">
                {subjectDonut.length === 0 ? (
                  <>
                    <Dot color="bg-violet-400" label="Physics" />
                    <Dot color="bg-amber-400" label="Chemistry" />
                    <Dot color="bg-emerald-400" label="Math/Bio" />
                  </>
                ) : (
                  subjectDonut.slice(0, 4).map((s, i) => (
                    <Dot
                      key={s.subject}
                      color={["bg-violet-400", "bg-amber-400", "bg-emerald-400", "bg-sky-400"][i % 4]}
                      label={`${s.subject[0].toUpperCase()}${s.subject.slice(1)} · ${s.accuracy}%`}
                    />
                  ))
                )}
              </div>
            </div>

            <p className="mt-5 text-sm italic text-amber-600 font-medium">
              Practice more. Track more. Improve more.
            </p>

            <Button
              data-testid="rail-start-test-btn"
              onClick={() => nav("/create-test")}
              className="w-full mt-4 bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold border border-violet-200 rounded-xl"
            >
              Start your first test
            </Button>
          </div>

          <div className="soft-card rounded-2xl p-6 space-y-3">
            <KV k="Questions Done" v={analytics?.total_questions ?? 0} testid="rail-questions-done" />
            <KV k="Tests Taken" v={analytics?.total_attempts ?? 0} testid="rail-tests-taken" />
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div>
                <div className="text-xs text-slate-500">Avg. Score</div>
                <div className="font-mono text-lg font-bold text-slate-900">{totalAcc}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Correct</div>
                <div className="font-mono text-lg font-bold text-emerald-600">{analytics?.total_correct ?? 0}</div>
              </div>
            </div>
          </div>

          {!user?.is_subscribed && (
            <div className="rounded-2xl p-6 bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl" />
              <Flame className="w-6 h-6 text-amber-400" />
              <div className="font-display text-xl font-bold mt-3">
                {remaining > 0 ? `${remaining}/5 free Qs left` : "Free limit reached"}
              </div>
              <p className="text-sm text-slate-300 mt-1">Unlock unlimited tests for ₹49 / 28 days.</p>
              <Progress value={(used / 5) * 100} className="mt-3 h-1.5 bg-slate-700" />
              <Button
                data-testid="rail-upgrade-btn"
                size="sm"
                onClick={() => nav("/pricing")}
                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
              >
                Upgrade — ₹49
              </Button>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function Dot({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function KV({ k, v, testid }) {
  return (
    <div className="flex items-center justify-between py-1" data-testid={testid}>
      <span className="text-sm text-slate-500">{k}</span>
      <span className="font-mono font-bold text-slate-900">{v}</span>
    </div>
  );
}

function Donut({ percentage }) {
  const pct = Math.max(0, Math.min(100, percentage));
  const stroke = 12;
  const size = 100;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#6D5EFC" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="46%" textAnchor="middle" className="fill-slate-900 font-mono font-bold" fontSize="18">
        {pct}%
      </text>
      <text x="50%" y="62%" textAnchor="middle" className="fill-slate-500" fontSize="10">Avg</text>
    </svg>
  );
}
