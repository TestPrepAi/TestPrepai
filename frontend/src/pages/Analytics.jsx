import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-xs uppercase tracking-widest text-slate-500">Analytics</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Preparation report</h1>
        <p className="text-slate-400 text-sm mt-1">Track your growth toward exam day.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Stat label="Total attempts" value={data.total_attempts} />
          <Stat label="Avg. score" value={`${data.avg_score}%`} accent="text-amber-400" />
          <Stat label="Questions solved" value={data.total_questions} />
          <Stat label="Correct" value={data.total_correct} accent="text-emerald-400" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <Card className="p-6 bg-slate-900/70 border-slate-800">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">Subject-wise accuracy</div>
            {data.subject_breakdown.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.subject_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="subject" stroke="#94a3b8" tickFormatter={(v) => v[0].toUpperCase() + v.slice(1)} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 8 }} />
                  <Bar dataKey="accuracy" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6 bg-slate-900/70 border-slate-800">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">Score trend</div>
            {data.trend.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: "#F59E0B", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {data.exam_breakdown.length > 0 && (
          <Card className="p-6 bg-slate-900/70 border-slate-800 mt-6">
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-3">By exam</div>
            <div className="grid md:grid-cols-3 gap-4">
              {data.exam_breakdown.map((e) => (
                <div key={e.exam} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-mono uppercase text-xs text-slate-500">{e.exam.replace("_", " ")}</div>
                  <div className="mt-2 font-display text-2xl font-bold">{e.avg_score}%</div>
                  <div className="text-xs text-slate-400">{e.count} attempts</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "text-slate-100" }) {
  return (
    <Card className="p-5 bg-slate-900/70 border-slate-800">
      <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-2 font-mono text-3xl font-bold ${accent}`}>{value}</div>
    </Card>
  );
}

function Empty() {
  return <div className="h-[240px] flex items-center justify-center text-sm text-slate-500">No data yet. Take a test!</div>;
}
