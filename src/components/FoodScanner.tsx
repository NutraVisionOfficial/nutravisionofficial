import { useState, useCallback, useRef } from "react";
import { Camera, ScanBarcode, UtensilsCrossed, X, Sparkles, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { fetchProductByBarcode, type FoodProduct } from "@/lib/openFoodFacts";
import { toast } from "@/hooks/use-toast";

const NUTRI_COLORS: Record<string, string> = {
  A: "bg-[hsl(152,60%,42%)]",
  B: "bg-[hsl(80,55%,50%)]",
  C: "bg-[hsl(43,96%,56%)]",
  D: "bg-[hsl(24,90%,55%)]",
  E: "bg-[hsl(0,72%,55%)]",
  unknown: "bg-muted",
};

interface FoodScannerProps {
  onOpenPaywall: () => void;
}

export function FoodScanner({ onOpenPaywall }: FoodScannerProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"photo" | "barcode">("barcode");
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<FoodProduct | null>(null);
  const [recentScans, setRecentScans] = useState<FoodProduct[]>([]);
  const processingRef = useRef(false);

  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setFetching(true);

    try {
      await stopScanning();
      const product = await fetchProductByBarcode(barcode);
      setResult(product);
      setRecentScans((prev) => {
        const filtered = prev.filter((p) => p.barcode !== product.barcode);
        return [product, ...filtered].slice(0, 5);
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Product not found",
        description: "Product not found in database. Try the AI Photo Scanner instead!",
      });
      setCameraOpen(false);
    } finally {
      setFetching(false);
      processingRef.current = false;
    }
  }, []);

  const { startScanning, stopScanning, isScanning, error: cameraError } =
    useBarcodeScanner("barcode-reader", handleBarcodeDetected);

  const handleOpenCamera = useCallback(async () => {
    setCameraOpen(true);
    setResult(null);
    setFetching(false);
    processingRef.current = false;
    // Small delay to ensure the DOM element is mounted
    setTimeout(() => {
      startScanning();
    }, 300);
  }, [startScanning]);

  const handleCloseCamera = useCallback(async () => {
    await stopScanning();
    setCameraOpen(false);
    setResult(null);
    setFetching(false);
    processingRef.current = false;
  }, [stopScanning]);

  const handleScanAgain = useCallback(async () => {
    setResult(null);
    setFetching(false);
    processingRef.current = false;
    setTimeout(() => {
      startScanning();
    }, 300);
  }, [startScanning]);

  return (
    <>
      {/* Scanner home */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-12 animate-fade-in">
        <div className="space-y-3">
          <h2 className="text-4xl font-extrabold tracking-tight font-display text-foreground">
            Smart Scanner
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto tracking-wide">
            Scan a barcode to instantly get nutritional data
          </p>
        </div>

        {/* Glassmorphism camera button */}
        <button onClick={handleOpenCamera} className="relative group mt-4">
          <div className="absolute -inset-4 rounded-full border border-primary/30 shadow-[0_0_30px_rgba(45,180,160,0.25)] animate-breathing-glow" />
          <div className="relative w-36 h-36 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(45,180,160,0.3)] flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
            <Camera className="w-14 h-14 text-primary" strokeWidth={1.5} />
          </div>
        </button>

        {/* recent scans */}
        {recentScans.length > 0 && (
          <div className="w-full max-w-sm space-y-3 pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recent Scans</p>
            <div className="space-y-2">
              {recentScans.map((scan) => (
                <div key={scan.barcode} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                  {scan.imageUrl && (
                    <img src={scan.imageUrl} alt={scan.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">{scan.name}</p>
                    <p className="text-xs text-muted-foreground">{scan.calories} kcal · P{scan.protein}g · C{scan.carbs}g · F{scan.fats}g</p>
                  </div>
                  <UtensilsCrossed className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                </div>
              ))}
            </div>
          </div>
        )}
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
              <ScanResultCard result={result} onOpenPaywall={onOpenPaywall} onScanAgain={handleScanAgain} />
            ) : fetching ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <p className="text-white/70 text-sm">Searching Database...</p>
              </div>
            ) : cameraError ? (
              <div className="flex flex-col items-center gap-4 text-center px-4">
                <Camera className="w-12 h-12 text-white/30" />
                <p className="text-white/70 text-sm">{cameraError}</p>
                <Button onClick={startScanning} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Retry
                </Button>
              </div>
            ) : scanMode === "barcode" ? (
              <div className="w-full max-w-xs">
                <div id="barcode-reader" className="rounded-2xl overflow-hidden" />
                <p className="text-white/40 text-sm text-center mt-4">
                  Point your camera at a barcode
                </p>
              </div>
            ) : (
              <div className="w-full max-w-xs aspect-square rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-4">
                <Camera className="w-12 h-12 text-white/30" />
                <p className="text-white/40 text-sm text-center px-4">
                  AI Photo coming soon
                </p>
              </div>
            )}
          </div>

          {/* mode toggle at bottom */}
          {!result && !fetching && (
            <div className="px-6 pb-8 pt-4">
              <div className="flex bg-white/10 rounded-full p-1 max-w-xs mx-auto">
                <button
                  onClick={() => {
                    setScanMode("photo");
                    if (isScanning) stopScanning();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    scanMode === "photo"
                      ? "bg-primary text-primary-foreground"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> AI Photo
                </button>
                <button
                  onClick={() => {
                    setScanMode("barcode");
                    setTimeout(() => startScanning(), 300);
                  }}
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
  result: FoodProduct;
  onOpenPaywall: () => void;
  onScanAgain: () => void;
}) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-scale-in">
      <div className="p-6 space-y-5">
        {/* food name & nutri-score */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {result.imageUrl && (
              <img src={result.imageUrl} alt={result.name} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Detected</p>
              <h3 className="text-lg font-bold font-display text-card-foreground mt-1">{result.name}</h3>
            </div>
          </div>
          {result.nutriScore !== "unknown" && (
            <div className={`w-10 h-10 rounded-lg ${NUTRI_COLORS[result.nutriScore]} flex items-center justify-center`}>
              <span className="text-white font-extrabold text-lg">{result.nutriScore}</span>
            </div>
          )}
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
        {result.nutriScore !== "unknown" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Nutri-Score:</span>
            <div className="flex gap-1">
              {(["A", "B", "C", "D", "E"] as const).map((g) => (
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
        )}

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
