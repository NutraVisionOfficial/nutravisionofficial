import { getTodayLog, mockUser } from "@/data/mockData";

export function CalorieSummary() {
  const today = getTodayLog();
  const target = mockUser.dailyCalorieTarget;
  const consumed = today.totalCalories;
  const remaining = Math.max(0, target - consumed);
  const percentage = Math.min(100, Math.round((consumed / target) * 100));

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold font-display text-card-foreground mb-4">Today's Calories</h3>

      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={percentage > 100 ? "hsl(var(--accent))" : "hsl(var(--primary))"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-display text-card-foreground">{consumed}</span>
            <span className="text-xs text-muted-foreground">/ {target}</span>
          </div>
        </div>

        {/* Macros */}
        <div className="flex-1 space-y-3">
          <MacroBar label="Protein" value={today.protein} max={180} unit="g" />
          <MacroBar label="Carbs" value={today.carbs} max={300} unit="g" />
          <MacroBar label="Fats" value={today.fats} max={80} unit="g" />
          <p className="text-sm text-muted-foreground pt-1">
            <span className="font-semibold text-primary">{remaining}</span> cal remaining
          </p>
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-card-foreground font-medium">{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-primary/60 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
