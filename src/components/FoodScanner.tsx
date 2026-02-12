import { useState, useCallback, useRef, useEffect } from "react";
import { Camera, ScanBarcode, UtensilsCrossed, X, Sparkles, Lock, Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { fetchProductByBarcode, type FoodProduct } from "@/lib/openFoodFacts";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [fetchingLabel, setFetchingLabel] = useState("Searching Database...");
  const [result, setResult] = useState<FoodProduct | null>(null);
  const [recentScans, setRecentScans] = useState<FoodProduct[]>([]);
  const processingRef = useRef(false);

  // AI Photo camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Barcode scanner
  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setFetching(true);
    setFetchingLabel("Searching Database...");
    try {
      await stopScanning();
      const product = await fetchProductByBarcode(barcode);
      setResult(product);
      addToRecent(product);
    } catch {
      toast({ variant: "destructive", title: "Product not found", description: "Product not found in database. Try the AI Photo Scanner instead!" });
      setCameraOpen(false);
    } finally {
      setFetching(false);
      processingRef.current = false;
    }
  }, []);

  const { startScanning, stopScanning, isScanning, error: cameraError } =
    useBarcodeScanner("barcode-reader", handleBarcodeDetected);

  const addToRecent = (product: FoodProduct) => {
    setRecentScans((prev) => {
      const filtered = prev.filter((p) => p.barcode !== product.barcode && p.name !== product.name);
      return [product, ...filtered].slice(0, 5);
    });
  };

  // --- AI Photo camera ---
  const startPhotoCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      toast({ variant: "destructive", title: "Camera error", description: "Could not access camera. Please allow camera permissions." });
    }
  }, []);

  const stopPhotoCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  const analyzeImage = useCallback(async (imageBase64: string) => {
    setFetching(true);
    setFetchingLabel("Analyzing food structure...");
    stopPhotoCamera();

    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { imageBase64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const product: FoodProduct = {
        name: data.name || "Unknown Food",
        calories: Math.round(Number(data.calories) || 0),
        protein: Math.round(Number(data.protein) || 0),
        carbs: Math.round(Number(data.carbs) || 0),
        fats: Math.round(Number(data.fats) || 0),
        nutriScore: ["A", "B", "C", "D", "E"].includes(data.nutriScore) ? data.nutriScore : "unknown",
        barcode: `ai-${Date.now()}`,
      };
      setResult(product);
      addToRecent(product);
    } catch (err: any) {
      const msg = err?.message || "Could not analyze image";
      toast({ variant: "destructive", title: "Analysis failed", description: msg + ". Try again or use the barcode scanner." });
    } finally {
      setFetching(false);
    }
  }, [stopPhotoCamera]);

  const handleShutter = useCallback(() => {
    const frame = captureFrame();
    if (frame) analyzeImage(frame);
  }, [captureFrame, analyzeImage]);

  const handleGalleryUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [analyzeImage]);

  // --- Camera open/close ---
  const handleOpenCamera = useCallback(async () => {
    setCameraOpen(true);
    setResult(null);
    setFetching(false);
    processingRef.current = false;
    if (scanMode === "barcode") {
      setTimeout(() => startScanning(), 300);
    } else {
      setTimeout(() => startPhotoCamera(), 300);
    }
  }, [startScanning, startPhotoCamera, scanMode]);

  const handleCloseCamera = useCallback(async () => {
    await stopScanning();
    stopPhotoCamera();
    setCameraOpen(false);
    setResult(null);
    setFetching(false);
    processingRef.current = false;
  }, [stopScanning, stopPhotoCamera]);

  const handleScanAgain = useCallback(async () => {
    setResult(null);
    setFetching(false);
    processingRef.current = false;
    if (scanMode === "barcode") {
      setTimeout(() => startScanning(), 300);
    } else {
      setTimeout(() => startPhotoCamera(), 300);
    }
  }, [startScanning, startPhotoCamera, scanMode]);

  const switchToMode = useCallback((mode: "photo" | "barcode") => {
    setScanMode(mode);
    if (mode === "barcode") {
      stopPhotoCamera();
      setTimeout(() => startScanning(), 300);
    } else {
      if (isScanning) stopScanning();
      setTimeout(() => startPhotoCamera(), 300);
    }
  }, [stopPhotoCamera, startScanning, isScanning, stopScanning, startPhotoCamera]);

  return (
    <>
      {/* Scanner home */}
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-12 animate-fade-in">
        <div className="space-y-3">
          <h2 className="text-4xl font-extrabold tracking-tight font-display text-foreground">Smart Scanner</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto tracking-wide">Scan a barcode or snap a photo to get nutritional data</p>
        </div>

        <button onClick={handleOpenCamera} className="relative group mt-4">
          <div className="absolute -inset-4 rounded-full border border-primary/30 shadow-[0_0_30px_rgba(45,180,160,0.25)] animate-breathing-glow" />
          <div className="relative w-36 h-36 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(45,180,160,0.3)] flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
            <Camera className="w-14 h-14 text-primary" strokeWidth={1.5} />
          </div>
        </button>

        {recentScans.length > 0 && (
          <div className="w-full max-w-sm space-y-3 pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recent Scans</p>
            <div className="space-y-2">
              {recentScans.map((scan, i) => (
                <div key={scan.barcode + i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                  {scan.imageUrl && <img src={scan.imageUrl} alt={scan.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
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

      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />

      {/* Camera overlay */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
          {/* top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-6 pb-4 bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={handleCloseCamera} className="p-2 rounded-full hover:bg-white/10">
              <X className="w-6 h-6 text-white" />
            </button>
            <span className="text-white font-semibold font-display text-sm">
              {scanMode === "photo" ? "AI Photo Analysis" : "Barcode Scanner"}
            </span>
            <div className="w-10" />
          </div>

          {/* viewfinder area */}
          <div className="flex-1 flex items-center justify-center relative">
            {result ? (
              <div className="px-8 w-full flex justify-center">
                <ScanResultCard result={result} onOpenPaywall={onOpenPaywall} onScanAgain={handleScanAgain} />
              </div>
            ) : fetching ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <p className="text-white/70 text-sm">{fetchingLabel}</p>
              </div>
            ) : cameraError && scanMode === "barcode" ? (
              <div className="flex flex-col items-center gap-4 text-center px-4">
                <Camera className="w-12 h-12 text-white/30" />
                <p className="text-white/70 text-sm">{cameraError}</p>
                <Button onClick={startScanning} className="bg-primary text-primary-foreground hover:bg-primary/90">Retry</Button>
              </div>
            ) : scanMode === "barcode" ? (
              <div className="w-full max-w-xs px-8">
                <div id="barcode-reader" className="rounded-2xl overflow-hidden" />
                <p className="text-white/40 text-sm text-center mt-4">Point your camera at a barcode</p>
              </div>
            ) : (
              /* AI Photo: live camera feed */
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Focus frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-64 h-64">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/70 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/70 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/70 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/70 rounded-br-lg" />

                    {/* Scanning laser line */}
                    <div className="absolute left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-primary/80 to-transparent animate-scanner-line" />
                  </div>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-32 left-0 right-0 flex flex-col items-center gap-4">
                  <p className="text-white/60 text-xs tracking-wide">Point at any food to analyze</p>
                  <div className="flex items-center gap-8">
                    {/* Gallery button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <ImagePlus className="w-5 h-5 text-white" />
                    </button>

                    {/* Shutter button */}
                    <button
                      onClick={handleShutter}
                      className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-90"
                    >
                      <div className="w-16 h-16 rounded-full bg-white" />
                    </button>

                    {/* Spacer */}
                    <div className="w-12" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* mode toggle at bottom */}
          {!result && !fetching && (
            <div className="px-6 pb-8 pt-4 relative z-10 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex bg-white/10 rounded-full p-1 max-w-xs mx-auto">
                <button
                  onClick={() => switchToMode("photo")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    scanMode === "photo" ? "bg-primary text-primary-foreground" : "text-white/60 hover:text-white/80"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> AI Photo
                </button>
                <button
                  onClick={() => switchToMode("barcode")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    scanMode === "barcode" ? "bg-primary text-primary-foreground" : "text-white/60 hover:text-white/80"
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
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {result.imageUrl && <img src={result.imageUrl} alt={result.name} className="w-12 h-12 rounded-lg object-cover" />}
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

        <div className="text-center py-2">
          <p className="text-5xl font-extrabold font-display text-primary">{result.calories}</p>
          <p className="text-sm text-muted-foreground mt-1">Calories</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MacroBlock label="Protein" value={`${result.protein}g`} color="bg-primary/15 text-primary" />
          <MacroBlock label="Carbs" value={`${result.carbs}g`} color="bg-accent/15 text-accent" />
          <MacroBlock label="Fats" value={`${result.fats}g`} color="bg-[hsl(200,70%,50%)]/15 text-[hsl(200,70%,50%)]" />
        </div>

        {result.nutriScore !== "unknown" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Nutri-Score:</span>
            <div className="flex gap-1">
              {(["A", "B", "C", "D", "E"] as const).map((g) => (
                <div key={g} className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${g === result.nutriScore ? `${NUTRI_COLORS[g]} text-white` : "bg-muted text-muted-foreground/40"}`}>
                  {g}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onScanAgain} className="w-full" variant="outline">Scan Another</Button>
      </div>

      <button
        onClick={onOpenPaywall}
        className="w-full px-6 py-4 bg-gold/10 border-t border-gold/20 flex items-center gap-3 hover:bg-gold/15 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Save & track this meal?</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Unlock the 3-Year Transformation Dashboard with Pro.</p>
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
