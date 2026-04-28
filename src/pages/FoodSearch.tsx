import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, Plus, Minus, Loader2, Globe2, MapPin, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { useSavedFoods, useSaveFood, useDeleteSavedFood } from "@/hooks/useSavedFoods";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTodayLog, useUpsertLog } from "@/hooks/useDailyLogs";
import { useAddFoodLog } from "@/hooks/useFoodLogs";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FoodItem {
  name: string;
  emoji: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  origin?: string;
}

const QUICK_LOG: FoodItem[] = [
  { name: "Roti", emoji: "🫓", portion: "1 medium", calories: 100, protein: 3, carbs: 18, fats: 1 },
  { name: "Pasta", emoji: "🍝", portion: "1 plate", calories: 320, protein: 12, carbs: 55, fats: 6 },
  { name: "Sushi Roll", emoji: "🍣", portion: "8 pieces", calories: 250, protein: 9, carbs: 38, fats: 6 },
  { name: "Tacos", emoji: "🌮", portion: "2 pieces", calories: 340, protein: 14, carbs: 30, fats: 18 },
  { name: "Boiled Egg", emoji: "🥚", portion: "1 large", calories: 78, protein: 6, carbs: 1, fats: 5 },
  { name: "Greek Salad", emoji: "🥗", portion: "1 bowl", calories: 220, protein: 8, carbs: 12, fats: 16 },
];

function getMealTypeFromTime(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 18 && hour < 22) return "dinner";
  return "snack";
}

