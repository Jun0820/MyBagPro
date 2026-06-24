-- Golf ID public profile storage
-- Run this in the Supabase SQL Editor before enabling /create in production.

create table if not exists public.golf_ids (
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
  visibility jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists golf_ids_username_lower_uidx
on public.golf_ids (lower(username));

create index if not exists golf_ids_user_id_idx
on public.golf_ids (user_id);

create or replace function public.touch_golf_ids_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists golf_ids_touch_updated_at on public.golf_ids;
create trigger golf_ids_touch_updated_at
before update on public.golf_ids
for each row execute function public.touch_golf_ids_updated_at();

alter table public.golf_ids enable row level security;

drop policy if exists "public read public golf ids" on public.golf_ids;
create policy "public read public golf ids"
on public.golf_ids
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "authenticated read own golf ids" on public.golf_ids;
create policy "authenticated read own golf ids"
on public.golf_ids
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "authenticated insert own golf ids" on public.golf_ids;
create policy "authenticated insert own golf ids"
on public.golf_ids
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "authenticated update own golf ids" on public.golf_ids;
create policy "authenticated update own golf ids"
on public.golf_ids
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "authenticated delete own golf ids" on public.golf_ids;
create policy "authenticated delete own golf ids"
on public.golf_ids
for delete
to authenticated
using (user_id = auth.uid());
