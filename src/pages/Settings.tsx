import { Seo } from "@/components/Seo";
import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, Calculator, User } from "lucide-react";
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

  const [name, setName] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [timeframe, setTimeframe] = useState("12");
  const [dietType, setDietType] = useState("standard");
  const [region, setRegion] = useState("India");
  const [budgetMode, setBudgetMode] = useState(false);
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCurrentWeight(String(profile.current_weight));
      setGoalWeight(String(profile.goal_weight));
      setTimeframe(String(profile.goal_timeframe_months));
      setDietType(profile.diet_type || "standard");
      setRegion((profile as any).region || "India");
      setCalorieTarget(profile.daily_calorie_target);
    }
  }, [profile]);

  const calculateTarget = () => {
    const cw = Number(currentWeight);
    const gw = Number(goalWeight);
    const months = Number(timeframe);
    if (!cw || !gw || !months || months <= 0) {
      toast({ title: "Missing info", description: "Please fill in all weight & timeline fields.", variant: "destructive" });
      return;
    }

    // BMR estimate (Mifflin-St Jeor, assuming moderate activity, avg height/age)
    const bmr = cw * 22; // simplified maintenance estimate
    const totalKgToLose = cw - gw;
    const dailyDeficit = totalKgToLose > 0
      ? Math.min(750, Math.round((totalKgToLose * 7700) / (months * 30)))
      : 0;
    const target = Math.max(1200, Math.round(bmr - dailyDeficit));
    setCalorieTarget(target);
    return target;
  };

  const handleCalculateAndSave = async () => {
    const target = calculateTarget();
    if (!target) return;

    try {
      await updateProfile.mutateAsync({
        name,
        current_weight: Number(currentWeight),
        goal_weight: Number(goalWeight),
        goal_timeframe_months: Number(timeframe),
        daily_calorie_target: target,
        diet_type: dietType,
        region,
      });
      toast({ title: "Target calculated! 🎯", description: `Your daily target is ${target} kcal. Dashboard updated.` });
    } catch {
      toast({ title: "Error", description: "Failed to save. Try again.", variant: "destructive" });
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
      <Seo title="Settings – NutraVision" description="Manage your NutraVision profile, diet preferences, and calorie targets." path="/settings" />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-2xl mx-auto flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold font-display text-foreground">Profile & Goals</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">
        {/* Avatar & Greeting */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center">
            <User className="w-9 h-9 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold font-display text-foreground">
              Welcome, {name || "NutraVision User"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Set your goals and let us handle the math</p>
          </div>
        </div>

        {/* Subscription Banner */}
        <div className="rounded-xl border border-gold/30 bg-gold/5 px-5 py-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Plan: <span className="font-semibold text-foreground capitalize">{profile?.subscription_status || "Free"}</span>
          </p>
          <button
            type="button"
            onClick={() => navigate("/upgrade")}
            className="text-sm font-semibold text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade
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

        {/* Transformation Setup */}
        <div className="rounded-xl border border-primary/20 bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold font-display text-card-foreground">Transformation Setup</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentWeight">Current Weight (kg)</Label>
              <Input id="currentWeight" type="number" step="0.1" min="30" max="300" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="goalWeight">Goal Weight (kg)</Label>
              <Input id="goalWeight" type="number" step="0.1" min="30" max="300" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Timeline</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">1 Year</SelectItem>
                <SelectItem value="18">1.5 Years</SelectItem>
                <SelectItem value="24">2 Years</SelectItem>
                <SelectItem value="36">3 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {calorieTarget && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Daily Target</p>
              <p className="text-3xl font-bold font-display text-primary mt-1">{calorieTarget} kcal</p>
            </div>
          )}
        </div>

        {/* App Preferences */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="text-base font-semibold font-display text-card-foreground">App Preferences</h2>

          <div>
            <Label>Diet Type</Label>
            <Select value={dietType} onValueChange={setDietType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Non-Veg</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="eggetarian">Eggetarian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Region (for Regional Favorites)</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="India">🇮🇳 India</SelectItem>
                <SelectItem value="USA">🇺🇸 USA</SelectItem>
                <SelectItem value="Italy">🇮🇹 Italy</SelectItem>
                <SelectItem value="Japan">🇯🇵 Japan</SelectItem>
                <SelectItem value="Mexico">🇲🇽 Mexico</SelectItem>
                <SelectItem value="China">🇨🇳 China</SelectItem>
                <SelectItem value="UK">🇬🇧 UK</SelectItem>
                <SelectItem value="France">🇫🇷 France</SelectItem>
                <SelectItem value="Spain">🇪🇸 Spain</SelectItem>
                <SelectItem value="Brazil">🇧🇷 Brazil</SelectItem>
                <SelectItem value="Middle East">🌍 Middle East</SelectItem>
                <SelectItem value="Southeast Asia">🌏 Southeast Asia</SelectItem>
                <SelectItem value="Mediterranean">🫒 Mediterranean</SelectItem>
                <SelectItem value="Global">🌐 Global</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Tailors search to dishes you love.</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Budget-Friendly Mode</Label>
              <p className="text-xs text-muted-foreground">Optimizes suggestions for low-cost local staples</p>
            </div>
            <Switch checked={budgetMode} onCheckedChange={setBudgetMode} />
          </div>
        </div>

        {/* Calculate CTA */}
        <Button
          onClick={handleCalculateAndSave}
          disabled={updateProfile.isPending}
          className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_28px_hsl(var(--primary)/0.5)] transition-shadow"
        >
          <Calculator className="w-5 h-5 mr-2" />
          {updateProfile.isPending ? "Saving..." : "Calculate My Target"}
        </Button>
      </main>
    </div>
  );
}
