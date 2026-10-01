import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/analytics/summary");
        setData(data);
      } catch { /* ignore */ }
    })();
  }, []);

  if (!data) {
    return (
      <AppShell title="Analytics">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-violet-600" /></div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Analytics">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">Preparation report</h1>
        <p className="text-sm text-slate-500 mt-1">Track your growth toward exam day.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total attempts" value={data.total_attempts} />
        <Stat label="Avg. score" value={`${data.avg_score}%`} accent="text-amber-600" />
        <Stat label="Questions solved" value={data.total_questions} />
        <Stat label="Correct" value={data.total_correct} accent="text-emerald-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 soft-card">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Subject-wise accuracy</div>
          {data.subject_breakdown.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.subject_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="subject" stroke="#64748B" tickFormatter={(v) => v[0].toUpperCase() + v.slice(1)} />
                <YAxis stroke="#64748B" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10 }} />
                <Bar dataKey="accuracy" fill="#6D5EFC" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 soft-card">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">Score trend</div>
          {data.trend.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" />
                <YAxis stroke="#64748B" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10 }} />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: "#F59E0B", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {data.exam_breakdown.length > 0 && (
        <Card className="p-6 soft-card mt-6">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-semibold">By exam</div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.exam_breakdown.map((e) => (
              <div key={e.exam} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-mono uppercase text-xs text-slate-500">{e.exam.replace("_", " ")}</div>
                <div className="mt-2 font-display text-2xl font-extrabold text-slate-900">{e.avg_score}%</div>
                <div className="text-xs text-slate-500">{e.count} attempts</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppShell>
  );
}

function Stat({ label, value, accent = "text-slate-900" }) {
  return (
    <Card className="p-5 soft-card">
      <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{label}</div>
      <div className={`mt-2 font-mono text-3xl font-extrabold ${accent}`}>{value}</div>
    </Card>
  );
}

function Empty() {
  return <div className="h-[240px] flex items-center justify-center text-sm text-slate-400">No data yet. Take a test!</div>;
}
