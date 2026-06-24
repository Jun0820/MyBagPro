# Vercel 2プロジェクト運用メモ

同じGitHubリポジトリを使い、Vercelプロジェクトを2つに分けて運用する。

## Golf IDプロジェクト

- Domain: `golfid.jp`
- `VITE_BRAND=golfid`
- `VITE_APP_NAME=Golf ID`
- `VITE_SITE_URL=https://golfid.jp`
- `VITE_CANONICAL_HOST=golfid.jp`
- `VITE_GOLFID_URL=https://golfid.jp`
- `VITE_MYBAGPRO_URL=https://www.mybagpro.jp`

初期HTML:

- title: `上手くなる人は、自分のゴルフを知っている。 | Golf ID`
- canonical: `https://golfid.jp/`

## MyBagProプロジェクト

- Domain: `www.mybagpro.jp`
- `VITE_BRAND=mybagpro`
- `VITE_APP_NAME=MyBagPro`
- `VITE_SITE_URL=https://www.mybagpro.jp`
- `VITE_CANONICAL_HOST=www.mybagpro.jp`
- `VITE_GOLFID_URL=https://golfid.jp`
- `VITE_MYBAGPRO_URL=https://www.mybagpro.jp`

初期HTML:

- title: `MyBagPro | プロとみんなのクラブセッティングが見つかる`
- canonical: `https://www.mybagpro.jp/`

## 共通

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_GEMINI_API_KEY`
- `VITE_RAKUTEN_...`

`SUPABASE_SERVICE_ROLE_KEY` はフロントでは使わない。必要な場合もサーバー側または管理スクリプトだけで使う。

## 注意

- `mybagpro.jp` を `golfid.jp` に全面リダイレクトしない。
- `/articles` と `/pros` はMyBagPro側の集客導線として残す。
- `/create`、`/diagnosis`、`/u/[username]` はGolf ID側をcanonicalにする。
