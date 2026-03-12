
CREATE TABLE public.role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role public.app_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_duplicate_pending UNIQUE (user_id, requested_role, status)
);

ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Users read own requests
CREATE POLICY "Users read own requests" ON public.role_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users insert own requests (only DOCENT or ADMIN)
CREATE POLICY "Users insert own requests" ON public.role_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND requested_role IN ('DOCENT'::public.app_role, 'ADMIN'::public.app_role));

-- Admins read all requests (for review)
CREATE POLICY "Admins read requests" ON public.role_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::public.app_role));

-- Admins update DOCENT requests only
CREATE POLICY "Admins review DOCENT requests" ON public.role_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::public.app_role) AND requested_role = 'DOCENT'::public.app_role);

-- Superusers manage all requests
CREATE POLICY "Superusers manage all requests" ON public.role_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'SUPERUSER'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'SUPERUSER'::public.app_role));
