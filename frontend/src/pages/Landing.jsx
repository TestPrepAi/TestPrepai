import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Atom, FlaskConical, Sigma, Dna, CheckCircle2, Sparkles, Zap, Brain, LineChart, ArrowRight, Calendar
} from "lucide-react";

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="landing-brand">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight">TrackPrep</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" data-testid="landing-login-btn" onClick={() => nav("/login")}>Login</Button>
            <Button data-testid="landing-signup-btn" onClick={() => nav("/register")} className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-5">
              Get started free
            </Button>
          </div>
        </div>
      </header>

      <section className="relative max-w-7xl mx-auto px-6 pt-32 pb-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 rounded-full py-1.5 px-3" data-testid="hero-badge">
              <Sparkles className="w-3 h-3 mr-1.5" /> AI mock tests · aligned to your coaching
            </Badge>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-slate-900">
              Turn today's class
              <br /> into tomorrow's <span className="text-violet-600">rank.</span>
            </h1>
            <p className="mt-5 text-slate-600 text-lg max-w-xl leading-relaxed">
              Tell TrackPrep what your teacher taught today — GPT-5.6 generates a focused quiz on that exact topic.
              Simulate full-length JEE Main, JEE Advanced & NEET papers whenever you want.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button data-testid="hero-get-started-btn" size="lg" onClick={() => nav("/register")} className="h-12 px-6 bg-violet-600 hover:bg-violet-700 text-white rounded-full">
                Start free — 5 questions <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button data-testid="hero-view-pricing-btn" size="lg" variant="outline" onClick={() => nav("/pricing")} className="h-12 px-6 border-slate-200 rounded-full">
                See pricing
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-sm text-slate-500">
              <Check label="No credit card for free tier" />
              <Check label="NTA-style simulator" />
              <Check label="Instant AI solutions" />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-200 to-amber-200 blur-3xl opacity-50 rounded-3xl" />
              <div className="relative soft-card rounded-3xl p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 mb-4">
                  <Calendar className="w-3.5 h-3.5" /> Today's task preview
                </div>
                <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4 mb-3">
                  <div className="text-xs text-violet-600 font-semibold uppercase mb-1">Topic you learnt today</div>
                  <div className="font-display font-bold text-slate-900 text-lg">Rotational Motion — Moment of Inertia</div>
                </div>
                <div className="space-y-2">
                  <PreviewQ n={1} text="A uniform rod of length L is pivoted at one end…" />
                  <PreviewQ n={2} text="The moment of inertia of a solid sphere about…" />
                  <PreviewQ n={3} text="Two discs are rotating with angular velocities…" />
                </div>
                <Button data-testid="hero-preview-cta" onClick={() => nav("/register")} className="w-full mt-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                  Generate my own quiz →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14">
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-4">Covered exams &amp; subjects</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Atom, name: "Physics", color: "bg-violet-100 text-violet-700" },
            { icon: FlaskConical, name: "Chemistry", color: "bg-amber-100 text-amber-700" },
            { icon: Sigma, name: "Mathematics", color: "bg-sky-100 text-sky-700" },
            { icon: Dna, name: "Biology", color: "bg-emerald-100 text-emerald-700" },
          ].map(({ icon: Icon, name, color }) => (
            <div key={name} data-testid={`landing-subject-${name.toLowerCase()}`} className="soft-card rounded-2xl p-5">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-3 font-semibold">{name}</div>
              <div className="text-xs text-slate-500 font-mono">JEE Main · Advanced · NEET</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="font-display text-3xl lg:text-4xl font-extrabold tracking-tight mb-10 max-w-2xl text-slate-900">
          Everything you need to crack <span className="text-violet-600">your target exam.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Calendar, title: "Daily task alignment", body: "We ask what your teacher taught today — then quiz you on exactly that topic.", color: "bg-amber-100 text-amber-700" },
            { icon: Brain, title: "AI mock tests", body: "GPT-5.6 crafts fresh MCQs across JEE Main, JEE Advanced & NEET syllabus.", color: "bg-violet-100 text-violet-700" },
            { icon: Zap, title: "Instant explanations", body: "Every question comes with a step-by-step solution — learn from every mistake.", color: "bg-rose-100 text-rose-700" },
            { icon: LineChart, title: "Track weak areas", body: "Subject-wise accuracy, time-per-question and score trends over time.", color: "bg-emerald-100 text-emerald-700" },
            { icon: Sparkles, title: "Simple pricing", body: "First 5 questions free. Then ₹49 for 28 days — unlimited AI tests.", color: "bg-sky-100 text-sky-700" },
            { icon: CheckCircle2, title: "NTA simulator UI", body: "Question palette, mark-for-review, countdown timer — just like exam day.", color: "bg-slate-900 text-amber-300" },
          ].map(({ icon: Icon, title, body, color }) => (
            <div key={title} className="soft-card rounded-2xl p-6">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-slate-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-violet-800 p-10 overflow-hidden text-white">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            <div>
              <Badge className="bg-amber-400 text-slate-900 font-semibold">Simple pricing</Badge>
              <h2 className="mt-4 font-display text-3xl lg:text-4xl font-extrabold">₹49 for 28 days.<br />Unlimited AI tests.</h2>
              <p className="mt-3 text-violet-100 text-sm">One flat price for JEE Main, JEE Advanced and NEET.</p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="font-mono text-6xl font-extrabold text-amber-400">₹49</div>
              <div className="text-violet-200 text-sm">per 28 days</div>
              <Button data-testid="landing-cta-btn" size="lg" onClick={() => nav("/register")} className="h-12 px-8 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full">
                Get started free
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} TrackPrep · Built for JEE &amp; NEET aspirants in India
      </footer>
    </div>
  );
}

function Check({ label }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {label}
    </div>
  );
}

function PreviewQ({ n, text }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <span className="font-mono text-xs text-slate-400 pt-0.5">Q{n}</span>
      <span className="text-sm text-slate-700 line-clamp-1">{text}</span>
    </div>
  );
}
