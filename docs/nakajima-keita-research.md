# Keita Nakajima Research Note

調査日: 2026-04-07

## 結論
- `プロフィール基本情報` は JGTO と GDO で確認しやすい
- `2026シーズンの14本` は GDO の 2026年ソニーオープン セッティングで確認できる
- 2026シーズン基準の掲載候補として扱える

## 確認できた項目
- 名前: 中島 啓太 / Keita Nakajima
- 生年月日: 2000-06-24
- 身長: 177cm
- 出身地: 埼玉県
- 国籍: Japan
- 属性: tour_pro
- ベストスコア: 空欄推奨
- 2026年基準のボール:
  - TaylorMade TP5
- 2026年基準の14本:
  - Driver: Qi4D LS 10.5 / Tour AD FI 70g X
  - FW: Qi4D TOUR 3W 15 / Tour AD XC 70g TX
  - UT: Qi4D Rescue 3U 19 / Tour AD VF HYBRID 105 X
  - Iron: P790 2025 4I / Modus System3 Prototype S
  - Iron: P7CB 5I-9I / Modus System3 Prototype S
  - Wedge: MG5 46, 52, 56, 60 / Dynamic Gold Weight Lock X100
  - Putter: Spider Tour X

## 空欄推奨
- HS
- 平均スコア
- ベストスコア

理由:
- 合意ルールが `不明なら空欄`
- 今回の確認ソースでは、安全に確定しきれない

## 参照ソース
1. JGTO 中島啓太プロフィール
   - https://www.jgto.org/player/100452/profile
   - 用途: プロフィール基本情報

2. GDO 中島啓太 2026年 ソニーオープン セッティング
   - https://news.golfdigest.co.jp/players/setting/17258/2026/1/
   - 用途: 2026年基準の14本、ボール確認

3. GDO 2026年度スタッツ/ランキング
   - https://news.golfdigest.co.jp/players/stats/17258/2026/
   - 用途: 年度と選手情報の補強

## 推奨DB登録方針
- setting_profiles:
  - is_published = true
  - latest_source_policy = '2026_season'
- setting_bag_items:
  - GDO 2026 ソニーオープンの14本を登録
- content_sources:
  - JGTO
  - GDO 2026 setting
  - GDO 2026 stats
