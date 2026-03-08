
-- 2. Update handle_new_user trigger to also assign SUPERUSER to vis@emmauscollege.nl
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Always assign LEERLING role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'LEERLING')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Bootstrap superuser + admin + docent for vis@emmauscollege.nl
  IF NEW.email = 'vis@emmauscollege.nl' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'SUPERUSER')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'ADMIN')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'DOCENT')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Create plugin_assignments table
CREATE TABLE public.plugin_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid NOT NULL REFERENCES public.school_ssot(id) ON DELETE CASCADE,
  school_id text NOT NULL,
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to_role public.app_role,
  is_enabled boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- XOR: exactly one target type per assignment
  CONSTRAINT exactly_one_target CHECK (
    (assigned_to_user_id IS NOT NULL AND assigned_to_role IS NULL) OR
    (assigned_to_user_id IS NULL AND assigned_to_role IS NOT NULL)
  ),
  -- Only DOCENT and LEERLING can be role-based targets
  CONSTRAINT role_target_limit CHECK (
    assigned_to_role IS NULL OR assigned_to_role IN ('DOCENT', 'LEERLING')
  )
);

ALTER TABLE public.plugin_assignments ENABLE ROW LEVEL SECURITY;

-- SUPERUSER manages all assignments
CREATE POLICY "Superuser manages assignments"
  ON public.plugin_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'SUPERUSER'))
  WITH CHECK (has_role(auth.uid(), 'SUPERUSER'));

-- Users can read their own user-specific assignments
CREATE POLICY "Users read own assignments"
  ON public.plugin_assignments FOR SELECT TO authenticated
  USING (assigned_to_user_id = auth.uid());

-- Index for runtime resolution
CREATE INDEX idx_plugin_assignments_user ON public.plugin_assignments(assigned_to_user_id, is_enabled);
CREATE INDEX idx_plugin_assignments_role ON public.plugin_assignments(assigned_to_role, school_id, is_enabled);
