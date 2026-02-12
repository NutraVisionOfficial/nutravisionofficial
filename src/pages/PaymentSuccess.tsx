import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const unlocked = useRef(false);

  useEffect(() => {
    // Fire confetti
    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    if (!user || unlocked.current) return;
    unlocked.current = true;

    supabase
      .from("profiles")
      .update({ subscription_status: "pro" } as any)
      .eq("user_id", user.id)
      .then(({ error }) => {
        if (error) {
          toast({ title: "Error unlocking Pro", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Pro Features Unlocked Successfully 🔓" });
        }
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 text-gold text-xs font-semibold tracking-wide uppercase mx-auto">
          <Sparkles className="w-3.5 h-3.5" /> Welcome to Pro
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold font-display text-foreground tracking-tight">
          You're In!
        </h1>

        <p className="text-muted-foreground text-base md:text-lg">
          Your 3-Year Transformation Plan is now unlocked. Let's get to work.
        </p>

        <Button
          size="lg"
          className="h-14 px-10 rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-lg shadow-lg shadow-gold/20 animate-pulse"
          onClick={() => navigate("/")}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Go to My Pro Dashboard
        </Button>
      </div>
    </div>
  );
}
