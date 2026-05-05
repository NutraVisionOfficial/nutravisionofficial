import { useMemo } from "react";
import { format, subDays, startOfMonth, addDays } from "date-fns";
import { TrendingDown, Flame, Zap, Dumbbell, Activity } from "lucide-react";
import { useDailyLogs, useStreak } from "@/hooks/useDailyLogs";
import { useProfile } from "@/hooks/useProfile";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { usePhysiqueScans } from "@/hooks/usePhysiqueScans";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CartesianGrid } from "recharts";

export default function Progress() {
  const { data: logs } = useDailyLogs(30);
  const { data: profile } = useProfile();
  const { data: streak } = useStreak();
  const { data: weightEntries } = useWeightLogs(90);
  const { data: physiqueScans } = usePhysiqueScans();

  const today = new Date();

  // Weight chart data (last 30 days with weight entries)
  const weightData = useMemo(() => {
    if (!weightEntries) return [];
    return weightEntries.map((l) => ({
      date: format(new Date(l.date), "MMM d"),
      weight: Number(l.weight),
    }));
  }, [weightEntries]);

  const bodyFatData = useMemo(() => {
    if (!physiqueScans) return [];
    return physiqueScans.map((s) => ({
      date: format(new Date(s.created_at), "MMM d"),
      bf: Number(s.body_fat_percentage),
    }));
  }, [physiqueScans]);

  // Prediction engine
  const prediction = useMemo(() => {
    if (!logs || logs.length < 2 || !profile) return null;

    const last7 = logs.slice(-7);
    const avgCalories = Math.round(last7.reduce((s, l) => s + l.total_calories, 0) / last7.length);
    const target = profile.daily_calorie_target ?? 2000;
    const dailyDeficit = target - avgCalories; // positive = deficit
    const kgPerDay = dailyDeficit > 0 ? (dailyDeficit * 7) / 7700 / 7 : 0; // ~7700 kcal per kg
    const currentWeight = Number(profile.current_weight) || 80;
    const predictedWeight = Math.round((currentWeight - kgPerDay * 30) * 10) / 10;
    const monthlyLoss = Math.round((currentWeight - predictedWeight) * 10) / 10;
    const predictionDate = format(addDays(today, 30), "MMMM d, yyyy");

    return { predictedWeight, monthlyLoss, predictionDate, avgCalories, dailyDeficit };
  }, [logs, profile]);

  // Weekly consistency (last 7 days)
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const log = logs?.find((l) => l.date === dateStr);
      days.push({
        label: format(d, "EEE"),
        date: format(d, "d"),
        logged: !!log && log.total_calories > 0,
        workout: !!log && log.workout_type !== "Rest",
      });
    }
    return days;
  }, [logs]);

  // Stats
  const totalWeightLost = useMemo(() => {
    if (!profile) return 0;
    return Math.round((Number(profile.starting_weight) - Number(profile.current_weight)) * 10) / 10;
  }, [profile]);

  const avgCalories = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    const last7 = logs.slice(-7);
    return Math.round(last7.reduce((s, l) => s + l.total_calories, 0) / last7.length);
  }, [logs]);

  const workoutsThisMonth = useMemo(() => {
    if (!logs) return 0;
    const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
    return logs.filter((l) => l.date >= monthStart && l.workout_type !== "Rest").length;
  }, [logs]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto flex items-center gap-3 px-4 py-4">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">Progress</h1>
            <p className="text-xs text-muted-foreground">Your analytics & predictions</p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero: The Future You */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/20 p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">The Future You</h2>
          </div>
          {prediction && prediction.dailyDeficit > 0 ? (
            <>
              <p className="text-xl md:text-2xl font-bold font-display text-foreground leading-snug">
                If you keep this up, you will weigh{" "}
                <span className="text-primary">{prediction.predictedWeight} kg</span> by{" "}
                <span className="text-primary">{prediction.predictionDate}</span>.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You are on track to lose{" "}
                <span className="font-semibold text-foreground">{prediction.monthlyLoss} kg</span>{" "}
                this month.
              </p>
            </>
          ) : (
            <p className="text-lg font-medium text-muted-foreground">
              Start logging your meals to unlock your weight prediction.
            </p>
          )}
        </div>

        {/* Weight Graph */}
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
          <h3 className="text-base font-semibold font-display text-card-foreground mb-4">Weight Trend</h3>
          {weightData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
              <AreaChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  unit="kg"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#weightGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Log your weight daily to see trends
            </div>
          )}
        </div>

        {/* Body Fat Trend */}
        <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
          <h3 className="text-base font-semibold font-display text-card-foreground mb-4">Body Fat Trend</h3>
          {bodyFatData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
              <AreaChart data={bodyFatData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bf"
                  name="Body Fat"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fill="url(#bfGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Complete at least 2 physique scans to see trends
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
          <h3 className="text-base font-semibold font-display text-card-foreground mb-4">
            Weekly Consistency
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  {d.label}
                </span>
                <span className="text-xs font-semibold text-foreground">{d.date}</span>
                <div className="flex flex-col gap-1 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      d.logged
                        ? "bg-green-500 shadow-sm shadow-green-500/40"
                        : "bg-muted"
                    }`}
                    title={d.logged ? "Calories logged" : "No log"}
                  />
                  <div
                    className={`w-3 h-3 rounded-full ${
                      d.workout
                        ? "bg-blue-500 shadow-sm shadow-blue-500/40"
                        : "bg-muted"
                    }`}
                    title={d.workout ? "Workout logged" : "Rest day"}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Calories Logged
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Workout
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Weight Lost</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">
              {totalWeightLost > 0 ? `-${totalWeightLost}` : totalWeightLost} kg
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Current Streak</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{streak ?? 0} Days</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Avg Calories</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">
              {avgCalories.toLocaleString()} kcal
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Workouts This Month</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{workoutsThisMonth}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
