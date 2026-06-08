-- MyBagPro clubs table extension for rich My Bag editor fields
-- 実行先: Supabase SQL Editor
-- 目的:
-- - マイページのクラブ編集で追加した詳細項目を public.clubs に正式保存する
-- - 既存データを壊さず後方互換で列を追加する

alter table public.clubs
  add column if not exists flex text,
  add column if not exists number text,
  add column if not exists carry_distance text,
  add column if not exists worry text,
  add column if not exists shaft_weight text,
  add column if not exists sleeve_setting text,
  add column if not exists length text,
  add column if not exists lie_angle text,
  add column if not exists bounce text,
  add column if not exists grind text,
  add column if not exists head_shape text,
  add column if not exists main_use text[] not null default '{}',
  add column if not exists miss_tendency text[] not null default '{}',
  add column if not exists memo text,
  add column if not exists copied_from_club_id uuid;

comment on column public.clubs.flex is 'Shaft flex label saved from My Bag editor';
comment on column public.clubs.number is 'Club slot label such as 3W, 5I, 58°, PT';
comment on column public.clubs.carry_distance is 'Carry distance entered in My Bag editor';
comment on column public.clubs.worry is 'Per-club concern memo entered by the user';
comment on column public.clubs.shaft_weight is 'Shaft weight label such as 65g or 80g台';
comment on column public.clubs.sleeve_setting is 'Adjustable sleeve setting note';
comment on column public.clubs.length is 'Club length note';
comment on column public.clubs.lie_angle is 'Lie angle note';
comment on column public.clubs.bounce is 'Bounce note';
comment on column public.clubs.grind is 'Grind note';
comment on column public.clubs.head_shape is 'Head shape note, mainly for putters';
comment on column public.clubs.main_use is 'Primary use tags saved from My Bag editor';
comment on column public.clubs.miss_tendency is 'Miss tendency tags saved from My Bag editor';
comment on column public.clubs.memo is 'Free-form memo saved from My Bag editor';
comment on column public.clubs.copied_from_club_id is 'Source club id when duplicated from another entry';

