import { useState } from "react";
import { Droplets, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const GOAL_GLASSES = 8;
const ML_PER_GLASS = 250;

export function WaterIntakeTracker() {
  const [glasses, setGlasses] = useState(0);

  const progress = Math.min(100, (glasses / GOAL_GLASSES) * 100);
  const totalMl = glasses * ML_PER_GLASS;

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display text-card-foreground">Water Intake</h3>
            <p className="text-[11px] text-muted-foreground">{totalMl} ml / {GOAL_GLASSES * ML_PER_GLASS} ml</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setGlasses((g) => Math.max(0, g - 1))}
            disabled={glasses === 0}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <span className="text-lg font-bold font-display text-card-foreground w-8 text-center">{glasses}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setGlasses((g) => g + 1)}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Progress value={progress} className="h-2.5 bg-muted" />

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          {Array.from({ length: GOAL_GLASSES }).map((_, i) => (
            <Droplets
              key={i}
              className={`w-3.5 h-3.5 transition-colors ${i < glasses ? "text-blue-500" : "text-muted-foreground/25"}`}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {glasses >= GOAL_GLASSES ? "🎉 Goal reached!" : `${GOAL_GLASSES - glasses} more to go`}
        </p>
      </div>
    </div>
  );
}
