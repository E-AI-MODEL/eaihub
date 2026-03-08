
-- ═══════════════════════════════════════════════════════════
-- FIX: Convert RESTRICTIVE RLS policies to PERMISSIVE
-- PostgreSQL requires at least one PERMISSIVE policy per table
-- for any access to be granted. RESTRICTIVE policies only
-- further restrict access already granted by PERMISSIVE ones.
-- ═══════════════════════════════════════════════════════════

-- ══ PROFILES ══
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins and teachers can read all profiles" ON public.profiles;
CREATE POLICY "Admins and teachers can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'DOCENT'::app_role));

-- ══ USER_ROLES ══
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read roles" ON public.user_roles;
CREATE POLICY "Admins read roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Superusers manage roles" ON public.user_roles;
CREATE POLICY "Superusers manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'SUPERUSER'::app_role)) WITH CHECK (has_role(auth.uid(), 'SUPERUSER'::app_role));

-- ══ STUDENT_SESSIONS ══
DROP POLICY IF EXISTS "Students read own sessions" ON public.student_sessions;
CREATE POLICY "Students read own sessions" ON public.student_sessions FOR SELECT TO authenticated USING (user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Students insert own sessions" ON public.student_sessions;
CREATE POLICY "Students insert own sessions" ON public.student_sessions FOR INSERT TO authenticated WITH CHECK (user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Students update own sessions" ON public.student_sessions;
CREATE POLICY "Students update own sessions" ON public.student_sessions FOR UPDATE TO authenticated USING (user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Teachers read all sessions" ON public.student_sessions;
CREATE POLICY "Teachers read all sessions" ON public.student_sessions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'DOCENT'::app_role));

DROP POLICY IF EXISTS "Admins manage all sessions" ON public.student_sessions;
CREATE POLICY "Admins manage all sessions" ON public.student_sessions FOR ALL TO authenticated USING (has_role(auth.uid(), 'ADMIN'::app_role)) WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- ══ CHAT_MESSAGES ══
DROP POLICY IF EXISTS "Students read own messages" ON public.chat_messages;
CREATE POLICY "Students read own messages" ON public.chat_messages FOR SELECT TO authenticated USING (owns_session(session_id));

DROP POLICY IF EXISTS "Students insert own messages" ON public.chat_messages;
CREATE POLICY "Students insert own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (owns_session(session_id));

DROP POLICY IF EXISTS "Teachers read all messages" ON public.chat_messages;
CREATE POLICY "Teachers read all messages" ON public.chat_messages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'DOCENT'::app_role));

DROP POLICY IF EXISTS "Admins manage all messages" ON public.chat_messages;
CREATE POLICY "Admins manage all messages" ON public.chat_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'ADMIN'::app_role)) WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- ══ TEACHER_MESSAGES ══
DROP POLICY IF EXISTS "Students read own teacher messages" ON public.teacher_messages;
CREATE POLICY "Students read own teacher messages" ON public.teacher_messages FOR SELECT TO authenticated USING (owns_session(session_id));

DROP POLICY IF EXISTS "Students update own teacher messages" ON public.teacher_messages;
CREATE POLICY "Students update own teacher messages" ON public.teacher_messages FOR UPDATE TO authenticated USING (owns_session(session_id));

DROP POLICY IF EXISTS "Teachers manage teacher messages" ON public.teacher_messages;
CREATE POLICY "Teachers manage teacher messages" ON public.teacher_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'DOCENT'::app_role)) WITH CHECK (has_role(auth.uid(), 'DOCENT'::app_role));

DROP POLICY IF EXISTS "Admins manage teacher messages" ON public.teacher_messages;
CREATE POLICY "Admins manage teacher messages" ON public.teacher_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'ADMIN'::app_role)) WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- ══ MASTERY ══
DROP POLICY IF EXISTS "Students read own mastery" ON public.mastery;
CREATE POLICY "Students read own mastery" ON public.mastery FOR SELECT TO authenticated USING (user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Students insert own mastery" ON public.mastery;
CREATE POLICY "Students insert own mastery" ON public.mastery FOR INSERT TO authenticated WITH CHECK (user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Students update own mastery" ON public.mastery;
CREATE POLICY "Students update own mastery" ON public.mastery FOR UPDATE TO authenticated USING (user_id = (auth.uid())::text);

DROP POLICY IF EXISTS "Teachers read all mastery" ON public.mastery;
CREATE POLICY "Teachers read all mastery" ON public.mastery FOR SELECT TO authenticated USING (has_role(auth.uid(), 'DOCENT'::app_role));

DROP POLICY IF EXISTS "Admins manage all mastery" ON public.mastery;
CREATE POLICY "Admins manage all mastery" ON public.mastery FOR ALL TO authenticated USING (has_role(auth.uid(), 'ADMIN'::app_role)) WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- ══ SCHOOL_SSOT ══
DROP POLICY IF EXISTS "Superusers manage school_ssot" ON public.school_ssot;
CREATE POLICY "Superusers manage school_ssot" ON public.school_ssot FOR ALL TO authenticated USING (has_role(auth.uid(), 'SUPERUSER'::app_role)) WITH CHECK (has_role(auth.uid(), 'SUPERUSER'::app_role));

DROP POLICY IF EXISTS "Admins read school_ssot" ON public.school_ssot;
CREATE POLICY "Admins read school_ssot" ON public.school_ssot FOR SELECT TO authenticated USING (has_role(auth.uid(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Teachers read school_ssot" ON public.school_ssot;
CREATE POLICY "Teachers read school_ssot" ON public.school_ssot FOR SELECT TO authenticated USING (has_role(auth.uid(), 'DOCENT'::app_role));

-- ══ PLUGIN_ASSIGNMENTS ══
DROP POLICY IF EXISTS "Superuser manages assignments" ON public.plugin_assignments;
CREATE POLICY "Superuser manages assignments" ON public.plugin_assignments FOR ALL TO authenticated USING (has_role(auth.uid(), 'SUPERUSER'::app_role)) WITH CHECK (has_role(auth.uid(), 'SUPERUSER'::app_role));

DROP POLICY IF EXISTS "Users read own assignments" ON public.plugin_assignments;
CREATE POLICY "Users read own assignments" ON public.plugin_assignments FOR SELECT TO authenticated USING (assigned_to_user_id = auth.uid());

-- ══ SSOT_CHANGES ══
DROP POLICY IF EXISTS "Superusers manage ssot_changes" ON public.ssot_changes;
CREATE POLICY "Superusers manage ssot_changes" ON public.ssot_changes FOR ALL TO authenticated USING (has_role(auth.uid(), 'SUPERUSER'::app_role)) WITH CHECK (has_role(auth.uid(), 'SUPERUSER'::app_role));

DROP POLICY IF EXISTS "Admins read ssot_changes" ON public.ssot_changes;
CREATE POLICY "Admins read ssot_changes" ON public.ssot_changes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'ADMIN'::app_role));
