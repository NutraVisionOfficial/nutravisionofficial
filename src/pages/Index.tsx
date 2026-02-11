import { useState, useEffect } from "react";
import { Plus, Activity, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { CalorieSummary } from "@/components/CalorieSummary";
import { MilestoneTracker } from "@/components/MilestoneTracker";
import { WeeklyChart } from "@/components/WeeklyChart";
import { MacroChart } from "@/components/MacroChart";
import { DailyLogForm } from "@/components/DailyLogForm";
import { mockUser, getTodayLog, getStreak, getWeeklyAvg } from "@/data/mockData";

const Index = () => {
  const [logOpen, setLogOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const today = getTodayLog();
  const streak = getStreak();
  const weekAvg = getWeeklyAvg();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">Stride</h1>
              <p className="text-xs text-muted-foreground">Your long-term fitness companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button onClick={() => setLogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Log Today
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground">
            Hey {mockUser.name} 👋
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            You're {Math.round(((mockUser.startingWeight - mockUser.currentWeight) / (mockUser.startingWeight - mockUser.goalWeight)) * 100)}% closer to your goal. Keep going!
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Calories" value={today.totalCalories} subtitle={`Target: ${mockUser.dailyCalorieTarget}`} icon="flame" />
          <StatCard label="Current Weight" value={`${mockUser.currentWeight}kg`} subtitle={`Goal: ${mockUser.goalWeight}kg`} icon="weight" />
          <StatCard label="Today's Workout" value={today.workoutType} subtitle={today.workoutDurationMins > 0 ? `${today.workoutDurationMins} min` : "Rest day"} icon="workout" />
          <StatCard label="Active Streak" value={`${streak} days`} subtitle="Keep it up!" icon="streak" variant="accent" />
        </div>

        {/* Calorie ring + Milestone */}
        <div className="grid lg:grid-cols-2 gap-6">
          <CalorieSummary />
          <MilestoneTracker />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <WeeklyChart />
          <MacroChart />
        </div>

        {/* Weekly summary */}
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
      </main>

      <DailyLogForm open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  );
};

export default Index;
