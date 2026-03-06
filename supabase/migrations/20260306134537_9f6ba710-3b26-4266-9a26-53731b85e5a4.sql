
-- Create chat_messages table for persistent chat history
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'model', 'teacher')),
  content text NOT NULL,
  analysis jsonb DEFAULT NULL,
  mechanical jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: open access (demo mode, no auth)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete chat messages" ON public.chat_messages FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Add delete policy for teacher_messages (was missing)
CREATE POLICY "Anyone can delete teacher messages" ON public.teacher_messages FOR DELETE USING (true);
