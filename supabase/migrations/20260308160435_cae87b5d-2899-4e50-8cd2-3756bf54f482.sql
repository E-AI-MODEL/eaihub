
-- School SSOT plugin overlay table
CREATE TABLE public.school_ssot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL,
  school_name text NOT NULL,
  based_on_version text NOT NULL,
  plugin_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_hash text,
  is_active boolean NOT NULL DEFAULT false,
  change_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.school_ssot ENABLE ROW LEVEL SECURITY;

-- Admins: full CRUD
CREATE POLICY "Admins manage school_ssot"
  ON public.school_ssot FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- Teachers: read-only
CREATE POLICY "Teachers read school_ssot"
  ON public.school_ssot FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'DOCENT'));

-- updated_at trigger
CREATE TRIGGER update_school_ssot_updated_at
  BEFORE UPDATE ON public.school_ssot
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
