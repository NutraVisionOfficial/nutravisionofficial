

# Handle Returning Users on the Landing Page

## Overview
Add a "Log In" link for returning users on the onboarding welcome screen, and ensure the existing auto-redirect logic works correctly. The `/auth` page already serves as a fully functional login page with email/password and Google OAuth.

## Changes

### 1. Add "Already have an account? Log In" link to the Welcome screen (`src/pages/Onboarding.tsx`)
Below the "Get Started" button on the welcome screen (around line 114), add a subtle text link:
- Text: "Already have an account? **Log In**"
- Styling: small, muted text with a primary-colored clickable "Log In" portion
- Action: Uses `navigate("/auth")` to skip onboarding entirely and go straight to the login/signup page

### 2. Auto-redirect is already handled
The `PublicOnlyRoute` wrapper in `App.tsx` already checks for an active session and redirects logged-in users to `/` (the dashboard). No additional session check code is needed -- returning users with an active session will never see the onboarding screen.

### 3. No new route needed
The `/auth` page already exists with:
- Email/password login and signup
- Google OAuth
- Redirect to dashboard on success (via `PublicOnlyRoute`)

We do NOT need to create a separate `/login` route -- `/auth` handles both login and signup with a toggle.

## Technical Details

**Files modified:**
- `src/pages/Onboarding.tsx` -- Add a `navigate("/auth")` link below the "Get Started" button in the welcome phase (lines 112-114). Approximately 5 lines of new JSX.

**No new files, routes, or dependencies required.**
