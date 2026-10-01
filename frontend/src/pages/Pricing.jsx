import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import AppShell from "@/components/AppShell";
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
  "Daily task quiz on your exact classroom topic",
  "Step-by-step explanations for every question",
  "Subject-wise analytics & weak-area tracking",
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

  const content = (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="text-xs uppercase tracking-widest text-violet-600 font-semibold">Pricing</div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">One plan. Fair price.</h1>
        <p className="text-slate-500 mt-2">Everything you need to crack JEE &amp; NEET — at a fraction of coaching cost.</p>
      </div>

      <Card className="relative p-8 md:p-10 soft-card border-2 border-amber-400">
        <Badge className="bg-amber-400 text-slate-900 font-semibold absolute top-6 right-6">Best value</Badge>
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <Sparkles className="w-4 h-4" /> <span className="text-xs uppercase tracking-widest font-semibold">PRO plan</span>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="font-display font-extrabold text-6xl md:text-7xl text-slate-900 font-mono">₹49</div>
          <div className="text-slate-500">/ 28 days</div>
        </div>
        <ul className="mt-8 space-y-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3 text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {user?.is_subscribed ? (
          <div className="mt-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
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
              className="h-12 px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-full"
              onClick={() => link && window.open(link, "_blank")}
              disabled={!link}
            >
              Pay ₹49 via Razorpay <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <Button
              data-testid="pricing-activate-btn"
              size="lg"
              variant="outline"
              className="h-12 px-6 rounded-full border-slate-300"
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="font-display">Activate your subscription</DialogTitle>
            <DialogDescription>Enter the Razorpay payment reference / transaction ID after paying ₹49.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Label htmlFor="ref">Payment reference</Label>
            <Input id="ref" data-testid="pricing-activate-ref-input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. pay_MxK9zAbc123" />
          </div>
          <DialogFooter>
            <Button data-testid="pricing-activate-confirm-btn" disabled={busy} onClick={activate} className="bg-violet-600 hover:bg-violet-700 text-white">
              {busy ? "Activating…" : "Activate PRO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (!user) {
    // Public pricing page
    return <div className="min-h-screen bg-[#F7F7FB] pt-24 pb-16 px-6">{content}</div>;
  }
  return <AppShell title="Pricing">{content}</AppShell>;
}
