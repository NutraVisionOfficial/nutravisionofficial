import { Flame, TrendingDown, Dumbbell, Zap } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: "flame" | "weight" | "workout" | "streak";
  variant?: "default" | "accent";
}

const icons = {
  flame: Flame,
  weight: TrendingDown,
  workout: Dumbbell,
  streak: Zap,
};

export function StatCard({ label, value, subtitle, icon, variant = "default" }: StatCardProps) {
  const Icon = icons[icon];

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            variant === "accent"
              ? "bg-accent/10 text-accent"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold font-display text-card-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
