import { useState } from "react";
import { ArrowLeft, Sparkles, Brain, BarChart3, MessageCircle, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "AI Adaptive Meal Planner",
    desc: "Get weekly grocery lists and recipes tailored exactly to your fat loss goals.",
  },
  {
    icon: BarChart3,
    title: "Advanced Nutrient Analytics",
    desc: "Track vitamins, minerals, and recovery metrics with detailed breakdowns.",
  },
  {
    icon: MessageCircle,
    title: "1-on-1 Virtual Coaching",
    desc: "Direct chat access to fitness experts for accountability and guidance.",
  },
  {
    icon: Trophy,
    title: "VIP Transformation Challenges",
    desc: "Unlock specialized 21-day fat loss protocols designed by experts.",
  },
];

const testimonials = [
  {
    name: "Arjun M.",
    initials: "AM",
    quote: "The AI meal planner changed everything for me. Lost 12kg in 8 months without feeling restricted.",
  },
  {
    name: "Priya S.",
    initials: "PS",
    quote: "Hit my goal weight in 6 months. The coaching kept me accountable when motivation dipped.",
  },
  {
    name: "Rohan K.",
    initials: "RK",
    quote: "Best investment in my health. The analytics helped me understand my body like never before.",
  },
];

export default function Upgrade() {
  const [yearly, setYearly] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = () => {
    setLoading(true);
    const monthlyLink = "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-99N06105SK8880832NGGYXYA";
    const yearlyLink = "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-99N06105SK8880832NGGYXYA";
    window.location.href = yearly ? yearlyLink : monthlyLink;
  };

  return (
    <div className="min-h-screen bg-[hsl(220,25%,8%)] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(220,25%,8%)]/80 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="text-lg font-bold font-display">Stride Pro</h1>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 text-gold text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Premium
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight">
            Unlock Your Full Potential
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-md mx-auto">
            Premium tools to accelerate your 3-year transformation.
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-3 text-sm">
            <span className={yearly ? "text-white/40" : "text-white font-medium"}>Monthly</span>
            <Switch checked={yearly} onCheckedChange={setYearly} />
            <span className={yearly ? "text-white font-medium" : "text-white/40"}>Yearly</span>
            {yearly && (
              <span className="ml-1 px-2.5 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wide">
                Save ₹3,000!
              </span>
            )}
          </div>
          <div className="text-center">
            <span className="text-6xl font-extrabold font-display text-gold">
              ₹{yearly ? "9,000" : "1,000"}
            </span>
            <span className="text-white/40 text-base ml-2">
              / {yearly ? "year" : "month"}
            </span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3"
            >
              <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center">
                <f.icon className="w-5 h-5 text-gold" />
              </div>
              <h4 className="text-base font-semibold">{f.title}</h4>
              <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <Button
            className="w-full max-w-md h-14 rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-lg shadow-lg shadow-gold/20"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </Button>
          <p className="text-[11px] text-white/30">
            Cancel anytime · 7-day free trial · Secure payment
          </p>
        </div>

        {/* Social Proof */}
        <div className="space-y-6">
          <h3 className="text-center text-lg font-semibold font-display text-white/70">
            Trusted by thousands on their journey
          </h3>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold/15 text-gold text-sm font-bold flex items-center justify-center">
                    {t.initials}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed italic">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
