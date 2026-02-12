
-- Add meal planner preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN diet_type TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN allergies TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN cooking_time TEXT NOT NULL DEFAULT 'moderate',
ADD COLUMN meals_per_day TEXT NOT NULL DEFAULT '3_meals';

-- Create meal_plans table for generated plans
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  plan_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans"
ON public.meal_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
ON public.meal_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
ON public.meal_plans FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_meal_plans_updated_at
BEFORE UPDATE ON public.meal_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
