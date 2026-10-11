-- Edge Functions read settings that are not set as function secrets from here (see _shared/runtime-config.ts):
-- Vault secrets whose names look like environment variables (e.g. GEMINI_API_KEY), plus the non-secret
-- allowed_origins / site_url app settings. Only the service role may call it.
create or replace function public.get_runtime_config()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb := '{}'::jsonb;
begin
  if to_regclass('vault.decrypted_secrets') is not null then
    execute $q$select coalesce(jsonb_object_agg(name, decrypted_secret), '{}'::jsonb)
               from vault.decrypted_secrets where name ~ '^[A-Z][A-Z0-9_]*$'$q$ into result;
  end if;
  select result || coalesce(jsonb_object_agg(upper(key), value #>> '{}'), '{}'::jsonb) into result
  from public.app_settings where key in ('allowed_origins', 'site_url') and coalesce(value #>> '{}', '') <> '';
  return result;
end;
$$;
revoke all on function public.get_runtime_config() from public, anon, authenticated;
grant execute on function public.get_runtime_config() to service_role;

insert into public.app_settings (key, value, category, data_type, description) values
  ('allowed_origins', '""'::jsonb, 'site', 'string', 'Comma-separated web addresses allowed to call the backend (e.g. https://your-domain.com)'),
  ('site_url', '""'::jsonb, 'site', 'string', 'Main web address, used for PayPal return links')
on conflict (key) do nothing;
