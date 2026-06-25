-- Add social links to Golf ID profiles.
-- Safe to run multiple times.

alter table public.golf_profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;

update public.golf_profiles
set social_links = coalesce(social_links, '{}'::jsonb);
