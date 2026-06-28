# TODO

## Golf ID public page

- `/u/[username]` をSSR化し、初期HTMLの `title` / `description` / OGP を個別Golf IDごとに返す。
- X / LINE / Google向けに完全な個別OGPを返す。
- Vite SPAのまま進める場合は、Vercel Functionで `/u/[username]` の動的HTMLを返す案を検討する。
- 中長期では Next.js への移行も比較する。
- `/@[username]` ルーティングの見え方と共有URLを正式仕様にする。
- Player Card画像生成を実装し、SNS共有用の画像として使えるようにする。

## Golf ID beta scope

- Instagramへ直接投稿するSDK連携はβ後に検討する。
- TikTok Content Posting API / Share Kit連携はβ後に検討する。
- 課金導線はGolf ID作成から公開、共有、フィードバック回収の安定後に設計する。
- ログイン必須化は作成完了率を見てから判断する。
- 詳細な番手別クラブ登録は、自由入力版の利用状況を見てから拡張する。

## Club master / image database

- 2006年以降のクラブマスターを主要ブランドから段階的に整備する。
- 公式/許諾/自社撮影/アフィリエイトAPI許可画像だけを `club_images` に検証済みとして登録する。
- 権利不明画像は保存・primary化しない。`source_url` / `license_status` / `credit` / `verified_at` を必ず管理する。
- `/clubs/[brand]` と `/clubs/[brand]/[model]` のSEOページを実装する。
- プロセッティング記事とクラブ詳細ページを内部リンクでつなぐ。
- Golf IDのMy Bag自由入力を `club_models` 検索選択と `user_bag_items` 保存へ拡張する。
