# Hideki Matsuyama Research Note

調査日: 2026-04-07

## 結論
- `プロフィール基本情報` は確認しやすい
- `2026シーズンのセッティング` は確認できる資料がある
- ただし、今回確認できた 2026 WITB の主要ソースは GolfWRX 記事で、合意済みの公開許容ソース `official / youtube / instagram` だけではまだ固め切れていない
- そのため、`DB には入れてよいが is_published=false 推奨`。公開は追加確認後が安全

## 確認できた項目
- 名前: Hideki Matsuyama / 松山 英樹
- 生年月日: 1992-02-25
- 身長: 5'11" / 約180cm
- 出身地: Ehime, Japan
- 国籍: Japan
- 属性: tour_pro
- 2026年基準のボール: Srixon Z-Star XV
- 2026年基準のドライバー:
  - ブランド: Srixon
  - モデル: ZXi LS
  - ロフト: 9 degrees
  - シャフトブランド: Graphite Design
  - シャフトモデル: Tour AD FI 8
  - フレックス: TX

## 空欄推奨
- HS
- 平均スコア
- ベストスコア

理由:
- 合意ルールが `不明なら空欄`
- 今回の確認ソースでは、これらを安全に確定しきれない

## 参照ソース
1. PGA TOUR player profile
   - https://www.pgatour.com/player/32839/hideki-matsuyama
   - 用途: 身長、出身地、国籍、年齢確認

2. GolfWRX WITB 2026 (February 9, 2026)
   - https://www.golfwrx.com/773030/hideki-matsuyama-witb-2026-february/
   - 用途: 2026シーズン時点のドライバー、シャフト、ボール確認
   - 注意: 公開ポリシー上は追加確認推奨

## 公開判定
- 現時点: `draft`
- 理由:
  - WITB の主要確認ソースが GolfWRX 記事
  - 合意済みの `official / youtube / instagram` のいずれかで同内容を追加確認できると公開しやすい

## 推奨DB登録方針
- setting_profiles:
  - is_published = false
  - latest_source_policy = '2026_season'
  - verified_at は入力可
- setting_bag_items:
  - ドライバーだけ先に登録
- content_sources:
  - PGA TOUR
  - GolfWRX article

## 次にやるとよいこと
- Srixon / 松山本人 / ツアー現場動画の YouTube or Instagram で 2026年ドライバー確認
- 確認できたら is_published=true に変更
