# TODO

## Golf ID public page

- `/u/[username]` をSSR化し、初期HTMLの `title` / `description` / OGP を個別Golf IDごとに返す。
- X / LINE / Google向けに完全な個別OGPを返す。
- Vite SPAのまま進める場合は、Vercel Functionで `/u/[username]` の動的HTMLを返す案を検討する。
- 中長期では Next.js への移行も比較する。
- `/@[username]` ルーティングの見え方と共有URLを正式仕様にする。
- Player Card画像生成を実装し、SNS共有用の画像として使えるようにする。
