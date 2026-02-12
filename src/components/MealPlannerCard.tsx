import { ChefHat, Lock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MealPlannerCardProps {
  isPro: boolean;
}

export function MealPlannerCard({ isPro }: MealPlannerCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/meal-planner")}
      className="w-full rounded-xl border border-border bg-card p-6 text-left hover:shadow-md transition-shadow animate-fade-in group"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <ChefHat className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold font-display text-foreground">AI Custom Meal Planner</h3>
            {isPro ? (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                Ready to Plan
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Pro
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Get weekly grocery lists and recipes tailored to your goals, diet, and preferences.
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
}
