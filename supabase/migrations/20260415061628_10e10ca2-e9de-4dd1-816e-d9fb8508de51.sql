
CREATE TABLE public.step_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own step logs" ON public.step_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own step logs" ON public.step_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own step logs" ON public.step_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own step logs" ON public.step_logs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_step_logs_updated_at BEFORE UPDATE ON public.step_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
