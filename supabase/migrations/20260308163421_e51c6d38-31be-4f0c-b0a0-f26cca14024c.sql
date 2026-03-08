ALTER TABLE public.profiles ADD COLUMN school_id text;
CREATE INDEX idx_profiles_school_id ON public.profiles(school_id);