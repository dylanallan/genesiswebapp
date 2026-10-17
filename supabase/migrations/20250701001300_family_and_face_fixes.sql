-- Found by testing every screen against the live project as a signed-in user.
-- Older projects' family_members lacks is_living (the family tree writes it), so adding a person failed.
alter table public.family_members add column if not exists is_living boolean not null default true;

-- Naming a face again updates it: the app upserts on (user_id, face_id). Fresh projects have that as the
-- primary key; older projects only had a global unique face_id, so give them the matching unique index too.
create unique index if not exists face_names_user_face_idx on public.face_names (user_id, face_id);
