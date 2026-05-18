import { useState, useEffect } from "react";
import { ArrowLeft, Settings2, Sparkles, Lock, Loader2, ChefHat, Leaf, Timer, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useGenerateMealPlan } from "@/hooks/useMealPlan";
import { toast } from "@/hooks/use-toast";

const DIET_TYPES = ["Standard", "Vegetarian", "Vegan", "Keto", "Paleo", "High Protein"] as const;
const ALLERGIES = ["Gluten-free", "Dairy-free", "No Seafood", "No Nuts"] as const;
const COOKING_TIMES = [
  { value: "quick", label: "Quick", desc: "<20 mins" },
  { value: "moderate", label: "Moderate", desc: "20-45 mins" },
  { value: "elaborate", label: "Elaborate", desc: "45+ mins" },
] as const;
const MEAL_OPTIONS = [
  { value: "3_meals", label: "3 Meals" },
  { value: "3_meals_2_snacks", label: "3 Meals + 2 Snacks" },
] as const;

export default function MealPlanner() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const isPro = (profile as any)?.subscription_status === "pro";
  const hasExistingPlan = false; // TODO: check meal_plans table
  const [showForm, setShowForm] = useState(true);

  const [dietType, setDietType] = useState("Standard");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [cookingTime, setCookingTime] = useState("moderate");
  const [mealsPerDay, setMealsPerDay] = useState("3_meals_2_snacks");
  const [saving, setSaving] = useState(false);
  const { generate, generating } = useGenerateMealPlan();

  // Load existing preferences
  useEffect(() => {
    if (!profile) return;
    const p = profile as any;
    if (p.diet_type && p.diet_type !== "standard") {
      setDietType(p.diet_type);
      setAllergies(p.allergies || []);
      setCookingTime(p.cooking_time || "moderate");
      setMealsPerDay(p.meals_per_day || "3_meals");
    }
  }, [profile]);

  const toggleAllergy = (a: string) => {
    setAllergies((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handleGenerate = async () => {
    if (!isPro) {
      navigate("/upgrade");
      return;
    }
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        diet_type: dietType.toLowerCase().replace(" ", "_"),
        allergies,
        cooking_time: cookingTime,
        meals_per_day: mealsPerDay,
      });

      const plan = await generate({
        dietType: dietType.toLowerCase().replace(" ", "_"),
        allergies,
        cookingTime,
        mealsPerDay,
        calorieTarget: (profile as any)?.daily_calorie_target || 2000,
      });

      if (plan) {
        navigate("/meal-plan-results", { state: { plan } });
      }
    } catch {
      toast({ title: "Error saving preferences", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isWorking = saving || generating;

  return (
    <div className="min-h-screen bg-background">
      <Seo title="AI Meal Planner – NutraVision" description="Generate personalized AI meal plans tailored to your calories, macros, and diet preferences." path="/meal-planner" />
      {/* Generation Loading Overlay */}
      {generating && (
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
      )}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold font-display text-foreground">AI Meal Planner</h1>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Customize Your Menu
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto italic">
            Tell us your preferences and we'll create a personalized weekly meal plan.
          </p>
        </div>

        {/* Form sections */}
        <div className="space-y-6">
          {/* Diet Type */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Diet Type</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DIET_TYPES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDietType(d)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    dietType === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Allergies & Exclusions</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALLERGIES.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAllergy(a)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    allergies.includes(a)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking Time */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Cooking Time</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {COOKING_TIMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setCookingTime(t.value)}
                  className={`px-4 py-3 rounded-lg text-center transition-colors border ${
                    cookingTime === t.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <span className="text-sm font-medium block">{t.label}</span>
                  <span className={`text-[11px] ${cookingTime === t.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Meals Per Day */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Meals Per Day</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMealsPerDay(m.value)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors border ${
                    mealsPerDay === m.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Floating CTA */}
        <div className="sticky bottom-6 pt-4">
          <Button
            size="lg"
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg"
            onClick={handleGenerate}
            disabled={isWorking}
          >
            {isWorking ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : isPro ? (
              <Sparkles className="w-5 h-5 mr-2" />
            ) : (
              <Lock className="w-5 h-5 mr-2" />
            )}
            {isWorking ? "Generating..." : isPro ? "✨ Create My Custom Plan" : "Unlock with Pro"}
          </Button>
        </div>
      </main>
    </div>
  );
}
