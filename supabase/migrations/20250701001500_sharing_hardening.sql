-- Hardening for family sharing (review findings). Add-only, safe on the live project.

-- 1. Strangers have no role (NULL); "NULL not in (...)" is NULL, which IF treats as false. Compare safely.
create or replace function public.add_shared_story(p_owner uuid, p_title text, p_content text, p_storyteller text default null, p_member uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
begin
  if coalesce(public._share_role(p_owner), '') not in ('owner', 'contributor') then
    raise exception 'You can view this family but not add to it' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_content), '') = '' then raise exception 'Please add a title and the story'; end if;
  insert into public.cultural_stories (user_id, title, content, storyteller, family_member_id, verification_details)
  values (p_owner, left(p_title, 200), left(p_content, 20000), p_storyteller, p_member,
          jsonb_build_object('contributed_by', public._display_name(auth.uid())))
  returning id into new_id;
  return new_id;
end;
$$;

-- 2. Owners may create invites and change an invite's role or revoke it, but never attach a member themselves
--    (only the invitee can, by accepting). Enforced with a trigger so the existing policy can stay in place.
create or replace function public._guard_family_share()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.member_id := null;
    new.status := 'pending';
    new.accepted_at := null;
    return new;
  end if;
  -- Updates made while signed in as the owner: role changes and revoking only.
  if auth.uid() is not null and auth.uid() = old.owner_id then
    if new.member_id is distinct from old.member_id or new.owner_id is distinct from old.owner_id
       or new.token is distinct from old.token or new.accepted_at is distinct from old.accepted_at
       or (new.status is distinct from old.status and new.status <> 'revoked') then
      raise exception 'Only the role can be changed, or access removed' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

do $do$ begin
  if not exists (select 1 from pg_trigger where tgname = 'family_shares_guard' and tgrelid = 'public.family_shares'::regclass) then
    create trigger family_shares_guard before insert or update on public.family_shares
      for each row execute function public._guard_family_share();
  end if;
end $do$;

-- One active link per owner and relative, so a relative's role is never ambiguous.
create unique index if not exists family_shares_one_active_member
  on public.family_shares (owner_id, member_id) where status = 'active';

-- Accepting a second invite from the same family keeps the existing membership.
create or replace function public.accept_family_invite(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.family_shares;
  existing public.family_shares;
begin
  if auth.uid() is null then raise exception 'Please sign in first' using errcode = '42501'; end if;
  select * into s from public.family_shares where token = p_token for update;
  if not found or s.status = 'revoked' then raise exception 'This invite link is no longer valid'; end if;
  if s.owner_id = auth.uid() then raise exception 'This is your own invite link. Send it to a relative.'; end if;
  if s.status = 'active' and s.member_id <> auth.uid() then raise exception 'This invite link has already been used'; end if;
  select * into existing from public.family_shares
    where owner_id = s.owner_id and member_id = auth.uid() and status = 'active' and id <> s.id limit 1;
  if found then
    return jsonb_build_object('owner_id', existing.owner_id, 'owner_name', public._display_name(existing.owner_id), 'role', existing.role);
  end if;
  update public.family_shares set member_id = auth.uid(), status = 'active', accepted_at = coalesce(accepted_at, now())
    where id = s.id returning * into s;
  return jsonb_build_object('owner_id', s.owner_id, 'owner_name', public._display_name(s.owner_id), 'role', s.role);
end;
$$;

-- 3. Lets the join page ask "Join Rosa's family?" before anything is accepted.
create or replace function public.preview_family_invite(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  s public.family_shares;
begin
  if auth.uid() is null then raise exception 'Please sign in first' using errcode = '42501'; end if;
  select * into s from public.family_shares where token = p_token;
  if not found or s.status = 'revoked' or (s.status = 'active' and s.member_id <> auth.uid()) then
    raise exception 'This invite link is no longer valid';
  end if;
  return jsonb_build_object('owner_name', public._display_name(s.owner_id), 'role', s.role,
                            'own', s.owner_id = auth.uid(), 'joined', s.member_id = auth.uid());
end;
$$;

revoke all on function public.preview_family_invite(text) from public, anon;
grant execute on function public.preview_family_invite(text) to authenticated;
revoke all on function public._guard_family_share() from public, anon, authenticated;
