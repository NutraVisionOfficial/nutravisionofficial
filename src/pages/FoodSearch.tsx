import { useState, useMemo, useCallback } from "react";
import { Search as SearchIcon, Plus, Minus, Activity } from "lucide-react";
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
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const QUICK_ADD: FoodItem[] = [
  { name: "Roti", portion: "Medium", calories: 100, protein: 3, carbs: 18, fats: 1 },
  { name: "Dal Fry", portion: "1 cup", calories: 150, protein: 9, carbs: 20, fats: 4 },
  { name: "White Rice", portion: "1 plate", calories: 200, protein: 4, carbs: 45, fats: 0.5 },
  { name: "Masala Chai", portion: "1 cup", calories: 80, protein: 2, carbs: 12, fats: 3 },
  { name: "Paneer", portion: "100g", calories: 265, protein: 18, carbs: 4, fats: 20 },
  { name: "Boiled Egg", portion: "1 large", calories: 70, protein: 6, carbs: 1, fats: 5 },
];

const FOOD_DATABASE: FoodItem[] = [
  ...QUICK_ADD,
  { name: "Chicken Breast", portion: "100g", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { name: "Banana", portion: "1 medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
  { name: "Idli", portion: "2 pieces", calories: 130, protein: 4, carbs: 26, fats: 1 },
  { name: "Dosa", portion: "1 piece", calories: 170, protein: 4, carbs: 28, fats: 5 },
  { name: "Samosa", portion: "1 piece", calories: 260, protein: 4, carbs: 30, fats: 14 },
  { name: "Curd / Yogurt", portion: "1 cup", calories: 100, protein: 5, carbs: 8, fats: 5 },
  { name: "Aloo Paratha", portion: "1 piece", calories: 300, protein: 6, carbs: 40, fats: 13 },
  { name: "Rajma", portion: "1 cup", calories: 210, protein: 14, carbs: 36, fats: 1 },
  { name: "Poha", portion: "1 plate", calories: 180, protein: 3, carbs: 32, fats: 5 },
  { name: "Upma", portion: "1 plate", calories: 200, protein: 5, carbs: 30, fats: 7 },
  { name: "Oats", portion: "1 cup cooked", calories: 150, protein: 5, carbs: 27, fats: 3 },
  { name: "Almonds", portion: "10 pieces", calories: 70, protein: 2.5, carbs: 2.5, fats: 6 },
  { name: "Apple", portion: "1 medium", calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
];

export default function FoodSearch() {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);

  const { data: todayLog } = useTodayLog();
  const upsertLog = useUpsertLog();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return FOOD_DATABASE.filter(
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

      // Add to recents
      setRecentFoods((prev) => {
        const filtered = prev.filter((f) => f.name !== selectedFood.name);
        return [selectedFood, ...filtered].slice(0, 10);
      });

      toast({ title: `Added ${quantity}× ${selectedFood.name}`, description: `+${addCal} kcal logged` });
      setDrawerOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to log food", variant: "destructive" });
    }
  }, [selectedFood, quantity, todayLog, upsertLog]);

  const showResults = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto flex items-center gap-3 px-4 py-4">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">Food Search</h1>
            <p className="text-xs text-muted-foreground">Find & log your meals</p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search bar */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for roti, paneer, eggs..."
            className="pl-12 h-12 rounded-full bg-card border-border text-base"
            autoFocus
          />
        </div>

        {/* Quick Add */}
        {!showResults && (
          <div className="animate-fade-in">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Add
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {QUICK_ADD.map((food) => (
                <button
                  key={food.name}
                  onClick={() => openDrawer(food)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95"
                >
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {food.name}
                  </span>
                  <span className="text-xs text-primary font-semibold whitespace-nowrap">
                    {food.calories} kcal
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {showResults && (
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Results
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No results found for "{query}"
              </p>
            ) : (
              searchResults.map((food) => (
                <FoodRow key={food.name} food={food} onAdd={() => openDrawer(food)} />
              ))
            )}
          </div>
        )}

        {/* Recent Foods */}
        {!showResults && recentFoods.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Recent Foods
            </h3>
            {recentFoods.map((food) => (
              <FoodRow key={food.name} food={food} onAdd={() => openDrawer(food)} />
            ))}
          </div>
        )}
      </main>

      {/* Log Food Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          {selectedFood && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-xl font-display">{selectedFood.name}</DrawerTitle>
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
                    { label: "Protein", value: Math.round(selectedFood.protein * quantity), unit: "g", color: "text-red-400" },
                    { label: "Carbs", value: Math.round(selectedFood.carbs * quantity), unit: "g", color: "text-blue-400" },
                    { label: "Fats", value: Math.round(selectedFood.fats * quantity), unit: "g", color: "text-yellow-400" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl bg-muted/40 p-3 text-center">
                      <p className={`text-lg font-bold font-display ${m.color}`}>
                        {m.value}
                        <span className="text-xs font-normal text-muted-foreground ml-0.5">{m.unit}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <DrawerFooter>
                <Button
                  size="lg"
                  className="w-full h-13 rounded-xl text-base font-semibold"
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
      <div className="text-left">
        <p className="text-sm font-semibold text-foreground">{food.name}</p>
        <p className="text-xs text-muted-foreground">{food.portion}</p>
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
