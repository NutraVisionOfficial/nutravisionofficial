import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Activity, Moon, Sun, LogOut, Settings, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { CalorieDashboard } from "@/components/CalorieDashboard";
import { MilestoneTracker } from "@/components/MilestoneTracker";
import { WeeklyChart } from "@/components/WeeklyChart";
import { MacroChart } from "@/components/MacroChart";
import { DailyLogForm } from "@/components/DailyLogForm";
import { LockedCard } from "@/components/LockedCard";
import { MealPlannerCard } from "@/components/MealPlannerCard";
import { FoodScanner } from "@/components/FoodScanner";
import { WeeklyHabitTracker } from "@/components/WeeklyHabitTracker";
import { WeightLogWidget } from "@/components/WeightLogWidget";
import { PhysiqueScanner } from "@/components/PhysiqueScanner";
import { BeforeAfterComparison } from "@/components/BeforeAfterComparison";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useTodayLog, useStreak, useDailyLogs } from "@/hooks/useDailyLogs";

const Index = () => {
  const [logOpen, setLogOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const isPro = (profile as any)?.subscription_status === "pro";
  const navigate = useNavigate();
  const { data: todayLog } = useTodayLog();
  const { data: streak } = useStreak();
  const { data: recentLogs } = useDailyLogs(30);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const today = {
    totalCalories: todayLog?.total_calories ?? 0,
    protein: todayLog?.protein ?? 0,
    carbs: todayLog?.carbs ?? 0,
    fats: todayLog?.fats ?? 0,
    workoutType: todayLog?.workout_type ?? "Rest",
    workoutDurationMins: todayLog?.workout_duration_mins ?? 0,
  };

  const weekLogs = (recentLogs || []).slice(-7);
  const weekAvg = weekLogs.length > 0
    ? {
        calories: Math.round(weekLogs.reduce((s, l) => s + l.total_calories, 0) / weekLogs.length),
        protein: Math.round(weekLogs.reduce((s, l) => s + l.protein, 0) / weekLogs.length),
        weight: Math.round((weekLogs.reduce((s, l) => s + Number(l.current_weight || 0), 0) / weekLogs.length) * 10) / 10,
      }
    : { calories: 0, protein: 0, weight: 0 };

  const progress = profile
    ? Math.round(((Number(profile.starting_weight) - Number(profile.current_weight)) / (Number(profile.starting_weight) - Number(profile.goal_weight))) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">NutraVision</h1>
              <p className="text-xs text-muted-foreground">Your long-term AI nutrition companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              size="sm"
              className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-sm shadow-gold/20"
              onClick={() => navigate("/upgrade")}
            >
              <Sparkles className="w-4 h-4 mr-1" /> Upgrade to Pro
            </Button>
            {isPro && (
              <Button onClick={() => setLogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Log Today
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  {(profile?.name?.[0] ?? "U").toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{profile?.name || "User"}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {isPro ? (
          <>
            <div>
              <h2 className="text-2xl font-bold font-display text-foreground">
                Hey {profile?.name || "there"} 👋
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {progress > 0 ? `You're ${Math.min(100, progress)}% closer to your goal. Keep going!` : "Start logging to track your progress!"}
              </p>
            </div>

            <WeeklyHabitTracker logs={recentLogs || []} />

            <CalorieDashboard todayLog={todayLog} target={profile?.daily_calorie_target ?? 2000} />

            <PhysiqueScanner />

            <BeforeAfterComparison />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Today's Calories" value={today.totalCalories} subtitle={`Target: ${profile?.daily_calorie_target ?? 2000}`} icon="flame" />
              <StatCard label="Current Weight" value={`${profile?.current_weight ?? 0}kg`} subtitle={`Goal: ${profile?.goal_weight ?? 0}kg`} icon="weight" />
              <StatCard label="Today's Workout" value={today.workoutType} subtitle={today.workoutDurationMins > 0 ? `${today.workoutDurationMins} min` : "Rest day"} icon="workout" />
              <StatCard label="Active Streak" value={`${streak ?? 0} days`} subtitle="Keep it up!" icon="streak" variant="accent" />
            </div>

            <WeightLogWidget />

            <MealPlannerCard isPro={isPro} />

            <div className="grid lg:grid-cols-2 gap-6">
              <MilestoneTracker profile={profile} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <WeeklyChart logs={recentLogs || []} />
              <MacroChart logs={(recentLogs || []).slice(-7)} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <LockedCard
                title="Macro Cycling Scheduler"
                description="AI-optimized carb & fat cycling for accelerated results"
                onUnlock={() => navigate("/upgrade")}
              >
                <div className="space-y-3">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{d}</span>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary">High Carb</span>
                        <span className="px-2 py-1 text-xs rounded bg-accent/20 text-accent">Low Fat</span>
                      </div>
                    </div>
                  ))}
                </div>
              </LockedCard>
              <LockedCard
                title="Recovery & Sleep Insights"
                description="Track sleep quality, HRV, and recovery readiness"
                onUnlock={() => navigate("/upgrade")}
              >
                <div className="space-y-3">
                  <div className="h-32 bg-muted/40 rounded-lg" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-16 bg-muted/40 rounded-lg" />
                    <div className="h-16 bg-muted/40 rounded-lg" />
                    <div className="h-16 bg-muted/40 rounded-lg" />
                  </div>
                </div>
              </LockedCard>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold font-display text-card-foreground mb-3">Weekly Averages</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold font-display text-primary">{weekAvg.calories}</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Calories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-accent">{weekAvg.protein}g</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Protein</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">{weekAvg.weight}kg</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Weight</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <FoodScanner onOpenPaywall={() => navigate("/upgrade")} />
            <div className="mt-6">
              <MealPlannerCard isPro={isPro} />
            </div>
          </>
        )}
      </main>

      <DailyLogForm open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
};

export default Index;
