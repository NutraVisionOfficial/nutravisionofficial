import { useNavigate } from "react-router-dom";
import { Plus, Coffee, Sun, Moon as MoonIcon, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DayLog {
  total_calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface CalorieDashboardProps {
  todayLog: DayLog | null | undefined;
  target: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatsTarget?: number;
}

export function CalorieDashboard({
  todayLog,
  target,
  proteinTarget = 120,
  carbsTarget = 200,
  fatsTarget = 65,
}: CalorieDashboardProps) {
  const navigate = useNavigate();

  const consumed = todayLog?.total_calories ?? 0;
  const remaining = Math.max(0, target - consumed);
  const percentage = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const protein = todayLog?.protein ?? 0;
  const carbs = todayLog?.carbs ?? 0;
  const fats = todayLog?.fats ?? 0;

  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const mealSlots = [
    { label: "Breakfast", icon: Coffee, time: "6am–10am" },
    { label: "Lunch", icon: Sun, time: "11am–2pm" },
    { label: "Dinner", icon: MoonIcon, time: "6pm–9pm" },
    { label: "Snacks", icon: Cookie, time: "Anytime" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Calorie Ring Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
          Daily Calories
        </h3>

        <div className="flex flex-col items-center gap-5">
          {/* Ring */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64" cy="64" r="58"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="7"
              />
              <circle
                cx="64" cy="64" r="58"
                fill="none"
                stroke="hsl(var(--neon-green))"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: "drop-shadow(0 0 6px hsl(var(--neon-green) / 0.5))",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-display text-card-foreground leading-none">
                {remaining}
              </span>
              <span className="text-xs text-muted-foreground mt-1">kcal left</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Goal: {target}
              </span>
            </div>
          </div>

          {/* Macro Bars */}
          <div className="w-full space-y-3">
            <MacroBar
              label="Protein"
              value={protein}
              max={proteinTarget}
              unit="g"
              color="bg-neon-blue"
              glowVar="--neon-blue"
            />
            <MacroBar
              label="Carbs"
              value={carbs}
              max={carbsTarget}
              unit="g"
              color="bg-neon-purple"
              glowVar="--neon-purple"
            />
            <MacroBar
              label="Fats"
              value={fats}
              max={fatsTarget}
              unit="g"
              color="bg-neon-orange"
              glowVar="--neon-orange"
            />
          </div>
        </div>
      </div>

      {/* Today's Diary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Today's Diary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {mealSlots.map((slot) => {
            const Icon = slot.icon;
            return (
              <button
                key={slot.label}
                onClick={() => navigate("/search")}
                className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 transition-colors hover:bg-muted/60 hover:border-primary/40 cursor-pointer"
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">{slot.label}</span>
                <span className="text-[10px] text-muted-foreground">{slot.time}</span>
                <span className="text-xs text-primary mt-1">+ Add</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log a Meal CTA */}
      <Button
        onClick={() => navigate("/search")}
        className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_28px_hsl(var(--primary)/0.5)] transition-shadow"
      >
        <Plus className="w-5 h-5 mr-2" />
        Log a Meal
      </Button>
    </div>
  );
}

function MacroBar({
  label,
  value,
  max,
  unit,
  color,
  glowVar,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  glowVar: string;
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-card-foreground font-medium">
          {value}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{
            width: `${pct}%`,
            boxShadow: `0 0 8px hsl(var(${glowVar}) / 0.4)`,
          }}
        />
      </div>
    </div>
  );
}
