-- Launch 10 seed template
-- 方針:
-- 1. まず profiles だけ作る
-- 2. ドライバーとボールは確認できたものから setting_bag_items / content_sources に追加する
-- 3. 不明値は null のまま保持する

insert into public.setting_profiles (
  slug,
  display_name,
  profile_type,
  segment,
  season_year,
  latest_source_policy,
  average_score,
  head_speed_mps,
  best_score,
  ball_name,
  is_featured,
  is_published
)
values
  ('松山-英樹', '松山 英樹', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('石川-遼', '石川 遼', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('中島-啓太', '中島 啓太', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('久常-涼', '久常 涼', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('蝉川-泰果', '蝉川 泰果', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('堀川-未来夢', '堀川 未来夢', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('中西-直人', '中西 直人', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('片山-晋呉', '片山 晋呉', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('星野-英正', '星野 英正', 'tour_pro', 'launch10', 2026, '2026_season', null, null, null, null, true, false),
  ('tera-you', 'Tera-You', 'influencer', 'launch10', 2026, '2026_season', null, null, null, null, true, false);

-- 次の入力例:
-- insert into public.content_sources (profile_id, source_type, source_url, source_title, checked_at, notes)
-- select id, 'youtube', 'https://...', '2026 setup video', now(), 'driver confirmed'
-- from public.setting_profiles
-- where slug = 'tera-you';
