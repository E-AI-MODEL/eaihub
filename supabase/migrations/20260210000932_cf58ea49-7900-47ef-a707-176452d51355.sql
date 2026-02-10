
-- Student sessions: students push their live state here
CREATE TABLE public.student_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  name TEXT,
  subject TEXT,
  level TEXT,
  current_node_id TEXT,
  status TEXT DEFAULT 'ONLINE',
  progress INTEGER DEFAULT 0,
  analysis JSONB DEFAULT '{}',
  mechanical JSONB DEFAULT '{}',
  eai_state JSONB DEFAULT '{}',
  messages_count INTEGER DEFAULT 0,
  last_message_preview TEXT,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher messages: docent writes, student reads (read-only in chat)
CREATE TABLE public.teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  teacher_name TEXT DEFAULT 'Docent',
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (demo mode: permissive policies)
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sessions" ON public.student_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert sessions" ON public.student_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.student_sessions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sessions" ON public.student_sessions FOR DELETE USING (true);

CREATE POLICY "Anyone can read teacher messages" ON public.teacher_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert teacher messages" ON public.teacher_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update teacher messages" ON public.teacher_messages FOR UPDATE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_messages;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_student_sessions_updated_at
  BEFORE UPDATE ON public.student_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
