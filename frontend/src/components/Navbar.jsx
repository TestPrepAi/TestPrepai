import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, LayoutDashboard, PlusCircle, BarChart3, History, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const isActive = (p) => loc.pathname === p;
  const linkCls = (p) =>
    `text-sm font-medium transition-smooth ${
      isActive(p) ? "text-white" : "text-slate-400 hover:text-white"
    }`;

  const remaining = user ? Math.max(0, 5 - (user.questions_used || 0)) : 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-brand-logo" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">TestPrep AI</span>
        </Link>

        {user ? (
          <nav className="hidden md:flex items-center gap-6">
            <Link data-testid="nav-dashboard-link" to="/dashboard" className={linkCls("/dashboard")}>
              <span className="inline-flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" />Dashboard</span>
            </Link>
            <Link data-testid="nav-create-test-link" to="/create-test" className={linkCls("/create-test")}>
              <span className="inline-flex items-center gap-1.5"><PlusCircle className="w-4 h-4" />Create Test</span>
            </Link>
            <Link data-testid="nav-analytics-link" to="/analytics" className={linkCls("/analytics")}>
              <span className="inline-flex items-center gap-1.5"><BarChart3 className="w-4 h-4" />Analytics</span>
            </Link>
            <Link data-testid="nav-history-link" to="/history" className={linkCls("/history")}>
              <span className="inline-flex items-center gap-1.5"><History className="w-4 h-4" />History</span>
            </Link>
          </nav>
        ) : null}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.is_subscribed ? (
                <Badge data-testid="nav-pro-badge" className="bg-amber-500 hover:bg-amber-500 text-slate-900 font-semibold">PRO</Badge>
              ) : (
                <Badge data-testid="nav-free-count-badge" variant="outline" className="border-indigo-500/50 text-indigo-300">
                  {remaining}/5 Free
                </Badge>
              )}
              {!user.is_subscribed && (
                <Button
                  data-testid="nav-pricing-cta"
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                  onClick={() => nav("/pricing")}
                >
                  ₹49 / 28d
                </Button>
              )}
              <span className="hidden md:inline text-xs text-slate-400">{user.name}</span>
              <Button data-testid="nav-logout-btn" variant="ghost" size="icon" onClick={() => { logout(); nav("/"); }}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button data-testid="nav-login-btn" variant="ghost" size="sm" onClick={() => nav("/login")}>Login</Button>
              <Button data-testid="nav-signup-btn" size="sm" className="bg-indigo-500 hover:bg-indigo-600" onClick={() => nav("/register")}>Sign up</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
