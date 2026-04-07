# Launch 10 Seed Plan

## 初期公開10名
1. 松山 英樹
2. 石川 遼
3. 中島 啓太
4. 久常 涼
5. 蝉川 泰果
6. 堀川 未来夢
7. 中西 直人
8. 片山 晋呉
9. 星野 英正
10. Tera-You

## 選定理由
- トップスター5名で検索需要を取りにいく
- 人気プロ4名で閲覧回遊を強める
- Tera-YouでYouTube導線の入口を作る

## 最新情報の優先順位
1. 2026シーズン基準
2. 直近試合基準
3. 代表セッティング基準

## 許容ソース
- 公式サイト
- YouTube
- Instagram

## 不明値の扱い
- 平均スコア: 空欄
- HS: 空欄

## 入力時ルール
- `season_year` は原則 `2026`
- 2026シーズンの情報が確認できない場合のみ、直近試合ソースを使う
- それもない場合のみ代表セッティングを使う
- `latest_source_policy` には採用した基準を明記する
- `verified_at` と `content_sources.checked_at` は必ず埋める

## 次の実装ステップ
1. Launch 10 を Supabase seed にする
2. setting_profiles を Supabase から読む
3. setting_bag_items を紐づけて一覧と詳細を実データ表示に切り替える
