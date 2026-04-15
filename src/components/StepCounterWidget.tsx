import { useState, useEffect } from "react";
import { Footprints, Plus, Minus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useTodaySteps, useUpsertSteps } from "@/hooks/useStepLogs";

const GOAL = 10000;
const INCREMENTS = [500, 1000, 2500];

export function StepCounterWidget() {
  const { data: todayRecord } = useTodaySteps();
  const upsert = useUpsertSteps();
  const [manualInput, setManualInput] = useState("");

  const steps = todayRecord?.steps ?? 0;
  const progress = Math.min(100, (steps / GOAL) * 100);
  const goalMet = steps >= GOAL;

  const addSteps = (amount: number) => {
    upsert.mutate(Math.max(0, steps + amount));
  };

  const handleManualAdd = () => {
    const val = parseInt(manualInput);
    if (val > 0) {
      upsert.mutate(steps + val);
      setManualInput("");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Footprints className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display text-card-foreground">Daily Steps</h3>
            <p className="text-[11px] text-muted-foreground">Goal: {GOAL.toLocaleString()} steps</p>
          </div>
        </div>
        {goalMet && (
          <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
            🎉 Goal met!
          </span>
        )}
      </div>

      <div className="text-center mb-4">
        <p className="text-3xl font-bold font-display text-foreground">{steps.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {Math.max(0, GOAL - steps).toLocaleString()} steps to go
        </p>
      </div>

      <Progress value={progress} className="h-2.5 mb-4" />

      <div className="flex gap-2 mb-3">
        {INCREMENTS.map((inc) => (
          <Button
            key={inc}
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => addSteps(inc)}
            disabled={upsert.isPending}
          >
            +{inc.toLocaleString()}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Custom steps..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
          className="flex-1 text-sm"
          min="1"
        />
        <Button size="sm" onClick={handleManualAdd} disabled={upsert.isPending || !manualInput}>
          Add
        </Button>
      </div>

      {steps > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs text-muted-foreground"
          onClick={() => upsert.mutate(0)}
          disabled={upsert.isPending}
        >
          Reset today
        </Button>
      )}
    </div>
  );
}
