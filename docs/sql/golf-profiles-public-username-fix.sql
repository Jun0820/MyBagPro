-- Golf ID public page reliability fix
-- Run this in Supabase SQL Editor if /u/<username> cannot find an existing Golf ID.

update public.golf_profiles
set
  username = lower(trim(username)),
  visibility = coalesce(visibility, '{}'::jsonb),
  is_public = coalesce(is_public, true)
where username is not null;

alter table public.golf_profiles
  alter column username set not null,
  alter column nickname set not null,
  alter column visibility set default '{}'::jsonb,
  alter column is_public set default true;

create unique index if not exists golf_profiles_username_lower_uidx
on public.golf_profiles (lower(username));

alter table public.golf_profiles enable row level security;

drop policy if exists "public read public golf profiles" on public.golf_profiles;
create policy "public read public golf profiles"
on public.golf_profiles
for select
to anon, authenticated
using (coalesce(is_public, true) = true);

drop policy if exists "authenticated read own golf profiles" on public.golf_profiles;
create policy "authenticated read own golf profiles"
on public.golf_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "authenticated insert own golf profiles" on public.golf_profiles;
create policy "authenticated insert own golf profiles"
on public.golf_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and username = lower(trim(username))
);

drop policy if exists "authenticated update own golf profiles" on public.golf_profiles;
create policy "authenticated update own golf profiles"
on public.golf_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and username = lower(trim(username))
);
