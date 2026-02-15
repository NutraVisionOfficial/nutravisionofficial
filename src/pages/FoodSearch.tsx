import { useState, useMemo, useCallback } from "react";
import { Search as SearchIcon, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useTodayLog, useUpsertLog } from "@/hooks/useDailyLogs";
import { toast } from "@/hooks/use-toast";

interface FoodItem {
  name: string;
  emoji: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const QUICK_LOG: FoodItem[] = [
  { name: "Roti", emoji: "🫓", portion: "1 medium", calories: 100, protein: 3, carbs: 18, fats: 1 },
  { name: "White Rice", emoji: "🍚", portion: "1 plate", calories: 130, protein: 3, carbs: 28, fats: 0.3 },
  { name: "Dal Fry", emoji: "🍲", portion: "1 cup", calories: 150, protein: 9, carbs: 20, fats: 4 },
  { name: "Chicken Curry", emoji: "🍗", portion: "1 serving", calories: 250, protein: 20, carbs: 8, fats: 15 },
  { name: "Masala Chai", emoji: "☕", portion: "1 cup", calories: 80, protein: 2, carbs: 12, fats: 3 },
  { name: "Boiled Egg", emoji: "🥚", portion: "1 large", calories: 78, protein: 6, carbs: 1, fats: 5 },
];

const CRAVINGS: FoodItem[] = [
  { name: "Chicken Shawarma", emoji: "🌯", portion: "1 roll", calories: 350, protein: 22, carbs: 30, fats: 16 },
  { name: "Vada Pav", emoji: "🍔", portion: "1 piece", calories: 280, protein: 5, carbs: 38, fats: 12 },
  { name: "Pav Bhaji", emoji: "🍛", portion: "1 plate", calories: 400, protein: 10, carbs: 50, fats: 18 },
  { name: "Paneer Tikka", emoji: "🧀", portion: "6 pieces", calories: 260, protein: 18, carbs: 6, fats: 18 },
];

const ALL_FOODS: FoodItem[] = [
  ...QUICK_LOG,
  ...CRAVINGS,
  { name: "Idli", emoji: "🥟", portion: "2 pieces", calories: 130, protein: 4, carbs: 26, fats: 1 },
  { name: "Dosa", emoji: "🥞", portion: "1 piece", calories: 170, protein: 4, carbs: 28, fats: 5 },
  { name: "Samosa", emoji: "📐", portion: "1 piece", calories: 260, protein: 4, carbs: 30, fats: 14 },
  { name: "Curd / Yogurt", emoji: "🥛", portion: "1 cup", calories: 100, protein: 5, carbs: 8, fats: 5 },
  { name: "Aloo Paratha", emoji: "🫓", portion: "1 piece", calories: 300, protein: 6, carbs: 40, fats: 13 },
  { name: "Rajma", emoji: "🫘", portion: "1 cup", calories: 210, protein: 14, carbs: 36, fats: 1 },
  { name: "Poha", emoji: "🍚", portion: "1 plate", calories: 180, protein: 3, carbs: 32, fats: 5 },
  { name: "Oats", emoji: "🥣", portion: "1 cup cooked", calories: 150, protein: 5, carbs: 27, fats: 3 },
  { name: "Banana", emoji: "🍌", portion: "1 medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
  { name: "Apple", emoji: "🍎", portion: "1 medium", calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
  { name: "Paneer", emoji: "🧀", portion: "100g", calories: 265, protein: 18, carbs: 4, fats: 20 },
  { name: "Chicken Breast", emoji: "🍗", portion: "100g", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { name: "Almonds", emoji: "🥜", portion: "10 pieces", calories: 70, protein: 2.5, carbs: 2.5, fats: 6 },
];

export default function FoodSearch() {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: todayLog } = useTodayLog();
  const upsertLog = useUpsertLog();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_FOODS.filter(
      (f) => f.name.toLowerCase().includes(q) || f.portion.toLowerCase().includes(q)
    );
  }, [query]);

  const openDrawer = useCallback((food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
    setDrawerOpen(true);
  }, []);

  const handleAddToDiary = useCallback(async () => {
    if (!selectedFood) return;

    const addCal = Math.round(selectedFood.calories * quantity);
    const addProtein = Math.round(selectedFood.protein * quantity);
    const addCarbs = Math.round(selectedFood.carbs * quantity);
    const addFats = Math.round(selectedFood.fats * quantity);

    try {
      await upsertLog.mutateAsync({
        total_calories: (todayLog?.total_calories ?? 0) + addCal,
        protein: (todayLog?.protein ?? 0) + addProtein,
        carbs: (todayLog?.carbs ?? 0) + addCarbs,
        fats: (todayLog?.fats ?? 0) + addFats,
        workout_type: todayLog?.workout_type ?? "Rest",
        workout_duration_mins: todayLog?.workout_duration_mins ?? 0,
      });

      toast({ title: `Added ${quantity}× ${selectedFood.emoji} ${selectedFood.name}`, description: `+${addCal} kcal logged` });
      setDrawerOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to log food", variant: "destructive" });
    }
  }, [selectedFood, quantity, todayLog, upsertLog]);

  const showResults = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/60 backdrop-blur-xl sticky top-0 z-40 border-b border-border">
        <div className="container max-w-lg mx-auto px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold font-display text-foreground mb-4">Food Search</h1>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search meals, ingredients, or scan..."
              className="pl-12 h-12 rounded-full bg-secondary border-border text-base placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-5 space-y-7">
        {/* Search Results */}
        {showResults ? (
          <section className="space-y-2 animate-fade-in">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Results
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-10">
                No results for "{query}"
              </p>
            ) : (
              searchResults.map((food) => (
                <FoodRow key={food.name} food={food} onAdd={() => openDrawer(food)} />
              ))
            )}
          </section>
        ) : (
          <>
            {/* Quick Log */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Quick Log
              </h3>
              <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {QUICK_LOG.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => openDrawer(food)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
                  >
                    <span className="text-base">{food.emoji}</span>
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                      {food.name}
                    </span>
                    <span className="text-xs text-primary font-bold whitespace-nowrap">
                      {food.calories}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Common Indian Cravings */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Common Indian Cravings
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {CRAVINGS.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => openDrawer(food)}
                    className="flex flex-col items-start gap-1.5 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all active:scale-[0.97]"
                  >
                    <span className="text-2xl">{food.emoji}</span>
                    <span className="text-sm font-semibold text-foreground leading-tight">{food.name}</span>
                    <span className="text-xs text-primary font-bold">{food.calories} kcal</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Log Food Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          {selectedFood && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-xl font-display flex items-center gap-2">
                  <span className="text-2xl">{selectedFood.emoji}</span>
                  {selectedFood.name}
                </DrawerTitle>
                <p className="text-sm text-muted-foreground">{selectedFood.portion}</p>
              </DrawerHeader>

              <div className="px-4 space-y-5">
                {/* Quantity selector */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Quantity</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-bold font-display text-foreground w-10 text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => setQuantity(quantity + 0.5)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Nutrition preview */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Calories", value: Math.round(selectedFood.calories * quantity), unit: "kcal", color: "text-primary" },
                    { label: "Protein", value: Math.round(selectedFood.protein * quantity), unit: "g", color: "text-destructive" },
                    { label: "Carbs", value: Math.round(selectedFood.carbs * quantity), unit: "g", color: "text-chart-4" },
                    { label: "Fats", value: Math.round(selectedFood.fats * quantity), unit: "g", color: "text-accent" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl bg-secondary p-3 text-center">
                      <p className={`text-lg font-bold font-display ${m.color}`}>
                        {m.value}
                        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{m.unit}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <DrawerFooter>
                <Button
                  size="lg"
                  className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/25"
                  onClick={handleAddToDiary}
                  disabled={upsertLog.isPending}
                >
                  {upsertLog.isPending ? "Adding..." : "Add to Diary"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function FoodRow({ food, onAdd }: { food: FoodItem; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 text-left">
        <span className="text-xl">{food.emoji}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{food.name}</p>
          <p className="text-xs text-muted-foreground">{food.portion}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{food.calories} kcal</p>
          <p className="text-[10px] text-muted-foreground">{food.protein}g protein</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary" />
        </div>
      </div>
    </button>
  );
}
