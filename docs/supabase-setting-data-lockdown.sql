-- MyBagPro setting data lockdown
-- 目的:
-- 1. setting_profiles / setting_bag_items / content_sources / content_articles を unrestricted 運用から外す
-- 2. 公開データの参照は anon / authenticated に許可
-- 3. 更新系は service_role のみ許可
-- 前提:
-- - docs/supabase-add-setting-profile-metadata-columns.sql 実行済み
-- - 以後の更新は service role 経由のスクリプトに寄せる

alter table public.setting_profiles enable row level security;
alter table public.setting_bag_items enable row level security;
alter table public.content_sources enable row level security;
alter table public.content_articles enable row level security;

alter table public.setting_profiles force row level security;
alter table public.setting_bag_items force row level security;
alter table public.content_sources force row level security;
alter table public.content_articles force row level security;

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
