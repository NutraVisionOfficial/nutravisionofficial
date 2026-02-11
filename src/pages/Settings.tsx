import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [calorieTarget, setCalorieTarget] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setGoalWeight(String(profile.goal_weight));
      setCalorieTarget(String(profile.daily_calorie_target));
      setTimeframe(String(profile.goal_timeframe_months));
      setCurrentWeight(String(profile.current_weight));
    }
  }, [profile]);

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

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold font-display text-card-foreground">Personal Info</h2>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1" />
            </div>
          </div>

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

          <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </main>
    </div>
  );
}
