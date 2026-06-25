-- Golf ID MVP public profile storage
-- Run in Supabase SQL Editor before publishing the Golf ID MVP.

create table if not exists public.golf_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text not null,
  nickname text not null,
  best_score integer,
  average_score integer,
  target_score integer,
  head_speed numeric,
  golf_history text,
  favorite_club text,
  weak_club text,
  current_issue text,
  club_setting text,
  clubs jsonb,
  social_links jsonb not null default '{}'::jsonb,
  visibility jsonb not null default '{}'::jsonb,
  diagnosis_result jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.golf_profiles
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists username text,
  add column if not exists nickname text,
  add column if not exists best_score integer,
  add column if not exists average_score integer,
  add column if not exists target_score integer,
  add column if not exists head_speed numeric,
  add column if not exists golf_history text,
  add column if not exists favorite_club text,
  add column if not exists weak_club text,
  add column if not exists current_issue text,
  add column if not exists club_setting text,
  add column if not exists clubs jsonb,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists visibility jsonb not null default '{}'::jsonb,
  add column if not exists diagnosis_result jsonb,
  add column if not exists is_public boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists golf_profiles_username_lower_uidx
on public.golf_profiles (lower(username));

create index if not exists golf_profiles_user_id_idx
on public.golf_profiles (user_id);

create or replace function public.touch_golf_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists golf_profiles_touch_updated_at on public.golf_profiles;
create trigger golf_profiles_touch_updated_at
before update on public.golf_profiles
for each row execute function public.touch_golf_profiles_updated_at();

alter table public.golf_profiles enable row level security;

drop policy if exists "public read public golf profiles" on public.golf_profiles;
create policy "public read public golf profiles"
on public.golf_profiles
for select
to anon, authenticated
using (is_public = true);

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
with check (user_id = auth.uid());

drop policy if exists "authenticated update own golf profiles" on public.golf_profiles;
create policy "authenticated update own golf profiles"
on public.golf_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "authenticated delete own golf profiles" on public.golf_profiles;
create policy "authenticated delete own golf profiles"
on public.golf_profiles
for delete
to authenticated
using (user_id = auth.uid());
