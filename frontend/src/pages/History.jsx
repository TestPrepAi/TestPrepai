import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
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
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] pt-24 pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs uppercase tracking-widest text-slate-500">History</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">All attempts</h1>

        {attempts.length === 0 ? (
          <Card className="p-10 text-center mt-8 border-dashed bg-slate-900/50 border-slate-800">
            <p className="text-slate-400">No attempts yet.</p>
          </Card>
        ) : (
          <div className="mt-6 grid gap-3">
            {attempts.map((a) => (
              <Link
                key={a.id}
                to={`/result/${a.id}`}
                data-testid={`history-item-${a.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-smooth"
              >
                <div className="flex items-center gap-4">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 uppercase">{a.exam.replace("_", " ")}</Badge>
                  <div>
                    <div className="font-medium capitalize">{a.subjects.join(" · ")}</div>
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
