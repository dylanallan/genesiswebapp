-- Fixes from the live-database audit. Add-only.
-- photo_analyses has an updated_at trigger but no such column, so any edit of a photo analysis failed.
alter table public.photo_analyses add column if not exists updated_at timestamptz default now();

-- A story linked to a person should lose the link (not point at nobody) when that person is removed.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cultural_stories_family_member_fk') then
    alter table public.cultural_stories
      add constraint cultural_stories_family_member_fk foreign key (family_member_id)
      references public.family_members(id) on delete set null not valid;
  end if;
end $$;
