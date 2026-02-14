import { useState, useCallback, useRef, useEffect } from "react";
import { Camera, ImagePlus, Loader2, ArrowLeft, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTodayLog, useUpsertLog } from "@/hooks/useDailyLogs";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ScanResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  health_score: number;
  verdict: string;
  reasoning: string;
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "hsl(var(--success))"
      : score >= 50
      ? "hsl(43, 96%, 56%)"
      : "hsl(var(--destructive))";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold font-display text-foreground">{score}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

function MacroRing({ value, label, max, color }: { value: number; label: string; max: number; color: string }) {
  const size = 56;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference - pct * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">{value}g</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const config: Record<string, { emoji: string; className: string }> = {
    Excellent: { emoji: "✅", className: "bg-success/15 text-success border-success/30" },
    Good: { emoji: "👍", className: "bg-primary/15 text-primary border-primary/30" },
    Mediocre: { emoji: "⚠️", className: "bg-gold/15 text-gold border-gold/30" },
    Avoid: { emoji: "🚫", className: "bg-destructive/15 text-destructive border-destructive/30" },
  };
  const c = config[verdict] || config.Good;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.className}`}>
      {c.emoji} {verdict}
    </span>
  );
}

export default function Scan() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { data: todayLog } = useTodayLog();
  const upsertLog = useUpsertLog();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera permissions in your browser settings.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("No camera found on this device. Try uploading from gallery instead.");
      } else {
        setCameraError("Could not access camera. Try uploading from gallery instead.");
      }
      toast({ variant: "destructive", title: "Camera error", description: cameraError || "Could not access camera." });
    }
  }, [cameraError]);

  const analyzeImage = useCallback(async (imageBase64: string) => {
    setAnalyzing(true);
    stopCamera();
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { imageBase64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult({
        name: data.name || "Unknown Food",
        calories: Math.round(Number(data.calories) || 0),
        protein: Math.round(Number(data.protein) || 0),
        carbs: Math.round(Number(data.carbs) || 0),
        fats: Math.round(Number(data.fats) || 0),
        health_score: Math.min(100, Math.max(0, Math.round(Number(data.health_score) || 50))),
        verdict: ["Excellent", "Good", "Mediocre", "Avoid"].includes(data.verdict) ? data.verdict : "Good",
        reasoning: data.reasoning || "",
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Analysis failed", description: err?.message || "Try again." });
    } finally {
      setAnalyzing(false);
    }
  }, [stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    analyzeImage(dataUrl);
  }, [analyzeImage]);

  const handleGallery = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => analyzeImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [analyzeImage]);

  const handleAddToDiary = useCallback(async () => {
    if (!result) return;
    try {
      await upsertLog.mutateAsync({
        total_calories: (todayLog?.total_calories ?? 0) + result.calories,
        protein: (todayLog?.protein ?? 0) + result.protein,
        carbs: (todayLog?.carbs ?? 0) + result.carbs,
        fats: (todayLog?.fats ?? 0) + result.fats,
        workout_type: todayLog?.workout_type ?? "Rest",
        workout_duration_mins: todayLog?.workout_duration_mins ?? 0,
      });
      toast({ title: `Added ${result.name}`, description: `+${result.calories} kcal logged` });
      navigate("/");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to log food" });
    }
  }, [result, todayLog, upsertLog, navigate]);

  const handleReset = useCallback(() => {
    setResult(null);
    setAnalyzing(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleGallery} />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto flex items-center gap-3 px-4 py-4">
          {result && (
            <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">AI Scanner</h1>
            <p className="text-xs text-muted-foreground">Snap or upload to analyze</p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* --- RESULT VIEW --- */}
        {result ? (
          <div className="space-y-5 animate-fade-in">
            {/* Score + Name Card */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <h2 className="text-xl font-bold font-display text-foreground">{result.name}</h2>
                  <VerdictBadge verdict={result.verdict} />
                  <p className="text-sm text-muted-foreground mt-2">{result.reasoning}</p>
                </div>
                <ScoreRing score={result.health_score} />
              </div>
            </div>

            {/* Calories */}
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-3xl font-extrabold font-display text-primary">{result.calories}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Estimated Calories</p>
            </div>

            {/* Macro Rings */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">Macronutrients</p>
              <div className="flex justify-around">
                <MacroRing value={result.protein} label="Protein" max={50} color="hsl(0, 80%, 60%)" />
                <MacroRing value={result.carbs} label="Carbs" max={80} color="hsl(200, 70%, 55%)" />
                <MacroRing value={result.fats} label="Fat" max={40} color="hsl(43, 96%, 56%)" />
              </div>
            </div>

            {/* Add to Diary */}
            <Button
              size="lg"
              className="w-full h-14 rounded-2xl text-base font-bold shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
              onClick={handleAddToDiary}
              disabled={upsertLog.isPending}
            >
              <Plus className="w-5 h-5 mr-2" />
              {upsertLog.isPending ? "Adding..." : "Add to Diary"}
            </Button>

            <button
              onClick={handleReset}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Scan Another
            </button>
          </div>
        ) : analyzing ? (
          /* --- ANALYZING --- */
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 animate-fade-in">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-primary/30 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div className="absolute -inset-3 rounded-full border border-primary/20 animate-ping" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-foreground">Analyzing your food…</p>
              <p className="text-sm text-muted-foreground">AI is identifying nutrients</p>
            </div>
          </div>
        ) : cameraActive ? (
          /* --- LIVE CAMERA --- */
          <div className="space-y-4 animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden border border-border aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Focus frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/70 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/70 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/70 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/70 rounded-br-lg" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button size="lg" className="flex-1 h-14 rounded-2xl text-base font-bold" onClick={handleCapture}>
                <Camera className="w-5 h-5 mr-2" /> Capture
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-2xl px-5"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-5 h-5 mr-1" /> Gallery
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-14 rounded-2xl px-4 text-muted-foreground"
                onClick={() => { stopCamera(); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* --- IDLE: TAP TO CAPTURE --- */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold font-display text-foreground tracking-tight">
                AI Food Scanner
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Take a photo or upload an image to get an instant health score & nutrition breakdown
              </p>
            </div>

            {/* Camera denied error */}
            {cameraError && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-left max-w-sm">
                <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{cameraError}</p>
              </div>
            )}

            {/* Tap to capture circle */}
            <button onClick={startCamera} className="relative group">
              <div className="absolute -inset-4 rounded-full border border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.2)] animate-pulse" />
              <div className="relative w-36 h-36 rounded-full bg-card border border-border shadow-lg flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
                <Camera className="w-14 h-14 text-primary" strokeWidth={1.5} />
              </div>
            </button>
            <p className="text-xs text-muted-foreground">Tap to open camera</p>

            {/* Gallery upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <ImagePlus className="w-4 h-4" />
              Or upload from gallery
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
