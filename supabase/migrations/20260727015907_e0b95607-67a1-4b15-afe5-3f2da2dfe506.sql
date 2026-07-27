DROP POLICY IF EXISTS "Plugin catalog is public" ON public.model_plugins;
REVOKE SELECT ON public.model_plugins FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_plugins TO authenticated;
GRANT ALL ON public.model_plugins TO service_role;
CREATE POLICY "Admins read plugins" ON public.model_plugins FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
REVOKE EXECUTE ON FUNCTION public.refresh_plugin_weekly_scores() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;