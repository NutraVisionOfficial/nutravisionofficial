import { useState, useEffect } from "react";
import { Camera, ScanBarcode, X, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerResultData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  nutriScore: "A" | "B" | "C" | "D" | "E";
}

const MOCK_RESULTS: ScannerResultData[] = [
  { name: "Grilled Chicken Salad", calories: 380, protein: 42, carbs: 18, fats: 14, nutriScore: "A" },
  { name: "Veggie Wrap", calories: 310, protein: 12, carbs: 45, fats: 9, nutriScore: "B" },
  { name: "Protein Smoothie", calories: 220, protein: 28, carbs: 22, fats: 5, nutriScore: "A" },
  { name: "Cheese Pizza Slice", calories: 285, protein: 12, carbs: 36, fats: 10, nutriScore: "C" },
  { name: "Instant Noodles", calories: 450, protein: 8, carbs: 62, fats: 18, nutriScore: "D" },
];

const NUTRI_COLORS: Record<string, string> = {
  A: "bg-[hsl(152,60%,42%)]",
  B: "bg-[hsl(80,55%,50%)]",
  C: "bg-[hsl(43,96%,56%)]",
  D: "bg-[hsl(24,90%,55%)]",
  E: "bg-[hsl(0,72%,55%)]",
};

interface FoodScannerProps {
  onOpenPaywall: () => void;
}

export function FoodScanner({ onOpenPaywall }: FoodScannerProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"photo" | "barcode">("photo");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannerResultData | null>(null);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const random = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(random);
    }, 2000);
  };

  const handleCloseCamera = () => {
    setCameraOpen(false);
    setScanning(false);
    setResult(null);
  };

  return (
    <>
      {/* Scanner home */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-display text-foreground">
            Smart Scanner
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Instantly analyze any food or scan a barcode to get nutrition info
          </p>
        </div>

        {/* Pulsating camera button */}
        <button
          onClick={() => setCameraOpen(true)}
          className="relative group"
        >
          {/* outer pulse rings */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="absolute -inset-3 rounded-full bg-primary/10 animate-pulse-soft" />
          {/* main button */}
          <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25 transition-transform group-hover:scale-105 group-active:scale-95">
            <Camera className="w-14 h-14 text-primary-foreground" />
          </div>
        </button>
        <p className="text-sm font-medium text-muted-foreground">
          Tap to Scan Food or Barcode
        </p>

        {/* recent scans placeholder */}
        <div className="w-full max-w-sm space-y-3 pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recent Scans</p>
          <div className="space-y-2">
            {["Grilled Chicken Salad — 380 kcal", "Protein Smoothie — 220 kcal"].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <span className="text-sm text-foreground">{item}</span>
                <Camera className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Camera overlay */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in">
          {/* top bar */}
          <div className="flex items-center justify-between px-4 pt-6 pb-4">
            <button onClick={handleCloseCamera} className="p-2 rounded-full hover:bg-white/10">
              <X className="w-6 h-6 text-white" />
            </button>
            <span className="text-white font-semibold font-display text-sm">
              {scanMode === "photo" ? "AI Photo Analysis" : "Barcode Scanner"}
            </span>
            <div className="w-10" />
          </div>

          {/* viewfinder area */}
          <div className="flex-1 flex items-center justify-center px-8">
            {result ? (
              <ScanResultCard result={result} onOpenPaywall={onOpenPaywall} onScanAgain={() => setResult(null)} />
            ) : scanning ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-white/70 text-sm">Analyzing...</p>
              </div>
            ) : (
              <div className="w-full max-w-xs aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4">
                {scanMode === "photo" ? (
                  <Camera className="w-12 h-12 text-white/30" />
                ) : (
                  <ScanBarcode className="w-12 h-12 text-white/30" />
                )}
                <p className="text-white/40 text-sm text-center px-4">
                  {scanMode === "photo"
                    ? "Point at food to analyze"
                    : "Align barcode within frame"}
                </p>
                <Button
                  onClick={handleScan}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Capture
                </Button>
              </div>
            )}
          </div>

          {/* mode toggle at bottom */}
          {!result && (
            <div className="px-6 pb-8 pt-4">
              <div className="flex bg-white/10 rounded-full p-1 max-w-xs mx-auto">
                <button
                  onClick={() => setScanMode("photo")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    scanMode === "photo"
                      ? "bg-primary text-primary-foreground"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> AI Photo
                </button>
                <button
                  onClick={() => setScanMode("barcode")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    scanMode === "barcode"
                      ? "bg-primary text-primary-foreground"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  <ScanBarcode className="w-3.5 h-3.5" /> Barcode
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function ScanResultCard({
  result,
  onOpenPaywall,
  onScanAgain,
}: {
  result: ScannerResultData;
  onOpenPaywall: () => void;
  onScanAgain: () => void;
}) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-scale-in">
      <div className="p-6 space-y-5">
        {/* food name & nutri-score */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Detected</p>
            <h3 className="text-lg font-bold font-display text-card-foreground mt-1">{result.name}</h3>
          </div>
          <div className={`w-10 h-10 rounded-lg ${NUTRI_COLORS[result.nutriScore]} flex items-center justify-center`}>
            <span className="text-white font-extrabold text-lg">{result.nutriScore}</span>
          </div>
        </div>

        {/* calorie count */}
        <div className="text-center py-2">
          <p className="text-5xl font-extrabold font-display text-primary">{result.calories}</p>
          <p className="text-sm text-muted-foreground mt-1">Calories</p>
        </div>

        {/* macros */}
        <div className="grid grid-cols-3 gap-3">
          <MacroBlock label="Protein" value={`${result.protein}g`} color="bg-primary/15 text-primary" />
          <MacroBlock label="Carbs" value={`${result.carbs}g`} color="bg-accent/15 text-accent" />
          <MacroBlock label="Fats" value={`${result.fats}g`} color="bg-[hsl(200,70%,50%)]/15 text-[hsl(200,70%,50%)]" />
        </div>

        {/* nutri-score label */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Nutri-Score:</span>
          <div className="flex gap-1">
            {["A", "B", "C", "D", "E"].map((g) => (
              <div
                key={g}
                className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${
                  g === result.nutriScore
                    ? `${NUTRI_COLORS[g]} text-white`
                    : "bg-muted text-muted-foreground/40"
                }`}
              >
                {g}
              </div>
            ))}
          </div>
        </div>

        <Button onClick={onScanAgain} className="w-full" variant="outline">
          Scan Another
        </Button>
      </div>

      {/* upsell banner */}
      <button
        onClick={onOpenPaywall}
        className="w-full px-6 py-4 bg-gold/10 border-t border-gold/20 flex items-center gap-3 hover:bg-gold/15 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Save & track this meal?</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Unlock the 3-Year Transformation Dashboard with Pro.
          </p>
        </div>
        <Lock className="w-4 h-4 text-gold flex-shrink-0" />
      </button>
    </div>
  );
}

function MacroBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <p className="text-lg font-bold font-display">{value}</p>
      <p className="text-[10px] font-medium mt-0.5 opacity-70">{label}</p>
    </div>
  );
}
