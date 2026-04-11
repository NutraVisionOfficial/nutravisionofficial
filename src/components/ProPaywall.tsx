import { useState } from "react";
import { X, Sparkles, Brain, BarChart3, MessageCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface ProPaywallProps {
  open: boolean;
  onClose: () => void;
}

const features = [
  {
    icon: Brain,
    title: "AI Adaptive Meal Planner",
    desc: "Get weekly grocery lists and recipes tailored exactly to your fat loss goals.",
  },
  {
    icon: BarChart3,
    title: "Advanced Nutrient Analytics",
    desc: "Track vitamins, minerals, and recovery metrics.",
  },
  {
    icon: MessageCircle,
    title: "1-on-1 Virtual Coaching",
    desc: "Direct chat access to fitness experts for accountability.",
  },
  {
    icon: Trophy,
    title: "VIP Transformation Challenges",
    desc: "Unlock specialized 21-day fat loss protocols.",
  },
];

export function ProPaywall({ open, onClose }: ProPaywallProps) {
  const [yearly, setYearly] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* content */}
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-[hsl(220,25%,8%)] text-white shadow-2xl border border-gold/20 animate-scale-in">
        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        <div className="p-8 space-y-8">
          {/* header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" /> NutraVision Pro
            </div>
            <h2 className="text-3xl font-bold font-display">
              Unlock Your Full Potential
            </h2>
            <p className="text-sm text-white/50">
              Premium tools to accelerate your fitness journey
            </p>
          </div>

          {/* pricing toggle */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className={yearly ? "text-white/40" : "text-white font-medium"}>Monthly</span>
              <Switch checked={yearly} onCheckedChange={setYearly} />
              <span className={yearly ? "text-white font-medium" : "text-white/40"}>Yearly</span>
              {yearly && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wide">
                  Save ₹3,000!
                </span>
              )}
            </div>
            <div className="text-center">
              <span className="text-5xl font-extrabold font-display text-gold">
                ₹{yearly ? "9,000" : "1,000"}
              </span>
              <span className="text-white/40 text-sm ml-1">
                / {yearly ? "year" : "month"}
              </span>
            </div>
          </div>

          {/* features */}
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4 items-start">
                <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                  <f.icon className="w-4.5 h-4.5 text-gold" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{f.title}</h4>
                  <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            className="w-full h-12 rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-base shadow-lg shadow-gold/20"
            onClick={onClose}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>

          <p className="text-center text-[11px] text-white/30">
            Cancel anytime · 7-day free trial · Secure payment
          </p>
        </div>
      </div>
    </div>
  );
}
