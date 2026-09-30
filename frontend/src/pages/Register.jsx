import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Register() {
  const { register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      toast.success("Account created! Enjoy 5 free questions.");
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0B0F19]">
      <div className="absolute top-40 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <Card className="relative w-full max-w-md p-8 bg-slate-900/70 border-slate-800">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg font-bold">TestPrep AI</span>
        </Link>
        <h1 className="font-display text-3xl font-bold">Create your account</h1>
        <p className="text-slate-400 text-sm mt-1">Start with 5 free AI-generated questions</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name" className="text-slate-300">Full name</Label>
            <Input
              id="name"
              data-testid="register-name-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 bg-slate-800 border-slate-700"
              placeholder="Aditya Sharma"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              data-testid="register-email-input"
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
              data-testid="register-password-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 bg-slate-800 border-slate-700"
              placeholder="At least 6 characters"
            />
          </div>
          <Button
            data-testid="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 h-11"
          >
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
        <p className="text-sm text-slate-400 mt-6 text-center">
          Already have an account?{" "}
          <Link data-testid="register-goto-login-link" to="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
