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
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0B0F19]">
      <div className="absolute top-40 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <Card className="relative w-full max-w-md p-8 bg-slate-900/70 border-slate-800">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold">TestPrep AI</span>
        </Link>
        <h1 className="font-display text-3xl font-bold">Welcome back</h1>
        <p className="text-slate-400 text-sm mt-1">Continue your JEE / NEET prep</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              data-testid="login-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 bg-slate-800 border-slate-700"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              data-testid="login-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 bg-slate-800 border-slate-700"
              placeholder="••••••••"
            />
          </div>
          <Button
            data-testid="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 h-11"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-sm text-slate-400 mt-6 text-center">
          New here?{" "}
          <Link data-testid="login-goto-register-link" to="/register" className="text-indigo-400 hover:text-indigo-300">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
