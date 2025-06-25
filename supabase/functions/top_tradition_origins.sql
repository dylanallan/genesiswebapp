create or replace function top_tradition_origins(limit integer)
returns table(origin text, count integer)
language sql as $$
  select origin, count(*)
  from traditions
  where origin is not null and origin <> ''
  group by origin
  order by count desc
  limit $1;
$$; 