
-- Add subscription status to profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'free';
