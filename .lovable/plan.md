

# Convert Pro Paywall to Full-Page Pricing with Stripe Checkout

## Overview
Replace the modal-based Pro paywall with a dedicated full-page route at `/upgrade`, featuring a premium dark design with gold accents, testimonials, and a Stripe-ready checkout button. All existing "Upgrade to Pro" triggers will navigate to this new page instead of opening the old modal.

## Changes

### 1. Create new Upgrade page (`src/pages/Upgrade.tsx`)
A full-screen, dark-themed pricing page with:

- **Navigation bar**: Back arrow / X button to return to previous page
- **Hero section**: Large "Unlock Your Full Potential" heading with subtitle "Premium tools to accelerate your 3-year transformation"
- **Pricing toggle**: Monthly (Rs.1,000/mo) / Yearly (Rs.9,000/yr) with "Save Rs.3,000!" badge, reusing the existing Switch component
- **Feature grid**: 2x2 grid displaying the 4 Pro features (AI Meal Planner, Advanced Analytics, 1-on-1 Coaching, VIP Challenges) with minimalist icons
- **Social proof**: 3 mock testimonials with avatar initials, names, and quotes
- **CTA button**: Gold "Upgrade to Pro" button with loading spinner state and a `handleCheckout` function containing a placeholder comment for the Stripe Payment Link redirect
- **Footer text**: "Cancel anytime - 7-day free trial - Secure payment"

The page will use a forced dark background (`bg-[hsl(220,25%,8%)]`) with gold accent glows regardless of the app's theme setting.

### 2. Add route in `src/App.tsx`
- Import and add a new protected route: `/upgrade` pointing to the Upgrade page
- Keep it inside `ProtectedRoute` so only authenticated users can access it

### 3. Update all "Upgrade to Pro" triggers to use navigation
Replace `setPaywallOpen(true)` and `onOpenPaywall()` calls with `navigate("/upgrade")`:

- **`src/pages/Index.tsx`**:
  - Remove `paywallOpen` state and `ProPaywall` component usage
  - Change the header "Upgrade to Pro" button to navigate to `/upgrade`
  - Pass `navigate("/upgrade")` as `onOpenPaywall` to `FoodScanner`
  - Pass `navigate("/upgrade")` as `onUnlock` to `LockedCard` components

- **`src/components/FoodScanner.tsx`**:
  - No changes needed -- it already calls `onOpenPaywall` prop which will now navigate

- **`src/pages/Settings.tsx`**:
  - Change the "Upgrade to Pro" link to navigate to `/upgrade`

### 4. Keep `ProPaywall.tsx` and `LockedCard.tsx`
- `ProPaywall.tsx` can remain in the codebase but will no longer be actively used (or can be deleted for cleanliness)
- `LockedCard.tsx` stays unchanged -- it still triggers `onUnlock` which now navigates

## Technical Details

**Files created:**
- `src/pages/Upgrade.tsx` -- full-page pricing with `handleCheckout` containing `// TODO: Insert Stripe Payment Link here`

**Files modified:**
- `src/App.tsx` -- add `/upgrade` route (line 41, add new Route)
- `src/pages/Index.tsx` -- remove `paywallOpen` state, remove `ProPaywall` import/usage, use `navigate("/upgrade")` everywhere
- `src/pages/Settings.tsx` -- change upgrade link to `navigate("/upgrade")`

**Checkout function shape:**
```typescript
const handleCheckout = async () => {
  setLoading(true);
  try {
    // TODO: Insert Stripe Payment Link here
    // Example: window.location.href = "https://buy.stripe.com/your-link";
  } finally {
    setLoading(false);
  }
};
```

**Mock testimonials data:**
3 entries with name, quote, and transformation result (e.g., "Lost 12kg in 8 months", "Hit my goal weight in 6 months", "Best investment in my health").

