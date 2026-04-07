# Supabase Direct Edit From VS Code

このプロジェクトは `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` では読み取りしか安全に扱わない。
VS Code から直接編集したい場合は、`SUPABASE_SERVICE_ROLE_KEY` をローカルにだけ置く。

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

## 3. プロフィールを公開する

```bash
npm run supabase:publish-profile -- hideki-matsuyama
```

## 4. 許容ソースを追加する

```bash
npm run supabase:insert-source -- \
  hideki-matsuyama \
  youtube \
  "https://www.youtube.com/watch?v=replace-me" \
  "2026 season setup confirmation" \
  "Policy-approved source added before publish."
```

## 5. 更新記事を追加する

```bash
npm run supabase:upsert-article -- \
  hideki-matsuyama \
  hideki-matsuyama-2026-driver-update \
  "松山英樹の2026年ドライバー情報を更新しました" \
  "2026シーズン基準で、松山英樹のドライバーと使用ボールの掲載内容を更新しました。" \
  "松山英樹の2026年セッティングについて、公開ポリシーに沿って確認できたドライバー情報と使用ボールを反映しました。今後も確認できたクラブカテゴリから順次更新していきます。" \
  2026
```

## 6. JSON 1つでプロフィールごと投入する

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
- 公開前の確認ルールは [how-to-publish-profile.md](/Users/tomitajunpei/Downloads/Obsidian/MyBagPro/docs/how-to-publish-profile.md) に従う
- `article` だけで公開判定しない
