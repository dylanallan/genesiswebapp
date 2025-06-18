-- Create function_metrics table
create table if not exists public.function_metrics (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz not null,
  metrics jsonb not null,
  created_at timestamptz default now() not null
);

-- Create indexes
create index if not exists function_metrics_timestamp_idx 
  on public.function_metrics (timestamp desc);

create index if not exists function_metrics_metrics_idx 
  on public.function_metrics using gin (metrics);

-- Set up RLS
alter table public.function_metrics enable row level security;

-- Create policies
create policy "Allow service role to manage metrics"
  on public.function_metrics
  for all
  to service_role
  using (true)
  with check (true);

create policy "Allow authenticated users to read metrics"
  on public.function_metrics
  for select
  to authenticated
  using (true);

-- Create function to clean up old metrics
create or replace function public.cleanup_old_metrics()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete metrics older than 30 days
  delete from public.function_metrics
  where timestamp < now() - interval '30 days';
end;
$$;

-- Create scheduled job to clean up old metrics
select cron.schedule(
  'cleanup-old-metrics', -- job name
  '0 0 * * *',          -- every day at midnight
  $$select public.cleanup_old_metrics()$$
);

-- Create view for function metrics summary
create or replace view public.function_metrics_summary as
with latest_metrics as (
  select distinct on (function_name)
    timestamp,
    function_name,
    metrics->'functions'->function_name as function_metrics
  from public.function_metrics,
  jsonb_object_keys(metrics->'functions') as function_name
  order by function_name, timestamp desc
)
select
  timestamp,
  function_name,
  function_metrics->'requests'->>'total' as total_requests,
  function_metrics->'requests'->>'success' as successful_requests,
  function_metrics->'requests'->>'error' as error_requests,
  function_metrics->'performance'->>'avgResponseTime' as avg_response_time,
  function_metrics->'performance'->>'p95ResponseTime' as p95_response_time,
  function_metrics->'performance'->>'p99ResponseTime' as p99_response_time,
  function_metrics->'resources'->>'memory' as avg_memory_mb,
  function_metrics->'resources'->>'cpu' as avg_cpu_percent,
  function_metrics->'costs'->>'total' as total_cost
from latest_metrics;

-- Create view for cost summary
create or replace view public.function_cost_summary as
with cost_data as (
  select
    date_trunc('hour', timestamp) as hour,
    metrics->'costs'->>'total' as total_cost,
    metrics->'costs'->'byProvider' as provider_costs,
    metrics->'costs'->'byFunction' as function_costs
  from public.function_metrics
  where timestamp >= now() - interval '7 days'
),
provider_costs_sums as (
  select
    hour,
    provider,
    sum((provider_cost)::numeric) as total
  from cost_data,
    jsonb_each_text(provider_costs) as provider_costs(provider, provider_cost)
  group by hour, provider
),
function_costs_sums as (
  select
    hour,
    function_name,
    sum((function_cost)::numeric) as total
  from cost_data,
    jsonb_each_text(function_costs) as function_costs(function_name, function_cost)
  group by hour, function_name
)
select
  c.hour,
  sum(c.total_cost::numeric) as total_cost,
  jsonb_object_agg(pc.provider, pc.total) as provider_costs,
  jsonb_object_agg(fc.function_name, fc.total) as function_costs
from cost_data c
left join provider_costs_sums pc on c.hour = pc.hour
left join function_costs_sums fc on c.hour = fc.hour
group by c.hour
order by c.hour desc;

-- Create view for resource usage summary
create or replace view public.function_resource_summary as
with resource_data as (
  select
    date_trunc('hour', timestamp) as hour,
    metrics->'resources'->'memory' as memory_usage,
    metrics->'resources'->'cpu' as cpu_usage,
    metrics->'resources'->'requests' as request_counts
  from public.function_metrics
  where timestamp >= now() - interval '7 days'
),
requests_by_function_sums as (
  select
    hour,
    function_name,
    sum((count)::numeric) as total
  from resource_data,
    jsonb_each_text(request_counts->'byFunction') as function_counts(function_name, count)
  group by hour, function_name
)
select
  r.hour,
  avg((r.memory_usage->>'used')::numeric) as avg_memory_used,
  max((r.memory_usage->>'used')::numeric) as max_memory_used,
  avg((r.cpu_usage->>'usage')::numeric) as avg_cpu_usage,
  max((r.cpu_usage->>'usage')::numeric) as max_cpu_usage,
  sum((r.request_counts->>'total')::numeric) as total_requests,
  jsonb_object_agg(f.function_name, f.total) as requests_by_function
from resource_data r
left join requests_by_function_sums f on r.hour = f.hour
group by r.hour
order by r.hour desc;

-- Grant access to views
grant select on public.function_metrics_summary to authenticated;
grant select on public.function_cost_summary to authenticated;
grant select on public.function_resource_summary to authenticated; 