# Content Entry Workflow

## 目的
- サンプルや推定値を公開しない
- 確認済みデータだけを `is_published=true` にする

## Launch 10 の入力順
1. `docs/launch-10-research-template.csv` に調査結果を入れる
2. `source_type`, `source_url`, `source_title`, `checked_at` を必ず埋める
3. 14本の構成を埋める
4. ヘッド、シャフト、飛距離まで確認できるものは埋める
5. ボール情報と特徴3つを埋める
5. `summary` を書く
6. 公開前に必須項目をチェックする
7. 問題なければ Supabase に投入して `is_published=true`

## 公開に必要な最低条件
- 2026シーズン基準、または直近試合基準、または代表セッティング基準のいずれかを明記
- ソースURLあり
- 確認日あり
- 14本の構成あり
- ドライバーヘッド情報あり
- ドライバーシャフト情報あり
- 使用ボールあり
- 特徴3つあり
- summary あり

## 不明値ルール
- 平均スコアが不明なら空欄
- HSが不明なら空欄
- 空欄はよいが、推定値は入れない

## 参照元優先度
1. 2026シーズン基準
2. 直近試合基準
3. 代表セッティング基準

## 許容ソース
- official
- youtube
- instagram
