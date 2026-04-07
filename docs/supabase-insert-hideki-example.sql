-- Hideki Matsuyama insert example
-- 推奨: まず is_published = false で投入

with inserted_profile as (
  insert into public.setting_profiles (
    slug,
    display_name,
    nationality,
    birthplace,
    birth_date,
    height_cm,
    profile_type,
    segment,
    season_year,
    ball_name,
    summary,
    latest_source_policy,
    is_featured,
    is_published,
    verified_at
  )
  values (
    'hideki-matsuyama',
    '松山 英樹',
    'Japan',
    'Ehime, Japan',
    '1992-02-25',
    180,
    'tour_pro',
    'launch10',
    2026,
    'Srixon Z-Star XV',
    '2026シーズンの確認済み情報から順次掲載する松山英樹のセッティングプロフィール。',
    '2026_season',
    true,
    false,
    now()
  )
  on conflict (slug) do update set
    display_name = excluded.display_name,
    nationality = excluded.nationality,
    birthplace = excluded.birthplace,
    birth_date = excluded.birth_date,
    height_cm = excluded.height_cm,
    profile_type = excluded.profile_type,
    segment = excluded.segment,
    season_year = excluded.season_year,
    ball_name = excluded.ball_name,
    summary = excluded.summary,
    latest_source_policy = excluded.latest_source_policy,
    is_featured = excluded.is_featured,
    verified_at = excluded.verified_at
  returning id
)
insert into public.setting_bag_items (
  profile_id,
  category,
  slot_order,
  brand,
  model_name,
  loft_label,
  shaft_brand,
  shaft_model,
  shaft_flex,
  source_note,
  is_featured_item
)
select
  id,
  'Driver',
  1,
  'Srixon',
  'ZXi LS',
  '9 degrees',
  'Graphite Design',
  'Tour AD FI 8',
  'TX',
  'Research note dated 2026-04-07. Additional policy-approved confirmation recommended before publish.',
  true
from inserted_profile;

-- sources
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
  'official',
  'https://www.pgatour.com/player/32839/hideki-matsuyama',
  'PGA TOUR player profile',
  now(),
  'Used for bio fields'
from public.setting_profiles
where slug = 'hideki-matsuyama'
on conflict do nothing;

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
  'article',
  'https://www.golfwrx.com/773030/hideki-matsuyama-witb-2026-february/',
  'GolfWRX WITB 2026 (February)',
  now(),
  'Used for 2026 driver and ball research. Review against official/youtube/instagram policy before publish.'
from public.setting_profiles
where slug = 'hideki-matsuyama'
on conflict do nothing;
