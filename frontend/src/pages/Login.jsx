import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Welcome back!");
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#F7F7FB]">
      <Card className="relative w-full max-w-md p-8 soft-card">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-extrabold">TrackPrep</span>
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-slate-900">Welcome back</h1>
        <p className="text-slate-500 text-sm mt-1">Continue your JEE / NEET prep</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" data-testid="login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" data-testid="login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" placeholder="••••••••" />
          </div>
          <Button data-testid="login-submit-btn" type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          New here?{" "}
          <Link data-testid="login-goto-register-link" to="/register" className="text-violet-600 hover:text-violet-700 font-semibold">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
