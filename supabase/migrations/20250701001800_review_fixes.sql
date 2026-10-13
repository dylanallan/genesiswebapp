-- Fixes from code review: atomic "add a parent", quota refunds, and a global rate limit for place lookups.

-- Adds a father or mother to someone in one step, so quick repeated adds or two open tabs never lose a link.
-- Runs with the caller's own permissions (row-level security applies), so it can only touch their own tree.
create or replace function public.add_parent(
  p_child uuid, p_role text, p_first text, p_middle text default null, p_last text default '',
  p_birth_date date default null, p_birth_place text default null
) returns uuid language plpgsql security invoker set search_path = public as $$
declare
  child public.family_members;
  other public.family_members;
  new_id uuid := gen_random_uuid();
  siblings uuid[];
begin
  if p_role not in ('father', 'mother') then raise exception 'Unknown role'; end if;
  if coalesce(trim(p_first), '') = '' then raise exception 'Please enter a name'; end if;
  select * into child from public.family_members where id = p_child for update;
  if not found then raise exception 'That person was not found'; end if;
  if coalesce(array_length(child.parent_ids, 1), 0) >= 2 then raise exception 'This person already has two parents'; end if;

  select * into other from public.family_members where id = any(child.parent_ids) limit 1;
  -- Children of the other parent are this parent's children too.
  siblings := array(select distinct x from unnest(array[p_child] || coalesce(other.children_ids, '{}')) x);

  insert into public.family_members (id, first_name, middle_name, last_name, gender, birth_date, birth_location,
                                     children_ids, spouse_ids, parent_ids, source, confidence, is_living)
  values (new_id, trim(p_first), nullif(trim(p_middle), ''), coalesce(trim(p_last), ''),
          case when p_role = 'father' then 'male' else 'female' end, p_birth_date, nullif(trim(p_birth_place), ''),
          siblings, case when other.id is null then '{}' else array[other.id] end, '{}', 'user', 100,
          -- Someone born over 100 years ago (or the parent of someone born over 60 years ago) is very likely not living.
          coalesce(p_birth_date > current_date - interval '100 years', child.birth_date > current_date - interval '60 years', true));

  update public.family_members set parent_ids = array_append(parent_ids, new_id) where id = any(siblings) and not (new_id = any(parent_ids));
  if other.id is not null then
    update public.family_members set spouse_ids = array_append(spouse_ids, new_id) where id = other.id and not (new_id = any(spouse_ids));
  end if;
  return new_id;
end;
$$;
revoke all on function public.add_parent(uuid, text, text, text, text, date, text) from public, anon;
grant execute on function public.add_parent(uuid, text, text, text, text, date, text) to authenticated;

-- Gives back one use when the work failed (e.g. the photo service refused), so people aren't charged for errors.
create or replace function public.refund_daily_quota(p_user uuid, p_kind text)
returns void language sql security definer set search_path = public as $$
  update public.daily_usage set count = greatest(count - 1, 0) where user_id = p_user and kind = p_kind and day = current_date;
$$;
revoke all on function public.refund_daily_quota(uuid, text) from public, anon, authenticated;
grant execute on function public.refund_daily_quota(uuid, text) to service_role;

-- OpenStreetMap allows at most one lookup per second from us in total, across all users.
create table if not exists public.rate_slots (name text primary key, last_at timestamptz not null default 'epoch');
alter table public.rate_slots enable row level security;
insert into public.rate_slots (name) values ('nominatim') on conflict do nothing;

create or replace function public.claim_rate_slot(p_name text, p_gap_ms integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  claimed boolean;
begin
  update public.rate_slots set last_at = clock_timestamp()
    where name = p_name and last_at <= clock_timestamp() - make_interval(secs => p_gap_ms / 1000.0)
    returning true into claimed;
  return coalesce(claimed, false);
end;
$$;
revoke all on function public.claim_rate_slot(text, integer) from public, anon, authenticated;
grant execute on function public.claim_rate_slot(text, integer) to service_role;
