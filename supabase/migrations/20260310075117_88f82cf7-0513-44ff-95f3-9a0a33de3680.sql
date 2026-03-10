REVOKE EXECUTE ON FUNCTION public.get_subscription_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO authenticated;