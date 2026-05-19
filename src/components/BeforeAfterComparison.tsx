import { useMemo, useState, useEffect } from "react";
import { ArrowRight, TrendingDown, TrendingUp, Minus, Trash2 } from "lucide-react";
import { usePhysiqueScans, useDeletePhysiqueScan } from "@/hooks/usePhysiqueScans";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getColor(pct: number) {
  if (pct <= 15) return "text-neon-green";
  if (pct <= 25) return "text-neon-blue";
  if (pct <= 35) return "text-neon-orange";
  return "text-destructive";
}

function getBgColor(pct: number) {
  if (pct <= 15) return "bg-neon-green/10 border-neon-green/30";
  if (pct <= 25) return "bg-neon-blue/10 border-neon-blue/30";
  if (pct <= 35) return "bg-neon-orange/10 border-neon-orange/30";
  return "bg-destructive/10 border-destructive/30";
}

export function BeforeAfterComparison() {
  const { data: scans, isLoading } = usePhysiqueScans();
  const deleteScan = useDeletePhysiqueScan();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const { before, after, diff } = useMemo(() => {
    if (!scans || scans.length < 2) return { before: null, after: null, diff: 0 };
    const first = scans[0];
    const last = scans[scans.length - 1];
    return {
      before: first,
      after: last,
      diff: +(last.body_fat_percentage - first.body_fat_percentage).toFixed(1),
    };
  }, [scans]);

  // Generate signed URLs for before/after photos
  useEffect(() => {
    if (!before || !after) return;
    const paths = [before.photo_url, after.photo_url].filter(Boolean);
    if (paths.length === 0) return;

    const fetchSignedUrls = async () => {
      const urls: Record<string, string> = {};
      for (const path of paths) {
        // Skip if already a full URL (legacy public URL)
        if (path.startsWith("http")) {
          urls[path] = path;
          continue;
        }
        const { data } = await supabase.storage
          .from("physique-photos")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) urls[path] = data.signedUrl;
      }
      setSignedUrls(urls);
    };
    fetchSignedUrls();
  }, [before, after]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteScan.mutateAsync(deleteTarget.id);
      toast.success("Scan deleted");
    } catch {
      toast.error("Failed to delete scan");
    }
    setDeleteTarget(null);
  };

  if (isLoading) return null;

  if (!before || !after) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-fade-in">
        <h3 className="text-base font-semibold font-display text-card-foreground mb-2">
          Before & After
        </h3>
        <p className="text-xs text-muted-foreground">
          {scans?.length === 1
            ? "Log one more physique scan to see your before & after comparison."
            : "Log at least two physique scans to see your transformation."}
        </p>
      </div>
    );
  }

  const DiffIcon = diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus;
  const diffColor = diff < 0 ? "text-neon-green" : diff > 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5 shadow-lg animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold font-display text-card-foreground">
            Before & After
          </h3>
          <div className={`flex items-center gap-1 text-sm font-semibold ${diffColor}`}>
            <DiffIcon className="w-4 h-4" />
            <span>{diff > 0 ? "+" : ""}{diff}%</span>
          </div>
        </div>

        {/* Side by side photos */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Before */}
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-muted group">
              <img src={signedUrls[before.photo_url] || before.photo_url} alt={`Before physique scan, ${before.body_fat_percentage}% body fat`} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card/90 to-transparent p-3 pt-8">
                <p className={`text-2xl font-bold font-display ${getColor(before.body_fat_percentage)}`}>
                  {before.body_fat_percentage}%
                </p>
              </div>
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-card/80 text-muted-foreground backdrop-blur-sm">
                  Before
                </span>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: before.id, label: "Before" })}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">
                {format(new Date(before.created_at), "MMM d, yyyy")}
              </p>
              <p className="text-xs font-medium text-card-foreground">{before.category}</p>
            </div>
          </div>

          {/* After */}
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-muted group">
              <img src={signedUrls[after.photo_url] || after.photo_url} alt={`Latest physique scan, ${after.body_fat_percentage}% body fat`} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card/90 to-transparent p-3 pt-8">
                <p className={`text-2xl font-bold font-display ${getColor(after.body_fat_percentage)}`}>
                  {after.body_fat_percentage}%
                </p>
              </div>
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-primary/80 text-primary-foreground backdrop-blur-sm">
                  After
                </span>
              </div>
              <button
                onClick={() => setDeleteTarget({ id: after.id, label: "After" })}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">
                {format(new Date(after.created_at), "MMM d, yyyy")}
              </p>
              <p className="text-xs font-medium text-card-foreground">{after.category}</p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`rounded-lg border p-2.5 text-center ${getBgColor(before.body_fat_percentage)}`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Start</p>
            <p className={`text-lg font-bold font-display ${getColor(before.body_fat_percentage)}`}>
              {before.body_fat_percentage}%
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 flex flex-col items-center justify-center">
            <ArrowRight className="w-4 h-4 text-muted-foreground mb-0.5" />
            <p className={`text-sm font-bold ${diffColor}`}>
              {diff > 0 ? "+" : ""}{diff}%
            </p>
          </div>
          <div className={`rounded-lg border p-2.5 text-center ${getBgColor(after.body_fat_percentage)}`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Now</p>
            <p className={`text-lg font-bold font-display ${getColor(after.body_fat_percentage)}`}>
              {after.body_fat_percentage}%
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center mt-3 leading-relaxed">
          Based on AI visual estimation. Not a substitute for professional body composition analysis.
        </p>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.label} Scan</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this physique scan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteScan.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
