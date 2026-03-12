-- Allow admins to insert DOCENT roles within their school
CREATE POLICY "Admins assign DOCENT role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'ADMIN'::app_role)
  AND role = 'DOCENT'
);

-- Allow admins to delete DOCENT roles
CREATE POLICY "Admins revoke DOCENT role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'ADMIN'::app_role)
  AND role = 'DOCENT'
);