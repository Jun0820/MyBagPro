# 計測とSearch Consoleの運用（2026-11-17）

## 現在の状態
- GAプロパティはMy Bag Pro。両サイトを同じプロパティで計測し、ホスト名で区別する。
- GA管理画面に「MyBagPro 本番」（www.mybagpro.jp完全一致）、「Golf ID 本番」（golfid.jp完全一致）の比較を保存済み。
- イベントスコープのカスタム定義を作成済み：サイト名 site_brand、購入先ショップ shop_id、クリック箇所 source_page。
- site_brandの送信は修正版公開後。既存のshop_id/source_pageもカスタム定義登録前に遡って集計されるとは限らない。
- Search Consoleに https://www.mybagpro.jp/ と https://golfid.jp/ を追加し、既設HTMLファイルで自動確認済み。確認ファイルを削除しないこと。
- www側のsitemap.xmlは正常処理・480ページ検出を確認。これはインデックス登録480ページという意味ではない。
- Golf ID本番のsitemap.xmlはMyBagProのURLを返すため、まだ送信していない。

## 修正コード
VITE_GA_MEASUREMENT_IDを指定。コードのページビュー送信は手動に一本化し、初期configでsend_page_view:falseを指定する。
SeoManagerは記事・選手タイトルの確定後に送信し、遅い取得には2.5秒の代替送信を設ける。ナビゲーションキーで二重送信を防ぎ、古いページの非同期結果は送信しない。
site_brand、site_hostname、page_pathをイベントに付ける。購入リンクは既存click_affiliate_shopを使い、shop_idとsource_pageで比較する。購入クリックをpurchaseや実報酬と扱わない。
本番ホスト以外は送信しない。ローカル検証は必要時だけDEVかつVITE_GA_DEBUG=true。本番debug_modeは付けない。
URLのキャンペーンパラメータを残し、認証フラグメントや任意の入力クエリは送らない。

## 公開時に必要なGA操作（未実施）
Google公式：https://developers.google.com/analytics/devguides/collection/ga4/views
send_page_view:falseだけでは拡張計測の履歴変更イベントは止まらない。
公開と同じ作業で、データストリーム My Bag Pro Web > 拡張計測 > ページビューの詳細設定にある「ブラウザの履歴イベントに基づくページの変更」を無効にする。元の設定を記録する。
現本番コードも手動page_viewを送っているが、復旧可能な本番公開を確保してから設定を同期する。今回この設定は変更していない。
実際の通信で初回・内部遷移・戻る操作につきpage_viewが1回であること、両サイトとショップが区別されることを確認する。ローカル単体テストだけでGA受信まで保証しない。

## サイトマップ
MyBagProは既存sitemap.xml/robots.txtを維持する。Golf IDはsitemap-golfid.xml（トップ、作成、公開一覧）とrobots-golfid.txtを生成する。
vercel.jsonでgolfid.jp/www.golfid.jpの/sitemap.xmlと/robots.txtを専用ファイルへ振り分ける。filesystem処理より前に置く。
ViteローカルサーバーはVercelのホスト振分けを再現しないため、公開前にVercel側でもホスト別の200応答とXMLを確認する。その後Golf IDのSearch Consoleにhttps://golfid.jp/sitemap.xmlを送信する。

## 検証
node scripts/check-analytics.mjs
型検査、Viteビルド、詳細SEO HTML生成を実施。
スマホ390px・パソコン1440pxで選手詳細の購入リンク表示、一覧への移動を確認。

## 本番反映の制約
この作業コピーはアップロードZIP由来。現本番全体と一致することは未確認であり、そのまま全体置換しない。
既存の本番Vercelへのアクセス、元デプロイへの復旧手順を確保してから差分を取り込む。DNS移行は保留。
各ASPのサイト別確定報酬の識別は未完了。GAの改善だけでサイト別報酬が判明するわけではない。
