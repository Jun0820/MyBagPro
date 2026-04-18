# Supabase Direct Edit From VS Code

このプロジェクトは `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` では読み取りしか安全に扱わない。
VS Code から直接編集したい場合は、`SUPABASE_SERVICE_ROLE_KEY` をローカルにだけ置く。
`setting_profiles` を正本にしたいので、プロフィール項目・SNS・カテゴリ・契約情報は最終的にここへ集約する。

## 1. `.env.local` を作る

`MyBagPro/.env.local` を作って、次を入れる。

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`.env.local` は `.gitignore` されているので、Git には入らない。

## 2. 接続確認

```bash
cd /Users/tomitajunpei/Downloads/Obsidian/MyBagPro
npm run supabase:check
```

成功すると、設定状態と `setting_profiles` の一部が表示される。

## 3. 最初にやるスキーマ更新

`setting_profiles` に `category / contractStatus / contractMaker / category_reason` が無い環境では、先に Supabase SQL Editor で次を上から順に実行する。

1. [supabase-add-setting-profile-metadata-columns.sql](/Users/tomitajunpei/Downloads/Obsidian/MyBagPro/docs/supabase-add-setting-profile-metadata-columns.sql)
2. [supabase-setting-data-lockdown.sql](/Users/tomitajunpei/Downloads/Obsidian/MyBagPro/docs/supabase-setting-data-lockdown.sql)
3. [supabase-security-audit.sql](/Users/tomitajunpei/Downloads/Obsidian/MyBagPro/docs/supabase-security-audit.sql)

これで:
- `setting_profiles` に集約用の追加列が入る
- `setting_profiles / setting_bag_items / content_sources / content_articles / profiles / clubs` が RLS 管理に寄る
- 以後は `service_role` 付きスクリプト経由で安全に更新できる

補足:
- このSQLで防げるのは `anon / authenticated` のAPI更新
- Supabaseダッシュボードに招待されている Team メンバーの編集権限は別管理
- ダッシュボードの Table Editor から触らせたくない場合は `Project Settings > Team` で対象ユーザーを削除するか `Viewer` に変更する

## 4. `setting_profiles` にプロフィール項目を同期する

```bash
npm run supabase:sync-profile-fields
```

確認だけなら:

```bash
node scripts/supabase-admin.mjs sync-profile-fields --dry-run
```

このコマンドは次を `setting_profiles` に寄せる。
- `kana_name`
- `birth_date`
- `height_cm`
- `birthplace`
- `youtube_channel`
- `instagram_handle`
- `x_handle`
- `website_url`
- `category`
- `contractStatus`
- `contractMaker`

## 5. プロフィールを公開する

```bash
npm run supabase:publish-profile -- hideki-matsuyama
```

## 6. 許容ソースを追加する

```bash
npm run supabase:insert-source -- \
  hideki-matsuyama \
  youtube \
  "https://www.youtube.com/watch?v=replace-me" \
  "2026 season setup confirmation" \
  "Policy-approved source added before publish."
```

## 7. 更新記事を追加する

```bash
npm run supabase:upsert-article -- \
  hideki-matsuyama \
  hideki-matsuyama-2026-driver-update \
  "松山英樹の2026年ドライバー情報を更新しました" \
  "2026シーズン基準で、松山英樹のドライバーと使用ボールの掲載内容を更新しました。" \
  "松山英樹の2026年セッティングについて、公開ポリシーに沿って確認できたドライバー情報と使用ボールを反映しました。今後も確認できたクラブカテゴリから順次更新していきます。" \
  2026
```

## 8. JSON 1つでプロフィールごと投入する

`profile`, `bagItems`, `sources`, `article` をまとめた JSON を用意すると、一括で投入できる。

```bash
npm run supabase:upsert-setting-profile -- docs/ishikawa-ryo-seed.json
```

このコマンドは次をまとめて行う。
- `setting_profiles` の upsert
- `setting_bag_items` の再投入
- `content_sources` の重複回避つき追加
- `content_articles` の upsert

## 注意

- `service role key` は強い権限を持つので、`.env.local` にだけ置く
- `setting_profiles` がプロフィール正本。ローカルの補助データは同期前提で扱う
- SQL の実行順は `metadata columns` → `lockdown` → `sync-profile-fields`
- 公開前の確認ルールは [how-to-publish-profile.md](/Users/tomitajunpei/Downloads/Obsidian/MyBagPro/docs/how-to-publish-profile.md) に従う
- `article` だけで公開判定しない
