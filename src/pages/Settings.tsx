import { useState, useEffect } from "react";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Personal Info
  const [name, setName] = useState("");
  // Body & Goals
  const [goalWeight, setGoalWeight] = useState("");
  const [calorieTarget, setCalorieTarget] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  // Biometrics & Activity
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState("sedentary");
  // Diet & Macros
  const [dietPref, setDietPref] = useState("standard");
  const [proteinPct, setProteinPct] = useState("40");
  const [carbsPct, setCarbsPct] = useState("30");
  const [fatsPct, setFatsPct] = useState("30");
  // App Preferences
  const [theme, setTheme] = useState("system");
  const [weighInReminder, setWeighInReminder] = useState(true);
  const [mealReminder, setMealReminder] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setGoalWeight(String(profile.goal_weight));
      setCalorieTarget(String(profile.daily_calorie_target));
      setTimeframe(String(profile.goal_timeframe_months));
      setCurrentWeight(String(profile.current_weight));
    }
  }, [profile]);

  const macroTotal = Number(proteinPct) + Number(carbsPct) + Number(fatsPct);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        name,
        goal_weight: Number(goalWeight),
        daily_calorie_target: Number(calorieTarget),
        goal_timeframe_months: Number(timeframe),
        current_weight: Number(currentWeight),
      });
      toast({ title: "Profile updated", description: "Your settings have been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-2xl mx-auto flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold font-display text-foreground">Profile Settings</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8 pb-28">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Subscription Status Banner */}
          <div className="rounded-xl border border-gold/30 bg-gold/5 px-5 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Current Plan: <span className="font-semibold text-foreground">Free Tier</span>
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-semibold text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade to Pro
            </button>
          </div>

          {/* Personal Info */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold font-display text-card-foreground">Personal Info</h2>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1" />
            </div>
          </div>

          {/* Body & Goals */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold font-display text-card-foreground">Body & Goals</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentWeight">Current Weight (kg)</Label>
                <Input id="currentWeight" type="number" step="0.1" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="goalWeight">Goal Weight (kg)</Label>
                <Input id="goalWeight" type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calorieTarget">Daily Calorie Target</Label>
                <Input id="calorieTarget" type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="timeframe">Goal Timeframe (months)</Label>
                <Input id="timeframe" type="number" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Biometrics & Activity */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold font-display text-card-foreground">Biometrics & Activity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="age">Age (years)</Label>
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="28" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Base Activity Level</Label>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active</SelectItem>
                  <SelectItem value="moderately_active">Moderately Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Diet & Macros */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold font-display text-card-foreground">Diet & Macros</h2>
            <div>
              <Label>Dietary Preference</Label>
              <Select value={dietPref} onValueChange={setDietPref}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                  <SelectItem value="paleo">Paleo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Custom Macro Split</Label>
              <div className="grid grid-cols-3 gap-3 mt-1">
                <div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={proteinPct}
                    onChange={(e) => setProteinPct(e.target.value)}
                    placeholder="Protein %"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">Protein %</p>
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={carbsPct}
                    onChange={(e) => setCarbsPct(e.target.value)}
                    placeholder="Carbs %"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">Carbs %</p>
                </div>
                <div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={fatsPct}
                    onChange={(e) => setFatsPct(e.target.value)}
                    placeholder="Fats %"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">Fats %</p>
                </div>
              </div>
              <p className={`text-xs mt-2 ${macroTotal === 100 ? "text-primary" : "text-destructive"}`}>
                {macroTotal === 100 ? "✓ Total equals 100%" : `Must equal 100% (currently ${macroTotal}%)`}
              </p>
            </div>
          </div>

          {/* App Preferences */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            <h2 className="text-base font-semibold font-display text-card-foreground">App Preferences</h2>
            <div>
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Daily Weigh-in Reminder</Label>
                <p className="text-xs text-muted-foreground">Get reminded to log your weight each morning</p>
              </div>
              <Switch checked={weighInReminder} onCheckedChange={setWeighInReminder} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Meal Logging Reminders</Label>
                <p className="text-xs text-muted-foreground">Reminders to log meals throughout the day</p>
              </div>
              <Switch checked={mealReminder} onCheckedChange={setMealReminder} />
            </div>
          </div>

          {/* Sticky Save Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 z-50">
            <div className="container max-w-2xl mx-auto">
              <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
