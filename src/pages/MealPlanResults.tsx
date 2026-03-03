import { useState, useMemo } from "react";
import { ArrowLeft, RefreshCw, CalendarCheck, Shuffle, Clock, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentMealPlan, useGenerateMealPlan, type WeekPlan, type Meal } from "@/hooks/useMealPlan";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  snack_1: "Morning Snack",
  snack_2: "Evening Snack",
};

const SLOT_ORDER = ["breakfast", "snack_1", "lunch", "snack_2", "snack", "dinner"];

export default function MealPlanResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: savedPlan } = useCurrentMealPlan();
  const { data: profile } = useProfile();
  const { generate, generating } = useGenerateMealPlan();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loggingToday, setLoggingToday] = useState(false);

  // Plan can come from navigation state (freshly generated) or from DB
  const plan: WeekPlan | null = (location.state as any)?.plan ?? savedPlan ?? null;

  const todayIdx = Math.min(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, 6);
  const [activeDay, setActiveDay] = useState(todayIdx);

  const dayPlan = useMemo(() => {
    if (!plan?.days) return null;
    return plan.days.find((d) => d.day === DAYS[activeDay]) ?? plan.days[activeDay] ?? null;
  }, [plan, activeDay]);

  const sortedMeals = useMemo(() => {
    if (!dayPlan?.meals) return [];
    return [...dayPlan.meals].sort(
      (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)
    );
  }, [dayPlan]);

  const dayTotals = useMemo(() => {
    if (!sortedMeals.length) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    return sortedMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fats: acc.fats + m.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [sortedMeals]);

  const handleLogToday = async () => {
    if (!dayPlan?.meals || !user) return;
    setLoggingToday(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const entries = dayPlan.meals.map((m) => ({
        user_id: user.id,
        date: today,
        meal_type: m.slot.startsWith("snack") ? "snack" : m.slot,
        food_name: m.name,
        emoji: m.emoji,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fats: m.fats,
        portion: m.portion,
        quantity: 1,
      }));

      const { error } = await supabase.from("food_logs").insert(entries);
      if (error) throw error;

      // Update daily_logs aggregate
      const totals = entries.reduce(
        (a, e) => ({
          calories: a.calories + e.calories,
          protein: a.protein + e.protein,
          carbs: a.carbs + e.carbs,
          fats: a.fats + e.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      await supabase.from("daily_logs").upsert(
        {
          user_id: user.id,
          date: today,
          total_calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fats: totals.fats,
        },
        { onConflict: "user_id,date" }
      );

      queryClient.invalidateQueries({ queryKey: ["food_logs"] });
      queryClient.invalidateQueries({ queryKey: ["daily_logs"] });

      toast({ title: "Plan logged! 📋", description: `${entries.length} meals added to today's diary.` });
    } catch (e: any) {
      toast({ title: "Error logging meals", description: e.message, variant: "destructive" });
    } finally {
      setLoggingToday(false);
    }
  };

  const handleRegenerate = async () => {
    if (!profile) return;
    const result = await generate({
      dietType: profile.diet_type || "standard",
      allergies: profile.allergies || [],
      cookingTime: profile.cooking_time || "moderate",
      mealsPerDay: profile.meals_per_day || "3_meals_2_snacks",
      calorieTarget: profile.daily_calorie_target || 2000,
    });
    if (result) {
      // Replace navigation state with new plan
      window.history.replaceState({ plan: result }, "");
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No meal plan found.</p>
        <Button onClick={() => navigate("/meal-planner")}>Create a Plan</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Regeneration overlay */}
      {generating && <GeneratingOverlay />}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate("/meal-planner")}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold font-display text-foreground">Your Weekly Meal Plan</h1>
        </div>
      </header>

      {/* Day Tabs */}
      <div className="sticky top-[65px] z-30 bg-background border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setActiveDay(i)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  activeDay === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day Summary */}
      <div className="container max-w-4xl mx-auto px-4 pt-5">
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {DAYS[activeDay]} Total
            </p>
            <p className="text-2xl font-bold font-display text-primary">{dayTotals.calories} kcal</p>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="text-center">
              <p className="font-semibold text-foreground">{dayTotals.protein}g</p>
              <p>Protein</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{dayTotals.carbs}g</p>
              <p>Carbs</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{dayTotals.fats}g</p>
              <p>Fats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Cards */}
      <main className="container max-w-4xl mx-auto px-4 py-5 space-y-4">
        {sortedMeals.map((meal, idx) => (
          <MealCard key={`${meal.slot}-${idx}`} meal={meal} />
        ))}
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-40">
        <div className="container max-w-4xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 border-primary text-primary hover:bg-primary/5"
            onClick={handleRegenerate}
            disabled={generating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
            Regenerate Week
          </Button>
          <Button
            className="flex-1 h-12 bg-primary text-primary-foreground font-semibold shadow-md"
            onClick={handleLogToday}
            disabled={loggingToday}
          >
            {loggingToday ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CalendarCheck className="w-4 h-4 mr-2" />
            )}
            {loggingToday ? "Logging..." : "Log Today's Plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm animate-fade-in flex items-center gap-4">
      <div className="text-3xl">{meal.emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {SLOT_LABELS[meal.slot] || meal.slot}
        </p>
        <h4 className="font-semibold text-foreground text-sm mt-0.5 truncate">{meal.name}</h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {meal.cook_time_mins} mins
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3" /> {meal.calories} kcal
          </span>
          <span>{meal.portion}</span>
        </div>
      </div>
      <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors shrink-0">
        <Shuffle className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function GeneratingOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center animate-pulse">
          <span className="text-4xl">👨‍🍳</span>
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-bounce">
          <span className="text-xs">✨</span>
        </div>
      </div>
      <div className="text-center space-y-2 max-w-xs">
        <p className="font-semibold text-foreground font-display">
          AI is crafting your perfect menu...
        </p>
        <p className="text-sm text-muted-foreground italic">
          Based on your preferences, creating a balanced weekly plan
        </p>
      </div>
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}
