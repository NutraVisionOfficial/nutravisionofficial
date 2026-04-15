import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Droplets } from "lucide-react";
import { useWeeklyWater } from "@/hooks/useWaterIntake";

const GOAL = 8;

export function WaterWeeklyChart() {
  const { data: logs } = useWeeklyWater();

  const chartData = useMemo(() => {
    const days: { label: string; date: string; glasses: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const found = logs?.find((l) => l.date === iso);
      days.push({ label, date: iso, glasses: found?.glasses ?? 0 });
    }
    return days;
  }, [logs]);

  const avg = chartData.length
    ? Math.round((chartData.reduce((s, d) => s + d.glasses, 0) / chartData.length) * 10) / 10
    : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-display text-card-foreground">Weekly Water History</h3>
            <p className="text-[11px] text-muted-foreground">Avg {avg} glasses/day · Goal: {GOAL}</p>
          </div>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
            <ReferenceLine y={GOAL} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Bar dataKey="glasses" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.glasses >= GOAL ? "hsl(var(--primary))" : "hsl(210 80% 60% / 0.5)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
