-- Email on every new enquiry.
--
-- Rather than the dashboard's generated webhook (which stores a key inside the
-- trigger definition), the trigger below reads its endpoint and shared secret
-- from app_config at call time. Nothing secret is ever written into a migration
-- file, and the values can be rotated with an UPDATE.
--
-- scripts/setup-notifications.mjs fills those two rows in.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_enquiry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  endpoint text;
  secret text;
begin
  select value into endpoint from public.app_config where key = 'functions_url';
  select value into secret from public.app_config where key = 'webhook_secret';

  -- Not configured yet: the enquiry is already saved, which is what matters.
  if endpoint is null or endpoint = '' then
    return new;
  end if;

  perform extensions.http_post(
    url := endpoint || '/notify-enquiry',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(secret, '')
    ),
    body := jsonb_build_object('record', to_jsonb(new)),
    timeout_milliseconds := 5000
  );

  return new;
exception
  -- Never let a notification problem stop an enquiry being saved.
  when others then
    raise warning 'enquiry notification failed: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists enquiries_notify on public.enquiries;
create trigger enquiries_notify
  after insert on public.enquiries
  for each row execute function public.notify_enquiry();

-- Lets an admin see whether notifications are actually being delivered,
-- without going to the Supabase dashboard.
create or replace function public.notification_health()
returns table (sent_at timestamptz, status integer, error text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.created, r.status_code, r.error_msg
  from net._http_response r
  order by r.created desc
  limit 10;
$$;

revoke execute on function public.notification_health() from public;
grant execute on function public.notification_health() to authenticated;
