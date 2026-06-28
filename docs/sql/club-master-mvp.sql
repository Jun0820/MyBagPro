-- Club master MVP schema for MyBagPro / Golf ID.
-- Goal: store 2006+ club models and images with rights metadata.
-- Do not store or mark unknown-rights images as primary production assets.

create extension if not exists pgcrypto;

create table if not exists public.app_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.club_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country text,
  official_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.club_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.club_brands(id) on delete cascade,
  model_name text not null,
  slug text unique not null,
  category text not null check (category in ('driver', 'fairway_wood', 'utility', 'iron', 'wedge', 'putter', 'ball')),
  release_year integer check (release_year is null or release_year between 2006 and 2100),
  end_year integer check (end_year is null or end_year between 2006 and 2100),
  generation text,
  official_url text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  aliases text[] not null default '{}',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_images (
  id uuid primary key default gen_random_uuid(),
  club_model_id uuid not null references public.club_models(id) on delete cascade,
  image_url text,
  storage_path text,
  source_url text,
  source_type text check (source_type is null or source_type in ('official', 'affiliate_api', 'own_photo', 'licensed', 'manual_upload')),
  license_status text not null default 'unknown' check (license_status in ('unknown', 'permitted', 'affiliate_allowed', 'own', 'licensed', 'prohibited')),
  credit text,
  copyright_notice text,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint club_images_has_source check (image_url is not null or storage_path is not null)
);

create table if not exists public.club_aliases (
  id uuid primary key default gen_random_uuid(),
  club_model_id uuid not null references public.club_models(id) on delete cascade,
  alias text not null,
  unique (club_model_id, alias)
);

create table if not exists public.user_bag_items (
  id uuid primary key default gen_random_uuid(),
  golf_profile_id uuid not null references public.golf_profiles(id) on delete cascade,
  club_model_id uuid references public.club_models(id) on delete set null,
  category text not null,
  display_name text,
  shaft text,
  loft text,
  memo text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists club_models_brand_category_idx on public.club_models(brand_id, category);
create index if not exists club_models_release_year_idx on public.club_models(release_year);
create index if not exists club_images_model_primary_idx on public.club_images(club_model_id, is_primary);
create index if not exists club_aliases_alias_idx on public.club_aliases(lower(alias));
create index if not exists user_bag_items_profile_idx on public.user_bag_items(golf_profile_id, sort_order);

create or replace function public.set_club_model_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_club_model_updated_at on public.club_models;
create trigger set_club_model_updated_at
before update on public.club_models
for each row execute function public.set_club_model_updated_at();

create or replace function public.is_app_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.app_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.app_admins enable row level security;
alter table public.club_brands enable row level security;
alter table public.club_models enable row level security;
alter table public.club_images enable row level security;
alter table public.club_aliases enable row level security;
alter table public.user_bag_items enable row level security;

drop policy if exists "Public can read club brands" on public.club_brands;
create policy "Public can read club brands"
on public.club_brands for select
using (true);

drop policy if exists "Public can read verified club models" on public.club_models;
create policy "Public can read verified club models"
on public.club_models for select
using (is_verified = true or public.is_app_admin());

drop policy if exists "Public can read permitted club images" on public.club_images;
create policy "Public can read permitted club images"
on public.club_images for select
using (
  public.is_app_admin()
  or (
    is_verified = true
    and license_status in ('permitted', 'affiliate_allowed', 'own', 'licensed')
  )
);

drop policy if exists "Public can read club aliases" on public.club_aliases;
create policy "Public can read club aliases"
on public.club_aliases for select
using (true);

drop policy if exists "Admins can manage club brands" on public.club_brands;
create policy "Admins can manage club brands"
on public.club_brands for all
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Admins can manage club models" on public.club_models;
create policy "Admins can manage club models"
on public.club_models for all
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Admins can manage club images" on public.club_images;
create policy "Admins can manage club images"
on public.club_images for all
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Admins can manage club aliases" on public.club_aliases;
create policy "Admins can manage club aliases"
on public.club_aliases for all
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Users can manage own bag items" on public.user_bag_items;
create policy "Users can manage own bag items"
on public.user_bag_items for all
using (
  public.is_app_admin()
  or exists (
    select 1 from public.golf_profiles gp
    where gp.id = user_bag_items.golf_profile_id
      and gp.user_id = auth.uid()
  )
)
with check (
  public.is_app_admin()
  or exists (
    select 1 from public.golf_profiles gp
    where gp.id = user_bag_items.golf_profile_id
      and gp.user_id = auth.uid()
  )
);

-- Add your admin email once from Supabase SQL editor:
-- insert into public.app_admins(email) values ('your-email@example.com') on conflict do nothing;
insert into public.app_admins(email)
values
  ('junpei.t.820@gmail.com'),
  ('j_tommy_820@yahoo.co.jp')
on conflict do nothing;

insert into public.club_brands (name, slug, country, official_url)
values
  ('TaylorMade', 'taylormade', 'USA', 'https://www.taylormadegolf.jp/'),
  ('Callaway', 'callaway', 'USA', 'https://www.callawaygolf.jp/'),
  ('PING', 'ping', 'USA', 'https://clubping.jp/'),
  ('Titleist', 'titleist', 'USA', 'https://www.titleist.co.jp/'),
  ('Srixon', 'srixon', 'Japan', 'https://sports.dunlop.co.jp/golf/srixon/'),
  ('Cleveland', 'cleveland', 'USA', 'https://sports.dunlop.co.jp/golf/clevelandgolf/'),
  ('Mizuno', 'mizuno', 'Japan', 'https://jpn.mizuno.com/golf/'),
  ('Bridgestone', 'bridgestone', 'Japan', 'https://www.bs-golf.com/'),
  ('Cobra', 'cobra', 'USA', 'https://www.cobragolf.com/'),
  ('PRGR', 'prgr', 'Japan', 'https://www.prgr-golf.com/'),
  ('Yamaha', 'yamaha', 'Japan', 'https://golf.yamaha.com/'),
  ('Honma', 'honma', 'Japan', 'https://honmagolf-ec.com/'),
  ('XXIO', 'xxio', 'Japan', 'https://sports.dunlop.co.jp/golf/xxio/'),
  ('Odyssey', 'odyssey', 'USA', 'https://www.callawaygolf.jp/odyssey/'),
  ('Scotty Cameron', 'scotty-cameron', 'USA', 'https://www.scottycameron.com/')
on conflict (slug) do nothing;
