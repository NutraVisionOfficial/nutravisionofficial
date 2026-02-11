import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface DailyLogFormProps {
  open: boolean;
  onClose: () => void;
}

export function DailyLogForm({ open, onClose }: DailyLogFormProps) {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [workout, setWorkout] = useState("");
  const [duration, setDuration] = useState("");
  const [weight, setWeight] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In MVP, just close. Data would be saved to DB in production.
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold font-display text-card-foreground">Log Today</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-card-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-card-foreground">Nutrition</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Input placeholder="Calories" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
              <Input placeholder="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
              <Input placeholder="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              <Input placeholder="Fats (g)" type="number" value={fats} onChange={(e) => setFats(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-card-foreground">Workout</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Select value={workout} onValueChange={setWorkout}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {["Running", "Weight Training", "Yoga", "Cycling", "Swimming", "HIIT", "Rest"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-card-foreground">Weight</Label>
            <Input placeholder="Current weight (kg)" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-2" />
          </div>

          <Button type="submit" className="w-full mt-2">
            <Plus className="w-4 h-4 mr-2" /> Save Entry
          </Button>
        </form>
      </div>
    </div>
  );
}
