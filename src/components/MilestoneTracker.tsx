interface MilestoneTrackerProps {
  profile: {
    starting_weight: number;
    current_weight: number;
    goal_weight: number;
    goal_timeframe_months: number;
    start_date: string;
  } | null | undefined;
}

export function MilestoneTracker({ profile }: MilestoneTrackerProps) {
  if (!profile) return null;

  const startingWeight = Number(profile.starting_weight);
  const currentWeight = Number(profile.current_weight);
  const goalWeight = Number(profile.goal_weight);
  const goalTimeframeMonths = profile.goal_timeframe_months;

  const totalLoss = startingWeight - goalWeight;
  const currentLoss = startingWeight - currentWeight;
  const progress = totalLoss > 0 ? Math.min(100, Math.round((currentLoss / totalLoss) * 100)) : 0;

  const start = new Date(profile.start_date);
  const now = new Date();
  const monthsElapsed = Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const monthsRemaining = Math.max(0, goalTimeframeMonths - monthsElapsed);

  const milestones = [
    { label: "Start", weight: startingWeight, reached: true },
    { label: "25%", weight: startingWeight - totalLoss * 0.25, reached: currentLoss >= totalLoss * 0.25 },
    { label: "50%", weight: startingWeight - totalLoss * 0.5, reached: currentLoss >= totalLoss * 0.5 },
    { label: "75%", weight: startingWeight - totalLoss * 0.75, reached: currentLoss >= totalLoss * 0.75 },
    { label: "Goal", weight: goalWeight, reached: currentWeight <= goalWeight },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold font-display text-card-foreground mb-1">Long-Term Progress</h3>
      <p className="text-sm text-muted-foreground mb-5">{monthsElapsed} months in · {monthsRemaining} months to go</p>
      <div className="relative mb-6">
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          {milestones.map((m) => (
            <div key={m.label} className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${m.reached ? "bg-primary" : "bg-border"}`} />
              <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              <span className="block text-xs text-muted-foreground">{m.weight}kg</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-primary font-semibold">{progress}%</span>
        <span className="text-muted-foreground">of your goal achieved</span>
        <span className="ml-auto text-card-foreground font-semibold">{currentWeight}kg → {goalWeight}kg</span>
      </div>
    </div>
  );
}
