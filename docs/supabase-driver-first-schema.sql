-- MyBagPro Driver-First schema draft
-- 目的:
-- 1. まずは「選手/発信者」と「ドライバー」を本気で掲載する
-- 2. 後から FW, Iron, Wedge, Ball へ拡張しやすい形にする

create extension if not exists pgcrypto;

create table if not exists public.setting_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  kana_name text,
  birth_date date,
  height_cm integer,
  birthplace text,
  nationality text default 'Japan',
  profile_type text not null check (profile_type in ('tour_pro', 'influencer', 'amateur', 'legend')),
  segment text,
  season_year integer,
  youtube_channel text,
  instagram_handle text,
  x_handle text,
  website_url text,
  category text check (category in ('japan_men', 'japan_women', 'overseas_men', 'overseas_women', 'influencer', 'lesson_pro')),
  category_reason text,
  contractStatus text check (contractStatus in ('club_contract', 'free_contract', 'checking')),
  contractMaker text,
  head_speed_mps numeric(4,1),
  average_score numeric(4,1),
  best_score integer,
  ball_name text,
  feature_1 text,
  feature_2 text,
  feature_3 text,
  summary text,
  verified_at timestamptz,
  latest_source_policy text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand text not null,
  model_name text not null,
  category text not null check (category in ('driver', 'fairway_wood', 'utility', 'iron', 'wedge', 'putter', 'ball')),
  release_year integer,
  hero_catch text,
  summary text,
  fit_type text,
  launch_label text,
  spin_label text,
  forgiveness_label text,
  price_range text,
  affiliate_query text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.setting_bag_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.setting_profiles(id) on delete cascade,
  category text not null,
  slot_order integer not null default 0,
  brand text,
  model_name text not null,
  spec_label text,
  loft_label text,
  shaft_brand text,
  shaft_model text,
  shaft_flex text,
  shaft_weight text,
  carry_distance integer,
  total_distance integer,
  source_note text,
  product_id uuid references public.club_products(id) on delete set null,
  is_featured_item boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists setting_bag_items_profile_id_idx
  on public.setting_bag_items(profile_id, slot_order);

create index if not exists setting_bag_items_product_id_idx
  on public.setting_bag_items(product_id);

create table if not exists public.driver_focus_notes (
  profile_id uuid primary key references public.setting_profiles(id) on delete cascade,
  driver_product_id uuid references public.club_products(id) on delete set null,
  driver_reason text,
  driver_change_history text,
  fitting_comment text,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_sources (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.setting_profiles(id) on delete cascade,
  source_type text not null check (source_type in ('official', 'tour_photo', 'youtube', 'instagram', 'article', 'manual')),
  source_url text,
  source_title text,
  checked_at timestamptz,
  notes text
);

create table if not exists public.product_affiliate_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.club_products(id) on delete cascade,
  shop_code text not null check (shop_code in ('RAKUTEN', 'YAHOO', 'AMAZON', 'RAKUTEN_GOLF_PARTNER', 'RAKUTEN_GOLF_PARTNER_ANNEX')),
  link_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.content_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  article_type text not null check (article_type in ('news', 'update', 'column')),
  related_profile_id uuid references public.setting_profiles(id) on delete set null,
  related_product_id uuid references public.club_products(id) on delete set null,
  season_year integer,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists setting_profiles_touch_updated_at on public.setting_profiles;
create trigger setting_profiles_touch_updated_at
before update on public.setting_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists club_products_touch_updated_at on public.club_products;
create trigger club_products_touch_updated_at
before update on public.club_products
for each row execute function public.touch_updated_at();

drop trigger if exists content_articles_touch_updated_at on public.content_articles;
create trigger content_articles_touch_updated_at
before update on public.content_articles
for each row execute function public.touch_updated_at();

-- 初期運用メモ:
-- 1. 最初は setting_profiles + setting_bag_items + club_products の3表で十分
-- 2. ドライバーだけ product_id を厳密に紐づける
-- 3. FW以下は当面 model_name のみでも運用可能
-- 4. 「最新」の根拠を source_type + checked_at で必ず残す
-- 5. 不明な値は null にして、推定値は source note に明記する
-- 6. 運用ルール:
--    latest_source_policy は '2026_season' | 'latest_tournament' | 'representative_setting' を使う
--    average_score / head_speed_mps が不明なら null のまま保存する
--    source_type は official / youtube / instagram を優先する
-- 7. 更新内容を記事化したい場合は content_articles を使う
