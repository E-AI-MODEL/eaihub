
-- Mastery table for persistent student progress tracking
CREATE TABLE public.mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  path_id TEXT NOT NULL,
  current_node_id TEXT,
  status TEXT NOT NULL DEFAULT 'INTRO',
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, path_id)
);

-- Enable RLS
ALTER TABLE public.mastery ENABLE ROW LEVEL SECURITY;

-- Open policies (matching current project security posture - no auth yet)
CREATE POLICY "Anyone can read mastery" ON public.mastery FOR SELECT USING (true);
CREATE POLICY "Anyone can insert mastery" ON public.mastery FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update mastery" ON public.mastery FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete mastery" ON public.mastery FOR DELETE USING (true);

-- Auto-update updated_at
CREATE TRIGGER update_mastery_updated_at
  BEFORE UPDATE ON public.mastery
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for mastery
ALTER PUBLICATION supabase_realtime ADD TABLE public.mastery;
