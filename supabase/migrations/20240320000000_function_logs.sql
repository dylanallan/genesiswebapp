-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create function_logs table
create table if not exists function_logs (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz not null default now(),
  level text not null,
  function text not null,
  message text not null,
  metadata jsonb,
  error jsonb,
  environment text not null,
  created_at timestamptz not null default now()
);

-- Create indexes for common queries
create index if not exists function_logs_timestamp_idx on function_logs(timestamp);
create index if not exists function_logs_level_idx on function_logs(level);
create index if not exists function_logs_function_idx on function_logs(function);
create index if not exists function_logs_environment_idx on function_logs(environment);

-- Add RLS policies
alter table function_logs enable row level security;

create policy "Service role can do everything"
  on function_logs
  for all
  to service_role
  using (true)
  with check (true);

create policy "Authenticated users can read logs"
  on function_logs
  for select
  to authenticated
  using (true);

-- Create a function to clean up old logs
create or replace function cleanup_old_logs(days_to_keep integer default 30)
returns void
language plpgsql
security definer
as $$
begin
  delete from function_logs
  where timestamp < now() - (days_to_keep || ' days')::interval;
end;
$$;

-- Create a scheduled job to clean up old logs (runs daily)
select cron.schedule(
  'cleanup-old-logs',
  '0 0 * * *', -- Run at midnight every day
  $$
  select cleanup_old_logs(30);
  $$
); 