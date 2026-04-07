# Ryo Ishikawa Research Note

調査日: 2026-04-07

## 結論
- `プロフィール基本情報` は公式サイトと JGTO で確認しやすい
- `2026シーズンのドライバーと使用ボール` は GDO の 2026年クラブカー選手権セッティングで確認できる
- 今回は `2026シーズン基準` の掲載候補として扱える

## 確認できた項目
- 名前: 石川 遼 / Ryo Ishikawa
- 生年月日: 1991-09-17
- 身長: 175cm
- 出身地: 埼玉県松伏町
- 国籍: Japan
- 属性: tour_pro
- ベストスコア: 58
- 2026年基準のボール:
  - Titleist Pro V1x
- 2026年基準のドライバー:
  - ブランド: Callaway
  - モデル: QUANTUM Triple Diamond
  - ロフト: 9 degrees
  - シャフトブランド: Graphite Design
  - シャフトモデル: Tour AD GC
  - シャフトフレックス: S
  - シャフト重量帯: 60g台

## 空欄推奨
- HS
- 平均スコア

理由:
- 合意ルールが `不明なら空欄`
- 今回の確認ソースでは、安全に確定しきれない

## 参照ソース
1. 石川遼オフィシャルサイト プロフィール
   - https://ryo-ishikawa.jp/profile/
   - 用途: 生年月日、身長、出身地、ベストスコア

2. JGTO 石川遼プロフィール
   - https://www.jgto.org/player/15422/profile
   - 用途: 公式プロフィール補強、所属、プロ転向年

3. GDO 2026年 クラブカー選手権 セッティング
   - https://news.golfdigest.co.jp/players/setting/100/2026/1/
   - 用途: 2026シーズン時点のドライバー、シャフト、ボール確認

## 推奨DB登録方針
- setting_profiles:
  - is_published = true
  - latest_source_policy = '2026_season'
- setting_bag_items:
  - ドライバーだけ先に登録
- content_sources:
  - official site
  - JGTO
  - GDO 2026 setting

## 補足
- GDO のセッティングは大会時点の実戦セットで、更新日基準として使いやすい
- ドライバー名は DB では ASCII 優先で `QUANTUM Triple Diamond` として保存する
