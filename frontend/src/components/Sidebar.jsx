import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Home, Calendar, PlusCircle, BarChart3, History, Gift, Sparkles, LogOut, BookOpen, Target
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home, testid: "sidebar-home" },
  { to: "/daily-task", label: "Daily Task", icon: Calendar, testid: "sidebar-daily" },
  { to: "/create-test", label: "Custom Test", icon: PlusCircle, testid: "sidebar-create" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, testid: "sidebar-analytics" },
  { to: "/history", label: "History", icon: History, testid: "sidebar-history" },
  { to: "/pricing", label: "Upgrade", icon: Gift, testid: "sidebar-pricing" },
];

export default function Sidebar() {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 z-40">
      <Link to="/dashboard" data-testid="sidebar-brand" className="flex items-center gap-2 h-16 px-6 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-extrabold tracking-tight">TrackPrep</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = loc.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              data-testid={item.testid}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-smooth ${
                active
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-6 pb-2 px-4 text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
          Personal Progress
        </div>
        <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          {user?.target_exam ? user.target_exam.replace("_", " ").toUpperCase() : "No target set"}
        </div>
        <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          {user?.coaching_enrolled ? user?.coaching_name || "Enrolled" : "Self-study"}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
        <Button
          data-testid="sidebar-logout"
          variant="outline"
          size="sm"
          onClick={() => { logout(); nav("/"); }}
          className="w-full border-slate-200"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" /> Log out
        </Button>
      </div>
    </aside>
  );
}
