-- setting_profiles にカテゴリ・契約情報を集約するための追加カラム
-- 実行順:
-- 1. このSQLを実行
-- 2. docs/supabase-setting-data-lockdown.sql を実行
-- 3. node scripts/supabase-admin.mjs sync-profile-fields
-- 4. 必要なら docs/*-seed.json を upsert

alter table public.setting_profiles
  add column if not exists category text,
  add column if not exists contractStatus text,
  add column if not exists contractMaker text,
  add column if not exists category_reason text;

update public.setting_profiles
set category = coalesce(category, 'japan_men')
where category is null;

update public.setting_profiles
set contractStatus = coalesce(contractStatus, 'checking')
where contractStatus is null;

update public.setting_profiles
set contractMaker = coalesce(contractMaker, '')
where contractMaker is null;

update public.setting_profiles
set category_reason = coalesce(category_reason, '')
where category_reason is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'setting_profiles_category_check'
  ) then
    alter table public.setting_profiles
      add constraint setting_profiles_category_check
      check (category in ('japan_men', 'japan_women', 'overseas_men', 'overseas_women', 'influencer', 'lesson_pro'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'setting_profiles_contract_status_check'
  ) then
    alter table public.setting_profiles
      add constraint setting_profiles_contract_status_check
      check (contractStatus in ('club_contract', 'free_contract', 'checking'));
  end if;
end $$;
