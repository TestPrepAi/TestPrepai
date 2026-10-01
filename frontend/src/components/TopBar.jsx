import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Bell, Flame, Clock } from "lucide-react";

function diffParts(targetDateStr) {
  if (!targetDateStr) return null;
  const t = new Date(targetDateStr + "T00:00:00").getTime();
  const now = Date.now();
  let s = Math.max(0, Math.floor((t - now) / 1000));
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hrs = Math.floor(s / 3600);
  s -= hrs * 3600;
  const mins = Math.floor(s / 60);
  const secs = s - mins * 60;
  return { days, hrs, mins, secs };
}

export default function TopBar({ title }) {
  const { user } = useAuth();
  const parts = useMemo(() => diffParts(user?.target_exam_date), [user?.target_exam_date]);

  const remaining = Math.max(0, 5 - (user?.questions_used || 0));

  return (
    <div className="sticky top-0 z-30 bg-[#F7F7FB]/80 backdrop-blur-md border-b border-slate-200/70">
      <div className="flex items-center justify-between gap-4 px-6 lg:px-10 h-16">
        <div className="font-display text-lg font-bold text-slate-900 truncate">{title}</div>

        <div className="flex items-center gap-3">
          {parts && (
            <div
              data-testid="topbar-countdown"
              className="hidden md:flex items-center gap-2 soft-card rounded-full px-4 py-2"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">Exam in</span>
              <span className="font-mono font-bold text-violet-600 text-sm">{parts.days}D</span>
              <span className="w-1 h-1 bg-violet-300 rounded-full" />
              <span className="font-mono font-bold text-amber-500 text-sm">
                {String(parts.hrs).padStart(2, "0")}:{String(parts.mins).padStart(2, "0")}:{String(parts.secs).padStart(2, "0")}
              </span>
            </div>
          )}

          {user?.is_subscribed ? (
            <Badge data-testid="topbar-pro-badge" className="bg-amber-500 hover:bg-amber-500 text-slate-900 font-semibold rounded-full">
              <Flame className="w-3 h-3 mr-1" /> PRO
            </Badge>
          ) : (
            <Badge data-testid="topbar-free-badge" variant="outline" className="rounded-full border-violet-200 text-violet-700 bg-violet-50">
              {remaining}/5 Free
            </Badge>
          )}
          <button
            data-testid="topbar-notifications"
            className="relative w-10 h-10 rounded-full soft-card flex items-center justify-center text-slate-500 hover:text-slate-900 transition-smooth"
            aria-label="notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </div>
  );
}
