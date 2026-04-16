-- MyBagPro setting data lockdown
-- 目的:
-- 1. setting_profiles / setting_bag_items / content_sources / content_articles / profiles / clubs を unrestricted 運用から外す
-- 2. 公開データの参照は anon / authenticated に許可
-- 3. setting_* 系の更新は service_role のみ許可
-- 4. profiles / clubs は本人だけ更新可能にする
-- 前提:
-- - docs/supabase-add-setting-profile-metadata-columns.sql 実行済み
-- - 以後の更新は service role 経由のスクリプトに寄せる
-- 注意:
-- - これは「アプリやAPI経由の更新」を止めるSQL
-- - Supabaseダッシュボードに入れる Team メンバーの権限までは制御しない
-- - ダッシュボード上の編集権限も止めたい場合は Project Settings > Team で対象ユーザーを削除または Viewer へ変更する

alter table public.setting_profiles enable row level security;
alter table public.setting_bag_items enable row level security;
alter table public.content_sources enable row level security;
alter table public.content_articles enable row level security;
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;

alter table public.setting_profiles force row level security;
alter table public.setting_bag_items force row level security;
alter table public.content_sources force row level security;
alter table public.content_articles force row level security;
alter table public.profiles force row level security;
alter table public.clubs force row level security;

drop policy if exists "public read published setting_profiles" on public.setting_profiles;
create policy "public read published setting_profiles"
on public.setting_profiles
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "service role manage setting_profiles" on public.setting_profiles;
create policy "service role manage setting_profiles"
on public.setting_profiles
for all
to service_role
using (true)
with check (true);

drop policy if exists "public read published setting_bag_items" on public.setting_bag_items;
create policy "public read published setting_bag_items"
on public.setting_bag_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.setting_profiles
    where setting_profiles.id = setting_bag_items.profile_id
      and setting_profiles.is_published = true
  )
);

drop policy if exists "service role manage setting_bag_items" on public.setting_bag_items;
create policy "service role manage setting_bag_items"
on public.setting_bag_items
for all
to service_role
using (true)
with check (true);

drop policy if exists "public read published content_sources" on public.content_sources;
create policy "public read published content_sources"
on public.content_sources
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.setting_profiles
    where setting_profiles.id = content_sources.profile_id
      and setting_profiles.is_published = true
  )
);

drop policy if exists "service role manage content_sources" on public.content_sources;
create policy "service role manage content_sources"
on public.content_sources
for all
to service_role
using (true)
with check (true);

drop policy if exists "public read published content_articles" on public.content_articles;
create policy "public read published content_articles"
on public.content_articles
for select
to anon, authenticated
using (published = true);

drop policy if exists "service role manage content_articles" on public.content_articles;
create policy "service role manage content_articles"
on public.content_articles
for all
to service_role
using (true)
with check (true);

revoke insert, update, delete on public.setting_profiles from anon, authenticated;
revoke insert, update, delete on public.setting_bag_items from anon, authenticated;
revoke insert, update, delete on public.content_sources from anon, authenticated;
revoke insert, update, delete on public.content_articles from anon, authenticated;

grant select on public.setting_profiles to anon, authenticated;
grant select on public.setting_bag_items to anon, authenticated;
grant select on public.content_sources to anon, authenticated;
grant select on public.content_articles to anon, authenticated;

drop policy if exists "public read public profiles" on public.profiles;
create policy "public read public profiles"
on public.profiles
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "authenticated read own profile" on public.profiles;
create policy "authenticated read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "authenticated insert own profile" on public.profiles;
create policy "authenticated insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "authenticated update own profile" on public.profiles;
create policy "authenticated update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "authenticated delete own profile" on public.profiles;
create policy "authenticated delete own profile"
on public.profiles
for delete
to authenticated
using (auth.uid() = id);

drop policy if exists "service role manage profiles" on public.profiles;
create policy "service role manage profiles"
on public.profiles
for all
to service_role
using (true)
with check (true);

drop policy if exists "public read clubs for public profiles" on public.clubs;
create policy "public read clubs for public profiles"
on public.clubs
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = clubs.user_id
      and profiles.is_public = true
  )
);

drop policy if exists "authenticated read own clubs" on public.clubs;
create policy "authenticated read own clubs"
on public.clubs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "authenticated insert own clubs" on public.clubs;
create policy "authenticated insert own clubs"
on public.clubs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "authenticated update own clubs" on public.clubs;
create policy "authenticated update own clubs"
on public.clubs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "authenticated delete own clubs" on public.clubs;
create policy "authenticated delete own clubs"
on public.clubs
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "service role manage clubs" on public.clubs;
create policy "service role manage clubs"
on public.clubs
for all
to service_role
using (true)
with check (true);

revoke insert, update, delete on public.profiles from anon;
revoke insert, update, delete on public.clubs from anon;

grant select on public.profiles to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.clubs to anon, authenticated;
grant select, insert, update, delete on public.clubs to authenticated;

-- 実行後の確認用:
-- 1. anon / authenticated から update / insert / delete が失敗すること
-- 2. service_role では従来どおり更新できること
-- 3. profiles / clubs は本人だけ更新できること
-- 4. ダッシュボード Team に不要な Editor / Developer 権限ユーザーが残っていないこと
