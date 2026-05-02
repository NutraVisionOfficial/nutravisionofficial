import { useMemo, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DayLog {
  date: string;
  total_calories: number;
  workout_type: string;
  workout_duration_mins: number;
  current_weight: number | null;
}

interface WeeklyHabitTrackerProps {
  logs: DayLog[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + mondayOffset + i);
    return d.toISOString().split("T")[0];
  });
}

export function WeeklyHabitTracker({ logs }: WeeklyHabitTrackerProps) {
  const today = new Date().toISOString().split("T")[0];
  const weekDates = useMemo(() => getWeekDates(), []);

  const logMap = useMemo(() => {
    const map: Record<string, DayLog> = {};
    for (const l of logs) map[l.date] = l;
    return map;
  }, [logs]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in"
         style={{ background: "hsl(var(--card))" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">This Week</h3>
        <div className="flex items-center gap-4">
          <Legend color="bg-[hsl(142,71%,45%)]" label="Calories" />
          <Legend color="bg-[hsl(217,91%,60%)]" label="Workout" />
          <Legend color="bg-[hsl(270,70%,60%)]" label="Weight" />
        </div>
      </div>
      <div className="flex justify-between gap-1">
        {weekDates.map((date, i) => {
          const log = logMap[date];
          const isToday = date === today;
          const hasCalories = (log?.total_calories ?? 0) > 0;
          const hasWorkout = !!log && log.workout_type !== "Rest" && log.workout_duration_mins > 0;
          const hasWeight = log?.current_weight != null && log.current_weight > 0;

          return (
            <Popover key={date}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 py-2.5 px-1 rounded-lg transition-all cursor-pointer",
                    "hover:bg-muted/40",
                    isToday && "ring-1 ring-primary/60 shadow-[0_0_8px_hsl(var(--primary)/0.25)]"
                  )}
                >
                  <span className={cn(
                    "text-xs font-medium",
                    isToday ? "text-primary" : "text-muted-foreground"
                  )}>
                    {DAY_LABELS[i]}
                  </span>
                  <div className="flex gap-1.5 items-center">
                    <Dot active={hasCalories} color="bg-[hsl(142,71%,45%)]" />
                    <Dot active={hasWorkout} color="bg-[hsl(217,91%,60%)]" />
                    <Dot active={hasWeight} color="bg-[hsl(270,70%,60%)]" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-3" side="top" align="center">
                <p className="text-sm font-semibold text-foreground mb-1.5">
                  {new Date(date + "T12:00:00").toLocaleDateString(undefined, { weekday: "long" })}
                </p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{hasCalories ? "✅" : "❌"} Calories</p>
                  <p>{hasWorkout ? "✅" : "❌"} Workout</p>
                  <p>{hasWeight ? "✅" : "❌"} Weight</p>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
}

const Dot = React.forwardRef<HTMLSpanElement, { active: boolean; color: string }>(
  ({ active, color }, ref) => (
    <span
      ref={ref}
      className={cn(
        "w-2.5 h-2.5 rounded-full transition-colors",
        active ? color : "bg-muted-foreground/25 border border-muted-foreground/30"
      )}
    />
  )
);
Dot.displayName = "Dot";

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
