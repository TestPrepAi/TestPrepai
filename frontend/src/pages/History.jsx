import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function History() {
  const [attempts, setAttempts] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/attempts");
        setAttempts(data.attempts || []);
      } catch { setAttempts([]); }
    })();
  }, []);

  if (attempts === null) {
    return (
      <AppShell title="History">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell title="History">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">All attempts</h1>
        <p className="text-sm text-slate-500 mt-1">Every test you've taken, newest first.</p>
      </div>

      {attempts.length === 0 ? (
        <Card className="p-10 text-center soft-card">
          <p className="text-slate-500">No attempts yet.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {attempts.map((a) => (
            <Link
              key={a.id}
              to={`/result/${a.id}`}
              data-testid={`history-item-${a.id}`}
              className="flex items-center justify-between p-4 rounded-xl soft-card hover:-translate-y-0.5 transition-smooth"
            >
              <div className="flex items-center gap-4">
                <Badge className="bg-violet-100 text-violet-700 border-violet-200 uppercase">{a.exam.replace("_", " ")}</Badge>
                <div>
                  <div className="font-semibold text-slate-900 capitalize">{a.subjects.join(" · ")}</div>
                  <div className="text-xs text-slate-500 font-mono">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xl font-bold text-slate-900">{a.score_pct}%</div>
                <div className="text-xs text-slate-500">{a.correct}/{a.total} correct</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
