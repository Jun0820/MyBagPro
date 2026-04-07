# SEO And Analytics Setup

## 追加したもの
- ルートごとの `title / description / og / canonical / robots`
- `robots.txt`
- `sitemap.xml`
- GA4 のページビュー計測
- Search Console 用の `google-site-verification` 対応

## GA4 の設定

`.env.local` に Measurement ID を追加する。

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

設定後にビルドし直して本番へアップすると、ページビュー計測が有効になる。

## Search Console の設定

`.env.local` に確認コードを追加する。

```env
VITE_GOOGLE_SITE_VERIFICATION=google-site-verification-code
```

設定後にビルドし直して本番へアップすると、`<meta name="google-site-verification">` が head に入る。

Search Console 側では次の順で進める。

1. `https://search.google.com/search-console` を開く
2. プロパティ追加で `URL プレフィックス` を選ぶ
3. `https://mybagpro.jp/` を入力する
4. `HTML タグ` を選ぶ
5. 表示された verification code を `VITE_GOOGLE_SITE_VERIFICATION` に入れる
6. ビルドして本番へアップする
7. Search Console に戻って `確認` を押す
8. その後 `サイトマップ` に `https://mybagpro.jp/sitemap.xml` を送信する

## すぐ確認する項目

- `https://mybagpro.jp/robots.txt`
- `https://mybagpro.jp/sitemap.xml`
- ページソースに `google-site-verification`
- GA4 の Realtime に自分の閲覧が入るか

## あなたが入れる環境変数

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GOOGLE_SITE_VERIFICATION=google-site-verification-code
```

## いまの SEO で改善した点
- ホームの title / description を現状の事業方針に更新
- 一覧ページ、記事ページ、詳細ページに route 単位の SEO を適用
- `compare`, `diagnosis`, `mypage` は `noindex`
- `robots.txt` と `sitemap.xml` を追加

## 残る制約
- 現在は `HashRouter` のため、SEO は強くない
- 本格的に検索流入を取りにいくなら、将来的には `BrowserRouter + 通常URL + SSR/SSG` に寄せたい

## 次にやると強いもの
- `HashRouter` から通常URLへ移行
- 選手ごとの OGP 画像
- 記事ごとの `Article` 構造化データ
- Search Console のクエリを見て静的集客ページを増やす
