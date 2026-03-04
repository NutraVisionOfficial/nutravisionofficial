import { useState, useRef, useCallback } from "react";
import { Camera, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ScanState = "idle" | "scanning" | "results";

interface PhysiqueResult {
  body_fat_percentage: number;
  category: string;
  muscle_mass: string;
  notes: string;
}

export function PhysiqueScanner() {
  const [state, setState] = useState<ScanState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PhysiqueResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setState("scanning");

      try {
        const { data, error } = await supabase.functions.invoke("analyze-physique", {
          body: { imageBase64: base64 },
        });

        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          setState("idle");
          setPreview(null);
          return;
        }

        // Small delay for UX
        await new Promise((r) => setTimeout(r, 1500));
        setResult(data as PhysiqueResult);
        setState("results");
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Analysis failed");
        setState("idle");
        setPreview(null);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => {
    setState("idle");
    setPreview(null);
    setResult(null);
  };

  const getColor = (pct: number) => {
    if (pct <= 15) return "text-neon-green";
    if (pct <= 25) return "text-neon-blue";
    if (pct <= 35) return "text-neon-orange";
    return "text-destructive";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold font-display text-card-foreground">
            AI Body Fat Estimator
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload a front-facing photo for AI analysis
          </p>
        </div>
        {state !== "idle" && (
          <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* IDLE: Upload dropzone */}
      {state === "idle" && (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 py-12"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-card-foreground">📸 Upload Front-Facing Photo</p>
            <p className="text-xs text-muted-foreground mt-1">JPG or PNG, best results with good lighting</p>
          </div>
        </button>
      )}

      {/* SCANNING: Photo with laser overlay */}
      {state === "scanning" && preview && (
        <div className="relative w-full rounded-xl overflow-hidden">
          <img src={preview} alt="Uploaded" className="w-full h-64 object-cover rounded-xl" />
          {/* Scanning laser */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute left-0 right-0 h-0.5 bg-neon-blue"
              style={{
                animation: "scanLaser 2s ease-in-out infinite",
                boxShadow: "0 0 12px 4px hsl(var(--neon-blue) / 0.6), 0 0 40px 8px hsl(var(--neon-blue) / 0.2)",
              }}
            />
          </div>
          {/* Scanning overlay */}
          <div className="absolute inset-0 bg-background/30 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-card-foreground animate-pulse">
                AI is analyzing physique...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {state === "results" && result && preview && (
        <div className="space-y-4">
          <div className="relative w-full rounded-xl overflow-hidden">
            <img src={preview} alt="Analyzed" className="w-full h-48 object-cover rounded-xl opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estimated Body Fat</p>
              <p className={`text-5xl font-bold font-display ${getColor(result.body_fat_percentage)}`}>
                {result.body_fat_percentage}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-semibold text-card-foreground mt-0.5">{result.category}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Muscle Mass</p>
              <p className="text-sm font-semibold text-card-foreground mt-0.5">{result.muscle_mass}</p>
            </div>
          </div>

          {result.notes && (
            <p className="text-xs text-muted-foreground italic text-center">{result.notes}</p>
          )}

          <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
            Note: This is a visual AI estimation, not a medical DEXA scan. Results are approximate and should not replace professional body composition analysis.
          </p>

          <Button
            onClick={() => {
              toast.success("Logged to Progress Gallery");
              reset();
            }}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Log to Progress Gallery
          </Button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      <style>{`
        @keyframes scanLaser {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  );
}
