-- A. Update has_role() with SUPERUSER implication
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'SUPERUSER')
  )
$$;

-- B. Drop all 28 RESTRICTIVE policies and recreate as PERMISSIVE

-- === plugin_assignments ===
DROP POLICY IF EXISTS "Superuser manages assignments" ON public.plugin_assignments;
DROP POLICY IF EXISTS "Users read own assignments" ON public.plugin_assignments;

CREATE POLICY "Superuser manages assignments" ON public.plugin_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'SUPERUSER'))
  WITH CHECK (has_role(auth.uid(), 'SUPERUSER'));

CREATE POLICY "Users read own assignments" ON public.plugin_assignments
  FOR SELECT TO authenticated
  USING (assigned_to_user_id = auth.uid());

-- === school_ssot ===
DROP POLICY IF EXISTS "Admins manage school_ssot" ON public.school_ssot;
DROP POLICY IF EXISTS "Teachers read school_ssot" ON public.school_ssot;

CREATE POLICY "Admins manage school_ssot" ON public.school_ssot
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Teachers read school_ssot" ON public.school_ssot
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'DOCENT'));

-- === chat_messages ===
DROP POLICY IF EXISTS "Students read own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Students insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Teachers read all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins manage all messages" ON public.chat_messages;

CREATE POLICY "Students read own messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (owns_session(session_id));

CREATE POLICY "Students insert own messages" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (owns_session(session_id));

CREATE POLICY "Teachers read all messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'DOCENT'));

CREATE POLICY "Admins manage all messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'));

-- === student_sessions ===
DROP POLICY IF EXISTS "Students read own sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Students insert own sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Students update own sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Teachers read all sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "Admins manage all sessions" ON public.student_sessions;

CREATE POLICY "Students read own sessions" ON public.student_sessions
  FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Students insert own sessions" ON public.student_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Students update own sessions" ON public.student_sessions
  FOR UPDATE TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Teachers read all sessions" ON public.student_sessions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'DOCENT'));

CREATE POLICY "Admins manage all sessions" ON public.student_sessions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'));

-- === user_roles ===
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'));

-- === mastery ===
DROP POLICY IF EXISTS "Students read own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Students insert own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Students update own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Teachers read all mastery" ON public.mastery;
DROP POLICY IF EXISTS "Admins manage all mastery" ON public.mastery;

CREATE POLICY "Students read own mastery" ON public.mastery
  FOR SELECT TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Students insert own mastery" ON public.mastery
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.uid())::text);

CREATE POLICY "Students update own mastery" ON public.mastery
  FOR UPDATE TO authenticated
  USING (user_id = (auth.uid())::text);

CREATE POLICY "Teachers read all mastery" ON public.mastery
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'DOCENT'));

CREATE POLICY "Admins manage all mastery" ON public.mastery
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'));

-- === profiles ===
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and teachers can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins and teachers can read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'ADMIN') OR has_role(auth.uid(), 'DOCENT'));

-- === teacher_messages ===
DROP POLICY IF EXISTS "Students read own teacher messages" ON public.teacher_messages;
DROP POLICY IF EXISTS "Students update own teacher messages" ON public.teacher_messages;
DROP POLICY IF EXISTS "Teachers manage teacher messages" ON public.teacher_messages;
DROP POLICY IF EXISTS "Admins manage teacher messages" ON public.teacher_messages;

CREATE POLICY "Students read own teacher messages" ON public.teacher_messages
  FOR SELECT TO authenticated
  USING (owns_session(session_id));

CREATE POLICY "Students update own teacher messages" ON public.teacher_messages
  FOR UPDATE TO authenticated
  USING (owns_session(session_id));

CREATE POLICY "Teachers manage teacher messages" ON public.teacher_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'DOCENT'))
  WITH CHECK (has_role(auth.uid(), 'DOCENT'));

CREATE POLICY "Admins manage teacher messages" ON public.teacher_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'));