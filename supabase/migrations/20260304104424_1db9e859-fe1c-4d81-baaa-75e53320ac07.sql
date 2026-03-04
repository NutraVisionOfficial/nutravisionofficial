
-- Create storage bucket for physique photos
INSERT INTO storage.buckets (id, name, public) VALUES ('physique-photos', 'physique-photos', true);

-- Create physique_scans table
CREATE TABLE public.physique_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  body_fat_percentage NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  muscle_mass TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.physique_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans" ON public.physique_scans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON public.physique_scans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans" ON public.physique_scans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage RLS policies
CREATE POLICY "Users can upload own physique photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'physique-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view physique photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'physique-photos');
CREATE POLICY "Users can delete own physique photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'physique-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
