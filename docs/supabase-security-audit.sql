-- Supabase Security Audit
-- SQL Editor で実行して、public schema の RLS / grant 状態を確認する

-- 1. public schema で RLS が無効なテーブル一覧
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  force_rowsecurity as force_rls
from pg_tables
join pg_class on pg_class.relname = pg_tables.tablename
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where schemaname = 'public'
  and pg_namespace.nspname = 'public'
order by tablename;

-- 2. public schema で RLS が無効なテーブルだけを出す
select
  schemaname,
  tablename
from pg_tables
join pg_class on pg_class.relname = pg_tables.tablename
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where schemaname = 'public'
  and pg_namespace.nspname = 'public'
  and rowsecurity = false
order by tablename;

-- 3. anon / authenticated への grant を確認
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- 4. 現在の policy 一覧
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5. MyBagPro で最低限守りたいテーブルの確認
select
  tablename,
  rowsecurity as rls_enabled,
  force_rowsecurity as force_rls
from pg_tables
join pg_class on pg_class.relname = pg_tables.tablename
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where schemaname = 'public'
  and pg_namespace.nspname = 'public'
  and tablename in (
    'setting_profiles',
    'setting_bag_items',
    'content_sources',
    'content_articles',
    'profiles',
    'clubs'
  )
order by tablename;
