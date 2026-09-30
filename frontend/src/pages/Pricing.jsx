import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink, Sparkles } from "lucide-react";

const FEATURES = [
  "Unlimited AI mock tests (JEE Main / Advanced / NEET)",
  "Step-by-step explanations for every question",
  "Subject-wise performance analytics",
  "Score trend & weak-area tracking",
  "Priority AI question generation",
];

export default function Pricing() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [link, setLink] = useState(null);
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = user ? await api.get("/subscription/status") : await api.get("/");
        setLink(r.data.razorpay_link);
      } catch { /* ignore */ }
    })();
  }, [user]);

  const activate = async () => {
    if (!ref.trim()) return toast.error("Enter your Razorpay payment reference");
    setBusy(true);
    try {
      await api.post("/subscription/activate", { payment_reference: ref.trim() });
      await refresh();
      toast.success("PRO activated for 28 days!");
      setOpen(false);
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Activation failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] pt-24 pb-16 px-6">
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="text-xs uppercase tracking-widest text-slate-500">Pricing</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">One plan. Fair price.</h1>
        <p className="text-slate-400 mt-3">Everything you need to crack JEE & NEET — at a fraction of coaching cost.</p>

        <Card className="relative mt-10 p-8 md:p-10 text-left bg-gradient-to-br from-slate-900 to-slate-900/60 border-amber-500/40">
          <Badge className="bg-amber-500 text-slate-900 font-semibold absolute top-6 right-6">Best value</Badge>
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Sparkles className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest">PRO plan</span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="font-display font-extrabold text-6xl md:text-7xl text-amber-400 font-mono">₹49</div>
            <div className="text-slate-400">/ 28 days</div>
          </div>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {user?.is_subscribed ? (
            <div className="mt-8 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm">
              You are on PRO. Expires{" "}
              <span className="font-mono">
                {user.subscription_expires_at ? new Date(user.subscription_expires_at).toLocaleString() : "-"}
              </span>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                data-testid="pricing-razorpay-btn"
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold h-12 px-6"
                onClick={() => link && window.open(link, "_blank")}
                disabled={!link}
              >
                Pay ₹49 via Razorpay <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              <Button
                data-testid="pricing-activate-btn"
                size="lg"
                variant="outline"
                className="h-12 px-6 border-slate-700"
                onClick={() => {
                  if (!user) return nav("/login");
                  setOpen(true);
                }}
              >
                I have paid — activate
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="font-display">Activate your subscription</DialogTitle>
            <DialogDescription>
              Enter the Razorpay payment reference / transaction ID you received after paying ₹49.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Label htmlFor="ref">Payment reference</Label>
            <Input
              id="ref"
              data-testid="pricing-activate-ref-input"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className="bg-slate-800 border-slate-700"
              placeholder="e.g. pay_MxK9zAbc123"
            />
          </div>
          <DialogFooter>
            <Button
              data-testid="pricing-activate-confirm-btn"
              disabled={busy}
              onClick={activate}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              {busy ? "Activating…" : "Activate PRO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
