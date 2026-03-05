import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Coffee, Sun, Moon as MoonIcon, Cookie, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodayFoodLogs, useDeleteFoodLog } from "@/hooks/useFoodLogs";

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

const MEAL_META = {
  breakfast: { label: "Breakfast", icon: Coffee, time: "6am–10am" },
  lunch: { label: "Lunch", icon: Sun, time: "11am–2pm" },
  dinner: { label: "Dinner", icon: MoonIcon, time: "6pm–9pm" },
  snack: { label: "Snacks", icon: Cookie, time: "Anytime" },
} as const;

type MealType = keyof typeof MEAL_META;

export function CalorieDashboard({
  todayLog,
  target,
  proteinTarget = 120,
  carbsTarget = 200,
  fatsTarget = 65,
}: CalorieDashboardProps) {
  const navigate = useNavigate();
  const { data: foodLogs } = useTodayFoodLogs();
  const deleteFoodLog = useDeleteFoodLog();

  const consumed = todayLog?.total_calories ?? 0;
  const remaining = Math.max(0, target - consumed);
  const percentage = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const protein = todayLog?.protein ?? 0;
  const carbs = todayLog?.carbs ?? 0;
  const fats = todayLog?.fats ?? 0;

  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Group food logs by meal type
  const groupedLogs = useMemo(() => {
    const groups: Record<MealType, typeof foodLogs> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const log of foodLogs || []) {
      const key = (log.meal_type as MealType) || "snack";
      if (groups[key]) groups[key]!.push(log);
      else groups.snack!.push(log);
    }
    return groups;
  }, [foodLogs]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Calorie Ring Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
          Daily Calories
        </h3>

        <div className="flex flex-col items-center gap-5">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="58" fill="none" stroke="hsl(var(--secondary))" strokeWidth="7" />
              <circle
                cx="64" cy="64" r="58" fill="none"
                stroke="hsl(var(--neon-green))" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
                style={{ filter: "drop-shadow(0 0 6px hsl(var(--neon-green) / 0.5))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-display text-card-foreground leading-none">{remaining}</span>
              <span className="text-xs text-muted-foreground mt-1">kcal left</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Goal: {target}</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <MacroBar label="Protein" value={protein} max={proteinTarget} unit="g" color="bg-neon-blue" glowVar="--neon-blue" />
            <MacroBar label="Carbs" value={carbs} max={carbsTarget} unit="g" color="bg-neon-purple" glowVar="--neon-purple" />
            <MacroBar label="Fats" value={fats} max={fatsTarget} unit="g" color="bg-neon-orange" glowVar="--neon-orange" />
          </div>
        </div>
      </div>

      {/* Today's Diary - Real Data */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Today's Diary
        </h3>
        <div className="space-y-4">
          {(Object.keys(MEAL_META) as MealType[]).map((mealType) => {
            const meta = MEAL_META[mealType];
            const Icon = meta.icon;
            const items = groupedLogs[mealType] || [];
            const mealCalories = items.reduce((s, i) => s + i.calories, 0);

            return (
              <div key={mealType} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-card-foreground">{meta.label}</span>
                    {mealCalories > 0 && (
                      <span className="text-xs text-primary font-medium">{mealCalories} kcal</span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate("/search")}
                    className="text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-1.5 ml-6">
                    {items.map((item) => (
                      <SwipeToDelete
                        key={item.id}
                        onDelete={() => deleteFoodLog.mutate(item.id)}
                      >
                        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 group">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.emoji}</span>
                            <span className="text-sm text-card-foreground">{item.food_name}</span>
                            {Number(item.quantity) > 1 && (
                              <span className="text-[10px] text-muted-foreground">×{Number(item.quantity)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                            <button
                              onClick={() => deleteFoodLog.mutate(item.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </SwipeToDelete>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate("/search")}
                    className="ml-6 w-[calc(100%-1.5rem)] flex items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground hover:bg-muted/40 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log {meta.label.toLowerCase()}
                  </button>
                )}
              </div>
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

function MacroBar({ label, value, max, unit, color, glowVar }: {
  label: string; value: number; max: number; unit: string; color: string; glowVar: string;
}) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-card-foreground font-medium">{value}{unit} / {max}{unit}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%`, boxShadow: `0 0 8px hsl(var(${glowVar}) / 0.4)` }}
        />
      </div>
    </div>
  );
}

function SwipeToDelete({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const swiping = useRef(false);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    swiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping.current) return;
    currentX.current = e.touches[0].clientX;
    const diff = Math.min(0, currentX.current - startX.current);
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    swiping.current = false;
    if (offsetX < -threshold) {
      setOffsetX(-containerRef.current!.offsetWidth);
      setTimeout(onDelete, 200);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg">
      <div
        className="absolute inset-0 flex items-center justify-end px-4 bg-destructive"
      >
        <Trash2 className="w-4 h-4 text-destructive-foreground" />
      </div>
      <div
        className="relative z-10 transition-transform"
        style={{
          transform: `translateX(${offsetX}px)`,
          transitionDuration: swiping.current ? "0ms" : "200ms",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
