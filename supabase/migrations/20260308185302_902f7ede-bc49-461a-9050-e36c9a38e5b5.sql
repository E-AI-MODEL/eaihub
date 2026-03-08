-- ═══ user_roles: ADMIN ALL → SUPERUSER ALL + ADMIN SELECT ═══
DROP POLICY "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Superusers manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'SUPERUSER'::app_role))
  WITH CHECK (has_role(auth.uid(), 'SUPERUSER'::app_role));

CREATE POLICY "Admins read roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- ═══ school_ssot: ADMIN ALL → SUPERUSER ALL + ADMIN SELECT (DOCENT SELECT blijft) ═══
DROP POLICY "Admins manage school_ssot" ON public.school_ssot;

CREATE POLICY "Superusers manage school_ssot"
  ON public.school_ssot FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'SUPERUSER'::app_role))
  WITH CHECK (has_role(auth.uid(), 'SUPERUSER'::app_role));

CREATE POLICY "Admins read school_ssot"
  ON public.school_ssot FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'::app_role));