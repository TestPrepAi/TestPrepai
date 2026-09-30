import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Flame, Target, BarChart3, Sparkles, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, s] = await Promise.all([
          api.get("/attempts"),
          api.get("/analytics/summary"),
        ]);
        setAttempts(a.data.attempts || []);
        setAnalytics(s.data);
      } catch { /* ignore */ }
    })();
  }, []);

  const used = user?.questions_used || 0;
  const remaining = Math.max(0, 5 - used);
  const isSub = user?.is_subscribed;

  return (
    <div className="min-h-screen bg-[#0B0F19] pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Dashboard</div>
            <h1 data-testid="dashboard-heading" className="font-display text-3xl sm:text-4xl font-bold mt-1">
              Namaste, {user?.name?.split(" ")[0] || "aspirant"} 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Ready to conquer today's mock test?</p>
          </div>
          <Button
            data-testid="dashboard-new-test-btn"
            size="lg"
            className="bg-indigo-500 hover:bg-indigo-600"
            onClick={() => nav("/create-test")}
          >
            <PlusCircle className="w-4 h-4 mr-2" /> New Mock Test
          </Button>
        </div>

        {/* Quota / Sub card */}
        {!isSub ? (
          <Card className="p-6 mb-8 bg-gradient-to-br from-indigo-950/40 to-amber-950/20 border-amber-500/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[240px]">
                <div className="text-xs uppercase tracking-widest text-amber-400 mb-2">Free Trial</div>
                <div className="font-display text-2xl font-bold">
                  {remaining > 0 ? `${remaining} of 5 free questions left` : "You have used all 5 free questions"}
                </div>
                <Progress value={(used / 5) * 100} className="mt-3 h-2 bg-slate-800" />
                <p className="text-sm text-slate-400 mt-3">
                  Unlock unlimited JEE Main, JEE Advanced & NEET mock tests for just ₹49 / 28 days.
                </p>
              </div>
              <Button
                data-testid="dashboard-upgrade-btn"
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                onClick={() => nav("/pricing")}
              >
                Upgrade to PRO — ₹49
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-8 bg-gradient-to-br from-emerald-950/40 to-indigo-950/20 border-emerald-500/30">
            <div className="flex items-center gap-4">
              <Sparkles className="w-8 h-8 text-emerald-400" />
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-400 mb-1">PRO Active</div>
                <div className="font-display text-xl font-bold">Unlimited mock tests unlocked</div>
                <div className="text-sm text-slate-400 mt-1 font-mono">
                  Expires {user.subscription_expires_at ? new Date(user.subscription_expires_at).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Bento stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-slate-900/70 border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-slate-500">Tests taken</div>
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3 font-mono text-4xl font-bold" data-testid="stat-total-tests">
              {analytics?.total_attempts ?? 0}
            </div>
          </Card>
          <Card className="p-6 bg-slate-900/70 border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-slate-500">Avg. score</div>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 font-mono text-4xl font-bold" data-testid="stat-avg-score">
              {analytics?.avg_score ?? 0}%
            </div>
          </Card>
          <Card className="p-6 bg-slate-900/70 border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-slate-500">Questions attempted</div>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-3 font-mono text-4xl font-bold" data-testid="stat-total-questions">
              {analytics?.total_questions ?? 0}
            </div>
          </Card>
        </div>

        {/* Recent attempts */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Recent attempts</h2>
          <Link to="/history" className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
        </div>
        {attempts.length === 0 ? (
          <Card className="p-10 text-center bg-slate-900/50 border-dashed border-slate-800">
            <BarChart3 className="w-8 h-8 mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400">No attempts yet. Generate your first AI mock test →</p>
            <Button
              data-testid="dashboard-empty-cta"
              className="mt-4 bg-indigo-500 hover:bg-indigo-600"
              onClick={() => nav("/create-test")}
            >
              Create test
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {attempts.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                to={`/result/${a.id}`}
                data-testid={`recent-attempt-${a.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-smooth"
              >
                <div className="flex items-center gap-4">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 uppercase">
                    {a.exam.replace("_", " ")}
                  </Badge>
                  <div>
                    <div className="font-medium">{a.subjects.map((s) => s[0].toUpperCase() + s.slice(1)).join(" · ")}</div>
                    <div className="text-xs text-slate-500 font-mono">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-bold">{a.score_pct}%</div>
                  <div className="text-xs text-slate-500">{a.correct}/{a.total} correct</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
