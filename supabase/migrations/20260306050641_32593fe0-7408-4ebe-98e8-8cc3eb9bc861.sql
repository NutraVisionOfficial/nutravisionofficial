
-- 1. Create progress_photos table
CREATE TABLE public.progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL DEFAULT '',
  estimated_body_fat numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Users can view own progress photos"
  ON public.progress_photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress photos"
  ON public.progress_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress photos"
  ON public.progress_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_progress_images', 'user_progress_images', true);

-- 5. Storage RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own progress images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user_progress_images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 6. Storage RLS: users can read their own images
CREATE POLICY "Users can read own progress images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'user_progress_images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 7. Storage RLS: users can delete their own images
CREATE POLICY "Users can delete own progress images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'user_progress_images' AND (storage.foldername(name))[1] = auth.uid()::text);
