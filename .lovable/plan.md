

# Smart Scanner Premium UI Redesign

## Overview
Refine the Smart Scanner page into an ultra-minimalist, high-end experience with glassmorphism effects, cleaner typography, and floating card designs.

## Changes

### 1. Add "breathing glow" keyframe animation (tailwind.config.ts)
Add a new `breathing-glow` keyframe that slowly scales and fades a teal glow ring, creating a calm, premium pulsing effect for the scanner button.

### 2. Redesign FoodScanner component (src/components/FoodScanner.tsx)

**Typography and layout:**
- Make the "Smart Scanner" title use `text-4xl font-extrabold tracking-tight` with the `font-display` (DM Sans) class -- no cursive fonts anywhere.
- Keep the subtitle but make it lighter and more spaced out.
- Remove the "Tap to Scan Food or Barcode" text below the button entirely.
- Increase vertical spacing around the button for a calming, airy feel.

**Glassmorphism camera button:**
- Replace the solid teal circle with a glassmorphic button: semi-transparent background (`bg-white/10 dark:bg-white/5`), `backdrop-blur-xl`, subtle border (`border border-white/20`), and a soft `shadow-[0_0_40px_rgba(45,180,160,0.3)]` teal glow.
- Use a thin-stroke `Camera` icon (`strokeWidth={1.5}`) inside instead of the heavy default.
- Outer ring uses the new `animate-breathing-glow` animation -- a ring that slowly pulses with a soft teal box-shadow.

**Recent Scans cards:**
- Remove `border border-border`. Use `rounded-2xl` (pill-ish), `bg-white dark:bg-white/5`, and a soft diffused shadow (`shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)]`).
- Replace the `Camera` icon on each card with contextual icons: `UtensilsCrossed` for food items and `ScanBarcode` for barcode items (or just use `UtensilsCrossed` for all recent scans since they're food results).

### 3. No changes needed to:
- The camera overlay modal (already dark/blurred and looks good).
- The ScanResultCard (already polished).
- The color system or index.css.

## Technical Details

**Files modified:**
- `tailwind.config.ts` -- add `breathing-glow` keyframe and animation
- `src/components/FoodScanner.tsx` -- redesign the scanner home section (lines 55-97) with glassmorphism button, updated typography, floating recent scan cards, and new icon imports

**New icon imports:**
- Add `UtensilsCrossed` from `lucide-react`

**New keyframe in tailwind.config.ts:**
```
"breathing-glow": {
  "0%, 100%": { transform: "scale(1)", opacity: "0.4" },
  "50%": { transform: "scale(1.15)", opacity: "0.8" },
}
```
Animation: `"breathing-glow": "breathing-glow 3s ease-in-out infinite"`
