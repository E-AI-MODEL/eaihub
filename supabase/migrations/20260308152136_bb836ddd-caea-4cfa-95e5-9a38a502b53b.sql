
-- Fix: alle policies zijn RESTRICTIVE (AND-logica), moeten PERMISSIVE (OR-logica) zijn.
-- Drop all restrictive policies and recreate as permissive (default).

-- ═══ student_sessions ═══
DROP POLICY IF EXISTS "Students read own sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Students insert own sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Students update own sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Teachers read all sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Admins manage all sessions" ON public.student_sessions;

CREATE POLICY "Students read own sessions" ON public.student_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Students insert own sessions" ON public.student_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Students update own sessions" ON public.student_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Teachers read all sessions" ON public.student_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'DOCENT'));

CREATE POLICY "Admins manage all sessions" ON public.student_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- ═══ chat_messages ═══
DROP POLICY IF EXISTS "Students read own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Students insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Teachers read all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins manage all messages" ON public.chat_messages;

CREATE POLICY "Students read own messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.owns_session(session_id));

CREATE POLICY "Students insert own messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_session(session_id));

CREATE POLICY "Teachers read all messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'DOCENT'));

CREATE POLICY "Admins manage all messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- ═══ mastery ═══
DROP POLICY IF EXISTS "Students read own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Students insert own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Students update own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Teachers read all mastery" ON public.mastery;
DROP POLICY IF EXISTS "Admins manage all mastery" ON public.mastery;

CREATE POLICY "Students read own mastery" ON public.mastery
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Students insert own mastery" ON public.mastery
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Students update own mastery" ON public.mastery
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Teachers read all mastery" ON public.mastery
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'DOCENT'));

CREATE POLICY "Admins manage all mastery" ON public.mastery
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- ═══ teacher_messages ═══
DROP POLICY IF EXISTS "Students read own teacher messages" ON public.teacher_messages;
DROP POLICY IF EXISTS "Students update own teacher messages" ON public.teacher_messages;
DROP POLICY IF EXISTS "Teachers manage teacher messages" ON public.teacher_messages;
DROP POLICY IF EXISTS "Admins manage teacher messages" ON public.teacher_messages;

CREATE POLICY "Students read own teacher messages" ON public.teacher_messages
  FOR SELECT TO authenticated
  USING (public.owns_session(session_id));

CREATE POLICY "Students update own teacher messages" ON public.teacher_messages
  FOR UPDATE TO authenticated
  USING (public.owns_session(session_id));

CREATE POLICY "Teachers manage teacher messages" ON public.teacher_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'DOCENT'))
  WITH CHECK (public.has_role(auth.uid(), 'DOCENT'));

CREATE POLICY "Admins manage teacher messages" ON public.teacher_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