export default function FoodSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [globalResults, setGlobalResults] = useState<FoodItem[]>([]);
  const [regionalResults, setRegionalResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState(getMealTypeFromTime);

  const { data: profile } = useProfile();
  const region = (profile as any)?.region || "India";

  const { data: todayLog } = useTodayLog();
  const upsertLog = useUpsertLog();
  const addFoodLog = useAddFoodLog();
  const { data: savedFoods = [] } = useSavedFoods();
  const saveFood = useSaveFood();
  const deleteSavedFood = useDeleteSavedFood();

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 450);
    return () => clearTimeout(t);
  }, [query]);

  // Search via AI
  useEffect(() => {
    if (!debounced) {
      setGlobalResults([]);
      setRegionalResults([]);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(null);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("search-foods", {
          body: { query: debounced, region },
        });
        if (cancelled) return;
        if (error) throw error;
        if (data?.error) setSearchError(data.error);
        setGlobalResults(Array.isArray(data?.global) ? data.global : []);
        setRegionalResults(Array.isArray(data?.regional) ? data.regional : []);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setSearchError("Search failed. Please try again.");
          setGlobalResults([]);
          setRegionalResults([]);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [debounced, region]);

  const openDrawer = useCallback((food: FoodItem) => {
    setSelectedFood(food);
    setQuantity(1);
    setMealType(getMealTypeFromTime());
    setDrawerOpen(true);
  }, []);

  const handleAddToDiary = useCallback(async () => {
    if (!selectedFood) return;

    const addCal = Math.round(selectedFood.calories * quantity);
    const addProtein = Math.round(selectedFood.protein * quantity);
    const addCarbs = Math.round(selectedFood.carbs * quantity);
    const addFats = Math.round(selectedFood.fats * quantity);

    try {
      await addFoodLog.mutateAsync({
        meal_type: mealType,
        food_name: selectedFood.name,
        emoji: selectedFood.emoji,
        portion: selectedFood.portion,
        calories: addCal,
        protein: addProtein,
        carbs: addCarbs,
        fats: addFats,
        quantity,
      });

      await upsertLog.mutateAsync({
        total_calories: (todayLog?.total_calories ?? 0) + addCal,
        protein: (todayLog?.protein ?? 0) + addProtein,
        carbs: (todayLog?.carbs ?? 0) + addCarbs,
        fats: (todayLog?.fats ?? 0) + addFats,
        workout_type: todayLog?.workout_type ?? "Rest",
        workout_duration_mins: todayLog?.workout_duration_mins ?? 0,
      });

      toast({ title: `Added ${quantity}× ${selectedFood.emoji} ${selectedFood.name}`, description: `+${addCal} kcal logged to ${mealType}` });
      setDrawerOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to log food", variant: "destructive" });
    }
  }, [selectedFood, quantity, mealType, todayLog, upsertLog, addFoodLog]);

  const handleSaveFood = useCallback(async () => {
    if (!selectedFood) return;
    try {
      await saveFood.mutateAsync({
        food_name: selectedFood.name,
        emoji: selectedFood.emoji,
        portion: selectedFood.portion,
        calories: Math.round(selectedFood.calories * quantity),
        protein: Math.round(selectedFood.protein * quantity),
        carbs: Math.round(selectedFood.carbs * quantity),
        fats: Math.round(selectedFood.fats * quantity),
      });
      toast({ title: `Saved ${selectedFood.emoji} ${selectedFood.name}`, description: "Available in My Saved Foods" });
    } catch {
      toast({ title: "Error", description: "Failed to save food", variant: "destructive" });
    }
  }, [selectedFood, quantity, saveFood]);

  const isAlreadySaved = !!selectedFood && savedFoods.some(
    (s) => s.food_name.toLowerCase() === selectedFood.name.toLowerCase()
  );

  const showResults = debounced.length > 0;
  const hasAnyResult = globalResults.length + regionalResults.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/60 backdrop-blur-xl sticky top-0 z-40 border-b border-border">
        <div className="container max-w-lg mx-auto px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold font-display text-foreground mb-1">Food Search</h1>
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
            <Globe2 className="w-3 h-3" /> Any cuisine, any language · Region: <span className="font-semibold text-foreground">{region}</span>
          </p>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'pasta', 'sushi', 'दाल', 'tacos'..."
              className="pl-12 h-12 rounded-full bg-secondary border-border text-base placeholder:text-muted-foreground"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-5 space-y-7">
        {showResults ? (
          <div className="space-y-7 animate-fade-in">
            {searchError && (
              <p className="text-sm text-destructive text-center py-2">{searchError}</p>
            )}

            {!searching && !hasAnyResult && !searchError && (
              <p className="text-muted-foreground text-sm text-center py-10">No foods found for "{debounced}"</p>
            )}

            {regionalResults.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Regional Favorites · {region}
                </h3>
                <div className="space-y-2">
                  {regionalResults.map((food, i) => (
                    <FoodRow key={`r-${i}-${food.name}`} food={food} onAdd={() => openDrawer(food)} />
                  ))}
                </div>
              </section>
            )}

            {globalResults.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Globe2 className="w-3 h-3" /> Popular Globally
                </h3>
                <div className="space-y-2">
                  {globalResults.map((food, i) => (
                    <FoodRow key={`g-${i}-${food.name}`} food={food} onAdd={() => openDrawer(food)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Log</h3>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_LOG.map((food) => (
                <button key={food.name} onClick={() => openDrawer(food)} className="flex flex-col items-start gap-1.5 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all active:scale-[0.97]">
                  <span className="text-2xl">{food.emoji}</span>
                  <span className="text-sm font-semibold text-foreground leading-tight">{food.name}</span>
                  <span className="text-xs text-primary font-bold">{food.calories} kcal</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-6">
              💡 Search for any dish in any language — Italian Pasta, 寿司, Tacos, دجاج…
            </p>
          </section>
        )}
      </main>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          {selectedFood && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-xl font-display flex items-center gap-2">
                  <span className="text-2xl">{selectedFood.emoji}</span>
                  {selectedFood.name}
                </DrawerTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedFood.portion}
                  {selectedFood.origin ? ` · ${selectedFood.origin}` : ""}
                </p>
              </DrawerHeader>

              <div className="px-4 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Meal</span>
                  <Select value={mealType} onValueChange={setMealType}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">☀️ Breakfast</SelectItem>
                      <SelectItem value="lunch">🌤️ Lunch</SelectItem>
                      <SelectItem value="dinner">🌙 Dinner</SelectItem>
                      <SelectItem value="snack">🍪 Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Quantity</span>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-bold font-display text-foreground w-10 text-center">{quantity}</span>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={() => setQuantity(quantity + 0.5)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

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
                  disabled={upsertLog.isPending || addFoodLog.isPending}
                >
                  {upsertLog.isPending || addFoodLog.isPending ? "Adding..." : "Add to Diary"}
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
    <button onClick={onAdd} className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all active:scale-[0.98]">
      <div className="flex items-center gap-3 text-left min-w-0">
        <span className="text-xl">{food.emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{food.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {food.portion}{food.origin ? ` · ${food.origin}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
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
