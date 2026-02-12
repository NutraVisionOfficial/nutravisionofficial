import { UtensilsCrossed, Pencil, MoreHorizontal } from "lucide-react";
import type { FoodProduct } from "@/lib/openFoodFacts";

const NUTRI_COLORS: Record<string, string> = {
  A: "bg-[hsl(152,60%,42%)]",
  B: "bg-[hsl(80,55%,50%)]",
  C: "bg-[hsl(43,96%,56%)]",
  D: "bg-[hsl(24,90%,55%)]",
  E: "bg-[hsl(0,72%,55%)]",
  unknown: "bg-muted",
};

interface MacroBarProps {
  value: number;
  max: number;
  color: string;
}

function MacroBar({ value, max, color }: MacroBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-[3px] rounded-full bg-muted mt-1.5">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

interface FoodResultCardProps {
  product: FoodProduct;
  timestamp?: string;
  onEdit?: () => void;
  onMore?: () => void;
  /** Show inside the camera overlay (dark bg context) */
  overlay?: boolean;
}

export function FoodResultCard({ product, timestamp, onEdit, onMore, overlay }: FoodResultCardProps) {
  const totalMacroGrams = product.protein + product.carbs + product.fats || 1;

  return (
    <div
      className={`flex gap-3.5 p-3.5 rounded-2xl border transition-colors ${
        overlay
          ? "bg-card border-border shadow-2xl"
          : "bg-card border-border shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
      }`}
    >
      {/* Thumbnail */}
      <div className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <UtensilsCrossed className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Name + Nutri-Score */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-card-foreground truncate leading-tight">
            {product.name}
          </p>
          {product.nutriScore !== "unknown" && (
            <div className={`w-6 h-6 rounded flex-shrink-0 ${NUTRI_COLORS[product.nutriScore]} flex items-center justify-center`}>
              <span className="text-white text-[10px] font-extrabold">{product.nutriScore}</span>
            </div>
          )}
        </div>

        {/* Macro grid */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <MacroColumn label="Calories" value={product.calories} unit="" barColor="bg-primary" barPct={product.calories} barMax={2500} />
          <MacroColumn label="Carbs" value={product.carbs} unit="g" barColor="bg-[hsl(200,70%,50%)]" barPct={product.carbs} barMax={totalMacroGrams} />
          <MacroColumn label="Protein" value={product.protein} unit="g" barColor="bg-destructive" barPct={product.protein} barMax={totalMacroGrams} />
          <MacroColumn label="Fat" value={product.fats} unit="g" barColor="bg-gold" barPct={product.fats} barMax={totalMacroGrams} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">
            {timestamp ?? new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
          </span>
          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-muted transition-colors">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
            {onMore && (
              <button onClick={onMore} className="p-1 rounded-md hover:bg-muted transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroColumn({
  label,
  value,
  unit,
  barColor,
  barPct,
  barMax,
}: {
  label: string;
  value: number;
  unit: string;
  barColor: string;
  barPct: number;
  barMax: number;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-bold font-display text-card-foreground leading-none">
        {value}
        {unit && <span className="text-[10px] font-medium text-muted-foreground">{unit}</span>}
      </p>
      <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</p>
      <MacroBar value={barPct} max={barMax} color={barColor} />
    </div>
  );
}
