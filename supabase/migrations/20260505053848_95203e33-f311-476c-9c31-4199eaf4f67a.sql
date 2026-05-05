
-- 1. Trigger to prevent users from changing their subscription_status
CREATE OR REPLACE FUNCTION public.prevent_subscription_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'subscription_status cannot be modified directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_subscription_change ON public.profiles;
CREATE TRIGGER profiles_prevent_subscription_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_subscription_status_change();

-- 2. Storage UPDATE policy for physique-photos
CREATE POLICY "Users can update own physique photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'physique-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Lock down SECURITY DEFINER helper
REVOKE EXECUTE ON FUNCTION public.get_subscription_status(uuid) FROM PUBLIC, anon, authenticated;
