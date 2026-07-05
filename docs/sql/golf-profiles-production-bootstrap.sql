-- Golf ID production bootstrap
-- Apply this in the Supabase project used by golfid.jp before beta release.
-- It creates the public Golf ID profile table and the minimum RLS policies
-- required for /create and /u/<username>.

create table if not exists public.golf_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text not null,
  nickname text not null,
  bio text,
  avatar_url text,
  cover_image_url text,
  best_score integer,
  best_scores jsonb,
  average_score integer,
  target_score integer,
  head_speed numeric,
  golf_history text,
  frequent_area text,
  home_course text,
  role_title text,
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
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists cover_image_url text,
  add column if not exists best_score integer,
  add column if not exists best_scores jsonb,
  add column if not exists average_score integer,
  add column if not exists target_score integer,
  add column if not exists head_speed numeric,
  add column if not exists golf_history text,
  add column if not exists frequent_area text,
  add column if not exists home_course text,
  add column if not exists role_title text,
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

update public.golf_profiles
set
  username = lower(trim(username)),
  nickname = coalesce(nullif(trim(nickname), ''), username),
  social_links = coalesce(social_links, '{}'::jsonb),
  visibility = coalesce(visibility, '{}'::jsonb),
  is_public = coalesce(is_public, true)
where username is not null;

alter table public.golf_profiles
  alter column username set not null,
  alter column nickname set not null,
  alter column social_links set default '{}'::jsonb,
  alter column visibility set default '{}'::jsonb,
  alter column is_public set default true;

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

drop policy if exists "authenticated delete own golf profiles" on public.golf_profiles;
create policy "authenticated delete own golf profiles"
on public.golf_profiles
for delete
to authenticated
using (user_id = auth.uid());

-- Migrate existing MyBagPro public profiles into the production Golf ID table.
-- This keeps /u/<username>, /explore, and /admin on one canonical table after
-- the bootstrap is applied.
with source_profiles as (
  select
    p.id as profile_user_id,
    p.name,
    p.head_speed,
    p.golf_history,
    p.current_ball,
    p.sns_links,
    p.is_public,
    p.updated_at,
    coalesce(p.sns_links->'golfId', '{}'::jsonb) as golf_id
  from public.profiles p
  where coalesce(p.is_public, true) = true
),
normalized_profiles as (
  select
    profile_user_id,
    lower(
      trim(
        regexp_replace(
          coalesce(nullif(golf_id->>'username', ''), nullif(name, ''), profile_user_id::text),
          '[^a-zA-Z0-9_-]+',
          '-',
          'g'
        ),
        '-_'
      )
    ) as username,
    coalesce(nullif(golf_id->>'nickname', ''), nullif(name, ''), 'Golfer') as nickname,
    case
      when nullif(golf_id->>'best_score', '') ~ '^[0-9]+$' then (golf_id->>'best_score')::integer
      when nullif(sns_links->'bagSnapshot'->'profileStats'->>'bestScore', '') ~ '^[0-9]+$' then (sns_links->'bagSnapshot'->'profileStats'->>'bestScore')::integer
      else null
    end as best_score,
    case
      when nullif(golf_id->>'average_score', '') ~ '^[0-9]+$' then (golf_id->>'average_score')::integer
      when nullif(sns_links->'bagSnapshot'->'profileStats'->>'averageScore', '') ~ '^[0-9]+$' then (sns_links->'bagSnapshot'->'profileStats'->>'averageScore')::integer
      else null
    end as average_score,
    case
      when nullif(golf_id->>'target_score', '') ~ '^[0-9]+$' then (golf_id->>'target_score')::integer
      else null
    end as target_score,
    case
      when nullif(golf_id->>'head_speed', '') ~ '^[0-9]+(\.[0-9]+)?$' then (golf_id->>'head_speed')::numeric
      when head_speed::text ~ '^[0-9]+(\.[0-9]+)?$' then head_speed::numeric
      else null
    end as head_speed,
    coalesce(nullif(golf_id->>'golf_history', ''), golf_history) as golf_history,
    nullif(golf_id->>'favorite_club', '') as favorite_club,
    nullif(golf_id->>'weak_club', '') as weak_club,
    nullif(golf_id->>'current_issue', '') as current_issue,
    coalesce(
      nullif(golf_id->>'club_setting', ''),
      (
        select string_agg(
          nullif(trim(concat_ws(' ', club->>'number', club->>'brand', club->>'model')), ''),
          E'\n'
          order by ordinality
        )
        from jsonb_array_elements(coalesce(sns_links->'bagSnapshot'->'clubs', '[]'::jsonb)) with ordinality as club(club, ordinality)
      )
    ) as club_setting,
    null::jsonb as clubs,
    jsonb_strip_nulls(
      jsonb_build_object(
        'youtube', nullif(sns_links->>'youtube', ''),
        'instagram', nullif(sns_links->>'instagram', ''),
        'tiktok', nullif(sns_links->>'tiktok', ''),
        'x', nullif(sns_links->>'x', ''),
        'custom1', coalesce(sns_links->'custom1', (sns_links->'customLinks'->0)),
        'custom2', coalesce(sns_links->'custom2', (sns_links->'customLinks'->1))
      )
    ) as social_links,
    coalesce(golf_id->'visibility', '{}'::jsonb) as visibility,
    coalesce(
      golf_id->'diagnosis_result',
      jsonb_build_object(
        'diagnosisType', 'クラブ見直しタイプ',
        'currentStatus', '登録済みのクラブ、スコア、ヘッドスピードをもとに現在地を整理できます。',
        'priorityIssue', 'まずはGolf IDの項目を埋めて、クラブ構成と目標スコアを見比べましょう。',
        'nextAction', 'クラブセッティングとスコア目標を1ページにまとめ、次に見直す番手を明確にしましょう。',
        'notRecommendedNow', 'いきなり全クラブを買い替えるより、距離階段と苦手番手から確認しましょう。',
        'gearSuggestion', case when current_ball is not null then '使用ボール: ' || current_ball else 'クラブ構成の抜けや距離差を確認しましょう。' end
      )
    ) as diagnosis_result,
    coalesce(is_public, true) as is_public,
    coalesce(updated_at, now()) as updated_at
  from source_profiles
),
deduped_profiles as (
  select distinct on (lower(username))
    *
  from normalized_profiles
  where username is not null
    and username <> ''
  order by lower(username), updated_at desc
)
insert into public.golf_profiles (
  user_id,
  username,
  nickname,
  best_score,
  average_score,
  target_score,
  head_speed,
  golf_history,
  favorite_club,
  weak_club,
  current_issue,
  club_setting,
  clubs,
  social_links,
  visibility,
  diagnosis_result,
  is_public,
  created_at,
  updated_at
)
select
  profile_user_id,
  username,
  nickname,
  best_score,
  average_score,
  target_score,
  head_speed,
  golf_history,
  favorite_club,
  weak_club,
  current_issue,
  club_setting,
  clubs,
  coalesce(social_links, '{}'::jsonb),
  coalesce(visibility, '{}'::jsonb),
  diagnosis_result,
  is_public,
  updated_at,
  updated_at
from deduped_profiles dp
where not exists (
  select 1
  from public.golf_profiles gp
  where lower(gp.username) = lower(dp.username)
);
