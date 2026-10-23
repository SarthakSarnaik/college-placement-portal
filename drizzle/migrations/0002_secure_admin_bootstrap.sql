-- Migration 0002: Secure First Administrator Bootstrap & Hardened User Creation
-- Ensures that no public signup is ever automatically assigned the administrator role.
-- Provides a controlled, secure bootstrap stored procedure that can only be executed by
-- the PostgreSQL service_role (e.g. Supabase SQL editor) or an authorized administrator.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  -- Strictly assign the student role to all new registrations.
  -- Administrative privileges must NEVER be assigned automatically on public signup.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END $$;

-- Secure bootstrap procedure for the initial Placement Officer / Administrator.
-- Execution is guarded: only callable via service_role (direct database / SQL editor) or by existing admins.
CREATE OR REPLACE FUNCTION public.bootstrap_admin_by_email(_target_email text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _target_id uuid;
BEGIN
  -- Strict permission guard: block normal authenticated students and anonymous users
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access Denied: Only a database administrator via Supabase SQL Editor or an existing administrator can bootstrap staff privileges.';
  END IF;

  SELECT id INTO _target_id
  FROM auth.users
  WHERE lower(email) = lower(trim(_target_email));

  IF _target_id IS NULL THEN
    RAISE EXCEPTION 'User with email % was not found in auth.users. Please ensure the user has signed up first.', _target_email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_id, 'admin'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN true;
END $$;

-- Grant execution to authenticated and service_role, with security check handled inside procedure
GRANT EXECUTE ON FUNCTION public.bootstrap_admin_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin_by_email(text) TO service_role;
