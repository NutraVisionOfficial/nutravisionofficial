import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CartesianGrid } from "recharts";

interface MacroChartProps {
  logs: Array<{ date: string; protein: number; carbs: number; fats: number }>;
}

export function MacroChart({ logs }: MacroChartProps) {
  const data = logs.map((l) => ({
    date: new Date(l.date).toLocaleDateString("en", { weekday: "short" }),
    protein: l.protein,
    carbs: l.carbs,
    fats: l.fats,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold font-display text-card-foreground mb-1">Weekly Macros</h3>
      <p className="text-sm text-muted-foreground mb-5">Protein, carbs & fats breakdown</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 12%, 90%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(200, 10%, 45%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(200, 10%, 45%)" />
            <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(180, 12%, 90%)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="protein" fill="hsl(174, 62%, 40%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="carbs" fill="hsl(24, 90%, 55%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fats" fill="hsl(200, 70%, 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-5 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /> Protein</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-accent" /> Carbs</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: "hsl(200, 70%, 50%)" }} /> Fats</div>
      </div>
    </div>
  );
}
