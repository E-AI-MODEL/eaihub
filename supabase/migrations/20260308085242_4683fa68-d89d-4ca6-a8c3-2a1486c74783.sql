-- Trigger function: auto-assign roles + create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Bootstrap admin for vis@emmauscollege.nl
  IF NEW.email = 'vis@emmauscollege.nl' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'ADMIN')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'DOCENT')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();