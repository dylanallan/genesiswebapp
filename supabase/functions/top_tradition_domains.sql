create or replace function top_tradition_domains(limit integer)
returns table(historical_context text, count integer)
language sql as $$
  select historical_context, count(*)
  from traditions
  where historical_context is not null and historical_context <> ''
  group by historical_context
  order by count desc
  limit $1;
$$; 