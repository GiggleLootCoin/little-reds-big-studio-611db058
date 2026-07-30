REVOKE EXECUTE ON FUNCTION public.refresh_plugin_weekly_scores() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_plugin_weekly_scores() TO service_role;