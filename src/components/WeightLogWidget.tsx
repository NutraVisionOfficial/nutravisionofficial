import { useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpsertWeight } from "@/hooks/useWeightLogs";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

export function WeightLogWidget() {
  const [weight, setWeight] = useState("");
  const upsert = useUpsertWeight();
  const { data: profile } = useProfile();
  const { toast } = useToast();

  const handleLog = async () => {
    const w = Number(weight);
    if (!w || w < 20 || w > 400) {
      toast({ title: "Invalid weight", variant: "destructive" });
      return;
    }
    try {
      await upsert.mutateAsync(w);
      toast({ title: "Weight logged! ⚖️", description: `${w} kg saved for today.` });
      setWeight("");
    } catch {
      toast({ title: "Error saving weight", variant: "destructive" });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Scale className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold font-display text-card-foreground">Daily Weigh-In</h3>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          step="0.1"
          min="20"
          max="400"
          placeholder={`Current: ${profile?.current_weight ?? "—"} kg`}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLog()}
          className="flex-1"
        />
        <Button size="sm" onClick={handleLog} disabled={upsert.isPending}>
          {upsert.isPending ? "..." : "Log"}
        </Button>
      </div>
      {profile?.goal_weight && (
        <p className="text-xs text-muted-foreground mt-2">
          Goal: {profile.goal_weight} kg · {Math.max(0, Number(profile.current_weight) - Number(profile.goal_weight)).toFixed(1)} kg to go
        </p>
      )}
    </div>
  );
}
