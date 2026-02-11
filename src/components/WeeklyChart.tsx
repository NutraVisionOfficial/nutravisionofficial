import { getRecentLogs } from "@/data/mockData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function WeeklyChart() {
  const data = getRecentLogs(30).map((l) => ({
    date: l.date.slice(5),
    calories: l.totalCalories,
    weight: l.currentWeight,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold font-display text-card-foreground mb-1">30-Day Trends</h3>
      <p className="text-sm text-muted-foreground mb-5">Calorie intake & weight over time</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 62%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 62%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 12%, 90%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(200, 10%, 45%)" />
            <YAxis yAxisId="cal" tick={{ fontSize: 11 }} stroke="hsl(200, 10%, 45%)" />
            <YAxis yAxisId="wt" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(200, 10%, 45%)" domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(180, 12%, 90%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area yAxisId="cal" type="monotone" dataKey="calories" stroke="hsl(174, 62%, 40%)" fill="url(#calGrad)" strokeWidth={2} />
            <Area yAxisId="wt" type="monotone" dataKey="weight" stroke="hsl(24, 90%, 55%)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary rounded" />
          Calories
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-accent rounded" style={{ borderStyle: "dashed" }} />
          Weight (kg)
        </div>
      </div>
    </div>
  );
}
