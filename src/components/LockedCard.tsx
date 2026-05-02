import * as React from "react";
import { Lock, Sparkles } from "lucide-react";

interface LockedCardProps {
  title: string;
  description: string;
  onUnlock: () => void;
  children?: React.ReactNode;
}

export const LockedCard = React.forwardRef<HTMLDivElement, LockedCardProps>(
  ({ title, description, onUnlock, children }, ref) => {
    return (
      <div
        ref={ref}
        className="relative rounded-xl border border-border bg-card p-6 animate-fade-in cursor-pointer group overflow-hidden"
        onClick={onUnlock}
      >
        {/* blurred placeholder content */}
        <div className="blur-[6px] select-none pointer-events-none opacity-60">
          <h3 className="text-lg font-semibold font-display text-card-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-5">{description}</p>
          {children || <div className="h-48 bg-muted/50 rounded-lg" />}
        </div>

        {/* lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/40 backdrop-blur-[1px] transition-all group-hover:bg-card/50">
          <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center border border-gold/20 shadow-lg shadow-gold/10">
            <Lock className="w-5 h-5 text-gold" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Pro Feature</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-center">
              <Sparkles className="w-3 h-3 text-gold" /> Tap to unlock
            </p>
          </div>
        </div>
      </div>
    );
  }
);

LockedCard.displayName = "LockedCard";
