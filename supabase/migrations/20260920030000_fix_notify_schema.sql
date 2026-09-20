-- pg_net's functions do not always live in the schema the CREATE EXTENSION
-- statement asked for (an existing install keeps its own). Resolve the schema
-- at call time instead of hard-coding it, so the notification fires wherever
-- the extension happens to be.

create or replace function public.notify_enquiry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  endpoint text;
  secret text;
  net_schema text;
begin
  select value into endpoint from public.app_config where key = 'functions_url';
  select value into secret from public.app_config where key = 'webhook_secret';

  if endpoint is null or endpoint = '' then
    return new;
  end if;

  select n.nspname into net_schema
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where p.proname = 'http_post'
  limit 1;

  if net_schema is null then
    raise warning 'pg_net is not installed; enquiry notification skipped';
    return new;
  end if;

  execute format(
    'select %I.http_post(url := $1, headers := $2, body := $3, timeout_milliseconds := 5000)',
    net_schema
  )
  using
    endpoint || '/notify-enquiry',
    jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', coalesce(secret, '')),
    jsonb_build_object('record', to_jsonb(new));

  return new;
exception
  when others then
    raise warning 'enquiry notification failed: %', sqlerrm;
    return new;
end;
$$;

create or replace function public.notification_health()
returns table (sent_at timestamptz, status integer, error text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  net_schema text;
begin
  select n.nspname into net_schema
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = '_http_response'
  limit 1;

  if net_schema is null then
    return;
  end if;

  return query execute format(
    'select r.created, r.status_code, r.error_msg from %I._http_response r order by r.created desc limit 10',
    net_schema
  );
end;
$$;

revoke execute on function public.notification_health() from public;
grant execute on function public.notification_health() to authenticated;
