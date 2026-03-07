
-- Security definer function to get subscription status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_subscription_status(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT subscription_status FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate with hardened check: users can only update their own profile
-- and cannot change subscription_status from its current value
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND subscription_status = public.get_subscription_status(auth.uid())
);

-- Add missing UPDATE policies for food_logs, physique_scans, progress_photos
CREATE POLICY "Users can update own food logs"
ON public.food_logs FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
ON public.physique_scans FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress photos"
ON public.progress_photos FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
