
-- 1. Add missing FK constraints with ON DELETE CASCADE
ALTER TABLE public.meal_plans
  ADD CONSTRAINT meal_plans_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.physique_scans
  ADD CONSTRAINT physique_scans_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.food_logs
  ADD CONSTRAINT food_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.weight_logs
  ADD CONSTRAINT weight_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.progress_photos
  ADD CONSTRAINT progress_photos_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Harden handle_new_user with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_name := TRIM(user_name);
  IF LENGTH(user_name) > 255 THEN
    user_name := SUBSTRING(user_name, 1, 255);
  END IF;
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, user_name);
  RETURN NEW;
END;
$$;

-- 3. Make physique-photos bucket private and fix policies
UPDATE storage.buckets SET public = false WHERE id = 'physique-photos';

DROP POLICY IF EXISTS "Anyone can view physique photos" ON storage.objects;

CREATE POLICY "Users can view own physique photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'physique-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Also make user_progress_images private
UPDATE storage.buckets SET public = false WHERE id = 'user_progress_images';

DROP POLICY IF EXISTS "Anyone can view progress images" ON storage.objects;

CREATE POLICY "Users can view own progress images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user_progress_images' AND (storage.foldername(name))[1] = auth.uid()::text);
