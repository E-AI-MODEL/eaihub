CREATE TABLE public.ssot_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL,
  previous_plugin_id uuid,
  school_id text NOT NULL,
  action text NOT NULL,
  performed_by uuid NOT NULL,
  change_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ssot_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superusers manage ssot_changes"
  ON public.ssot_changes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'SUPERUSER'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'SUPERUSER'::app_role));

CREATE POLICY "Admins read ssot_changes"
  ON public.ssot_changes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));