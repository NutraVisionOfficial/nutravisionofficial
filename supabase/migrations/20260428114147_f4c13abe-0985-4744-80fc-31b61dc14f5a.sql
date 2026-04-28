CREATE TABLE public.saved_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍽️',
  portion TEXT NOT NULL DEFAULT '1 serving',
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fats NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved foods" ON public.saved_foods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved foods" ON public.saved_foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved foods" ON public.saved_foods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved foods" ON public.saved_foods FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_foods_updated_at
BEFORE UPDATE ON public.saved_foods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_saved_foods_user ON public.saved_foods(user_id, created_at DESC);