# How To Publish a Profile

このプロジェクトでは `setting_profiles` をプロフィールの正本として扱う。
表示まわりの補助データがローカルに残っていても、公開前には `setting_profiles` 側へ同期する。

## 事前確認

公開前に、少なくとも次を確認する。

1. `setting_profiles` に対象プロフィールがある
2. `setting_bag_items` に掲載するクラブ情報がある
3. `content_sources` に許容ソースが入っている
4. `setting_profiles` の `kana_name / birth_date / height_cm / birthplace / website_url / instagram_handle / x_handle / category / contractStatus / contractMaker` が埋まっている

公開許容ソースの運用ルール:
- `official`
- `youtube`
- `instagram`

`article` は調査メモとしては保存してよいが、公開判定の主ソースにはしない。

## 6. `is_published = true` にする方法

### 6-0. まだ migration を入れていない場合

SQL Editor で次を順に流してから公開作業へ進む。

1. [supabase-add-setting-profile-metadata-columns.sql](/Users/tomitajunpei/Downloads/Obsidian/MyBagPro/docs/supabase-add-setting-profile-metadata-columns.sql)
2. [supabase-setting-data-lockdown.sql](/Users/tomitajunpei/Downloads/Obsidian/MyBagPro/docs/supabase-setting-data-lockdown.sql)

その後、ローカルから:

```bash
cd /Users/tomitajunpei/Downloads/Obsidian/MyBagPro
npm run supabase:sync-profile-fields
```

### SQL Editor でやる方法
```sql
update public.setting_profiles
set is_published = true,
    verified_at = now()
where slug = 'hideki-matsuyama';
```

### Table Editor でやる方法
1. Supabase ダッシュボードを開く
2. `Table Editor`
3. `setting_profiles`
4. `hideki-matsuyama` の行を探す
5. `is_published` を `false` から `true` に変える
6. 必要なら `verified_at` に現在時刻を入れる
7. Save

## 7. 追加確認ソースを入れる方法

### SQL Editor でやる方法
```sql
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
  'https://www.youtube.com/watch?v=example',
  '2026 setup video',
  now(),
  '2026 season driver confirmed'
from public.setting_profiles
where slug = 'hideki-matsuyama';
```

### Table Editor でやる方法
1. `Table Editor`
2. `content_sources`
3. `Insert row`
4. `profile_id` に対象プロフィールの id を入れる
5. `source_type` を `official` / `youtube` / `instagram` から選ぶ
6. `source_url`, `source_title`, `checked_at`, `notes` を入れる
7. Save

## 安全な公開手順
1. `setting_profiles` を下書きで作る
2. `setting_bag_items` にドライバー情報を入れる
3. `content_sources` にソースを追加する
4. 確認が取れたら `is_published = true`

### 公開してよい条件
- `latest_source_policy` が今回の運用方針に合っている
- `official / youtube / instagram` のいずれかでクラブ情報を確認できている
- `setting_profiles` にプロフィール基本情報とカテゴリ/契約情報が同期済み
- 不明項目は空欄のままで、推定値を入れていない

### まだ公開しない方がよい条件
- `article` しか確認ソースがない
- ドライバーやボールの情報に揺れがある
- 2026シーズン基準か、直近試合基準かが混ざっている

## ブログ記事として更新内容を出す方法
記事は `content_articles` に入れる。

例:
```sql
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
  '2026シーズン基準でドライバーとボール情報を確認し、プロフィールを更新。',
  '松山英樹の2026年セッティングについて、ドライバー情報と使用ボールを確認し更新しました。',
  'update',
  id,
  2026,
  true,
  now()
from public.setting_profiles
where slug = 'hideki-matsuyama';
```
