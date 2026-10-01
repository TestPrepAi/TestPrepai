import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Flame, Trophy, Check } from "lucide-react";

export default function StreakCard({ compact = false }) {
  const nav = useNavigate();
  const [s, setS] = useState(null);

  useEffect(() => {
    api.get("/streak").then((r) => setS(r.data)).catch(() => {});
  }, []);

  const current = s?.current ?? 0;
  const lit = current > 0;

  return (
    <div
      data-testid="streak-card"
      className={`rounded-2xl p-6 relative overflow-hidden ${lit ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white" : "soft-card"}`}
    >
      {lit && <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-300/30 rounded-full blur-2xl" />}
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-[11px] uppercase tracking-widest font-semibold ${lit ? "text-orange-100" : "text-slate-400"}`}>
            Daily streak
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display font-mono text-5xl font-extrabold" data-testid="streak-current">{current}</span>
            <span className={`text-sm ${lit ? "text-orange-100" : "text-slate-500"}`}>day{current === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${lit ? "bg-white/20" : "bg-orange-50"}`}>
          <Flame className={`w-6 h-6 ${lit ? "text-white animate-pulse" : "text-orange-400"}`} />
        </div>
      </div>

      <div className="mt-4 flex justify-between gap-1">
        {(s?.week || []).map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <div
              data-testid={`streak-day-${d.date}`}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                d.done
                  ? lit ? "bg-white text-orange-600" : "bg-orange-500 text-white"
                  : lit ? "bg-white/15 text-white/60" : "bg-slate-100 text-slate-400"
              }`}
            >
              {d.done ? <Check className="w-3.5 h-3.5" /> : d.day[0]}
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className={`mt-4 flex items-center justify-between text-xs ${lit ? "text-orange-50" : "text-slate-500"}`}>
          <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Best: {s?.longest ?? 0} days</span>
          {s?.completed_today ? (
            <span className="font-semibold" data-testid="streak-done-today">Today done ✓</span>
          ) : (
            <button
              data-testid="streak-protect-btn"
              onClick={() => nav("/daily-task")}
              className={`font-semibold underline-offset-2 hover:underline ${lit ? "text-white" : "text-violet-600"}`}
            >
              {lit ? "Protect your streak →" : "Start a streak →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
