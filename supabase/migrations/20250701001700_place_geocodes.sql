-- Shared cache of place-name coordinates for the family map. Holds only place names (no people or users),
-- and is read and written by the geocode-places Edge Function only.
create table if not exists public.place_geocodes (
  place_key text primary key,          -- lower-cased, trimmed place text
  place text not null,
  lat double precision,                -- null = looked up but not found
  lon double precision,
  display_name text,
  country_code text,
  looked_up_at timestamptz not null default now()
);
alter table public.place_geocodes enable row level security;
-- No policies: only the service role (Edge Functions) can read or write it.
