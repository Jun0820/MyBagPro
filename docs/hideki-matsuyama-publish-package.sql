-- Hideki Matsuyama publish package
-- 前提:
-- 1. setting_profiles / setting_bag_items / content_sources への初期投入が完了している
-- 2. 公開許容ソース (official / youtube / instagram) が追加済み
-- 3. 2026シーズン基準で公開してよいと判断できる

-- 1) 公開前の確認
select
  slug,
  display_name,
  season_year,
  latest_source_policy,
  is_published,
  verified_at
from public.setting_profiles
where slug = 'hideki-matsuyama';

select
  category,
  brand,
  model_name,
  loft_label,
  shaft_brand,
  shaft_model,
  shaft_flex
from public.setting_bag_items
where profile_id = (
  select id from public.setting_profiles where slug = 'hideki-matsuyama'
)
order by slot_order asc;

select
  source_type,
  source_title,
  source_url,
  checked_at
from public.content_sources
where profile_id = (
  select id from public.setting_profiles where slug = 'hideki-matsuyama'
)
order by checked_at desc nulls last;

-- 2) 許容ソースを追加する例
-- 実際のURLとタイトルに置き換えて使う
insert into public.content_sources (
  profile_id,
  source_type,
  source_url,
  source_title,
  checked_at,
  notes
)
select
  id,
  'youtube',
  'https://www.youtube.com/watch?v=replace-me',
  '2026 season setup confirmation',
  now(),
  'Policy-approved source added before publish.'
from public.setting_profiles
where slug = 'hideki-matsuyama';

-- 3) 公開する
update public.setting_profiles
set is_published = true,
    verified_at = now()
where slug = 'hideki-matsuyama';

-- 4) 更新記事を公開する
insert into public.content_articles (
  slug,
  title,
  excerpt,
  body,
  article_type,
  related_profile_id,
  season_year,
  published,
  published_at
)
select
  'hideki-matsuyama-2026-driver-update',
  '松山英樹の2026年ドライバー情報を更新しました',
  '2026シーズン基準で、松山英樹のドライバーと使用ボールの掲載内容を更新しました。',
  '松山英樹の2026年セッティングについて、公開ポリシーに沿って確認できたドライバー情報と使用ボールを反映しました。今後も確認できたクラブカテゴリから順次更新していきます。',
  'update',
  id,
  2026,
  true,
  now()
from public.setting_profiles
where slug = 'hideki-matsuyama'
on conflict (slug) do update set
  title = excluded.title,
  excerpt = excluded.excerpt,
  body = excluded.body,
  article_type = excluded.article_type,
  related_profile_id = excluded.related_profile_id,
  season_year = excluded.season_year,
  published = excluded.published,
  published_at = excluded.published_at,
  updated_at = now();

-- 5) 公開後の確認
select
  slug,
  display_name,
  is_published,
  verified_at
from public.setting_profiles
where slug = 'hideki-matsuyama';

select
  slug,
  title,
  published,
  published_at
from public.content_articles
where slug = 'hideki-matsuyama-2026-driver-update';
