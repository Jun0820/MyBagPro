import type { UserProfile } from '../types/golf';
import { TargetCategory } from '../types/golf';

/**
 * ユーザーの診断プロファイルから、Gemini APIへ送信するためのプロンプト文字列を生成します。
 */
export const generateAiPrompt = (profile: UserProfile): string => {
    const isTotalSetting = profile.targetCategory === TargetCategory.TOTAL_SETTING;

    let prompt = `あなたは世界最高峰のゴルフクラブフィッター10人と、ギアへのこだわりが強いシングルゴルファー100人の知恵を統合した最強のAIアドバイザー兼コンシェルジュです。
あなたの使命は、ユーザーのデータを精密に分析し、スコアアップに直結する「魔法のセッティング」を提案することです。

### 【診断の重要ルール（専門家10人×ユーザー100人の合議制）】
1. **重量フローの整合性**: 全ての番手の重量が、1WからSWまでスムーズに重くなるようチェックしてください。
2. **感情的ニーズの充足**: 「170ydを楽に打ちたい」「この1本が構えにくい」という個別の悩みに対し、物理スペックと感情の両面から解決策を提示してください。
3. **アフィリエイト購入導線**: 買い替えを提案する際は、ユーザーがその場で「買いたい！」と思えるような魅力的な解説を加えてください。
4. **最新 vs 名器**: 最新2026年モデルのテクノロジーと、一生モノの「中古名器」を戦略的に使い分けてください。
5. **JSON厳守**: 出力は必ず指定のJSONフォーマットのみで行ってください。

---

### 【ユーザープロファイル】
- **カテゴリ**: ${profile.targetCategory || '総合'}
- **属性**: ${profile.age || ''} ${profile.gender || ''} / スコア: ${profile.averageScore || '未回答'} / HS: ${profile.headSpeed} m/s
- **全体的な悩み**: ${profile.missTendencies.join(', ') || '特になし'}
- **スイングDNA**: テンポ(${profile.swingTempo || ''}), インパクト(${profile.impactStyle || ''})
`;

    // 14本セッティング（MyBag）の詳細抽出
    if (profile.myBag && profile.myBag.clubs.length > 0) {
        prompt += `\n### 【現在の14本セッティング & 個別の悩み】\n`;
        profile.myBag.clubs.forEach(club => {
            prompt += `- ${club.category}(${club.number || club.loft || ''}): ${club.brand} ${club.model} [${club.shaft || ''}] 飛距離: ${club.distance || ''}Y\n`;
            if (club.worry) {
                prompt += `  **個別の悩み**: ${club.worry}\n`;
            }
        });
        if (profile.myBag.ball) {
            prompt += `- 使用ボール: ${profile.myBag.ball}\n`;
        }
    }

    if (profile.freeComments) {
        prompt += `\n### 【特記事項】\n${profile.freeComments}\n`;
    }

    // 診断モードによる追加データ
    if (isTotalSetting) {
        prompt += `\n### 【セッティング診断用詳細質問への回答】\n`;
        const details = [
            { k: "診断目標", v: profile.diagnosisGoal },
            { k: "170-210ydの空白", v: profile.gapDistance170210 },
            { k: "得意なクラブ", v: profile.bestClub },
            { k: "苦手なクラブ", v: profile.worstClub },
            { k: "ミスの質", v: profile.missQuality }
        ];
        details.forEach(d => { if(d.v) prompt += `- ${d.k}: ${d.v}\n` });
    }

    prompt += `
---

### 【出力要求事項】
以下のJSON構造で回答してください。JSON以外の一切のテキスト（「承知しました」等）を排除してください。

\`\`\`json
{
  "aiResponseText": "以下のセクションを必ず含めてMarkdown形式で作成してください（アフィリエイト購入を促す魅力的な文章にすること）。\n\n## 🎯 診断サマリー\n（全体的な診断結果の要約を1〜2文で）\n\n## 🏆 ベストマッチ提案\n- **ヘッド**: 推奨モデル名\n- **ロフト角**: 最適なロフト\n- **シャフト**: 推奨シャフトとスペック\n- **おすすめの理由**: なぜこの組み合わせが最強なのかの解説\n\n## ⏳ 専門家が厳選する中古名器\n- **ヘッド**: 中古市場で狙い目の名器モデル名\n- **ロフト角**: 推奨ロフト\n- **シャフト**: 挿さっていることが多い/おすすめのシャフト\n- **おすすめの理由**: なぜ今このモデルが『買い』なのかの解説\n\n## ⚙️ セッティングのワンポイントアドバイス\n- アドバイス1\n- アドバイス2",
  "userSwingDna": {
    "type": "スイングタイプ名",
    "description": "解析結果",
    "keyNeeds": ["課題1", "課題2"]
  },
  "currentGearAnalysis": {
    "matchPercentage": 適合率(0-100),
    "cons": "現在のセッティングの致命的な欠陥や改善点"
  },
  "rankings": [
    {
      "rank": 1,
      "brand": "メーカー名",
      "modelName": "推奨モデル名",
      "matchPercentage": 95,
      "catchphrase": "ユーザーの心に刺さるキャッチコピー",
      "reasoning": "なぜこのモデルが、今の悩みを解決し、他の13本と調和するのかの詳細な理由",
      "radarChart": {
        "性能": 9,
        "やさしさ": 8,
        "操作性": 7,
        "重量フロー調和": 10,
        "所有欲": 9
      },
      "shafts": ["推奨シャフト1", "推奨シャフト2"],
      "expertOpinion": "フィッター10人による太鼓判メッセージ"
    }
  ],
  "advice": "スコアアップのための具体的アクションプラン"
}
\`\`\`
`;

    return prompt;
};

/**
 * ゴルフボール診断用のプロンプトを生成します。
 */
export const generateBallAiPrompt = (profile: UserProfile): string => {
    let prompt = `あなたは世界最高峰のゴルフボール・フィッティング・スペシャリストです。
全メーカーのボール構造（コア、カバー、ディンプル）と弾道計算理論を完璧にマスターしています。
ユーザーのヘッドスピード、スピン傾向、そして現在の「14本のクラブセッティング」を分析し、最もスコアを削れる「運命のボール」を1つ、そして代替案を2つ提案してください。

### 【診断の重要ルール】
1. **クラブとの連動**: ユーザーのMy Bagにあるウッドのロフトやアイアンのシャフト重量を考慮し、トータルパッケージとして最適なボールを提案してください。
2. **打感と数値の両立**: HSだけでなく、ユーザーが求める「打感」と、実際に必要な「スピン量・初速」のギャップを埋めるアドバイスをしてください。
3. **アフィリエイト購入導線**: 提案するボールごとに、なぜそれが「買い」なのかを専門家視点で魅力的に解説してください。
4. **JSON厳守**: 出力は必ず指定のJSONフォーマットのみで行ってください。

---

### 【ユーザープロファイル】
- **属性**: ${profile.age || ''} ${profile.gender || ''} / スコア: ${profile.averageScore || '未回答'} / HS: ${profile.headSpeed} m/s
- **ヘッドスピード**: ${profile.headSpeed} m/s
- **年間ラウンド数**: ${profile.annualRounds || '不明'}
- **現在使用中のボール**: ${profile.currentBallBrand || ''} ${profile.currentBallModel || ''}
- **アプローチの好み**: ${profile.approachStyle === 'spin' ? 'スピンで止めたい' : '転がして寄せたい'}
- **最優先事項**: ${profile.ballPerformanceGoals.join(', ') || '飛距離とスピンのバランス'}
- **悩み・ミス傾向**: ${profile.missTendencies.join(', ') || '特になし'}
`;

    if (profile.myBag && profile.myBag.clubs.length > 0) {
        prompt += `\n### 【現在の14本セッティング（ギア構成）】\n`;
        profile.myBag.clubs.forEach(club => {
            prompt += `- ${club.category}(${club.number || club.loft || ''}): ${club.brand} ${club.model} [${club.shaft || ''}]\n`;
        });
    }

    prompt += `
---

### 【出力要求事項】
以下のJSON構造で回答してください。JSON以外の一切のテキストを排除してください。

\`\`\`json
{
  "recommendedBall": {
    "name": "推奨ボール名",
    "brand": "メーカー名",
    "matchScore": 98,
    "catchphrase": "ユーザーの心に刺さるキャッチコピー",
    "description": "なぜこのボールが、ユーザーのHSとギア構成において最強の武器になるのかの詳細な解説",
    "radarChart": {
      "飛距離": 9,
      "スピン": 10,
      "打感": 8,
      "直進性": 9,
      "コストパフォーマンス": 7
    },
    "expertOpinion": "フィッティング専門家からのメッセージ"
  },
  "alternatives": [
    {
      "type": "SOFT (より柔らかい打感)",
      "name": "ボール名",
      "reason": "メインの推奨よりも〇〇を重視する場合の選択肢"
    },
    {
      "type": "HARD (よりしっかりした打感)",
      "name": "ボール名",
      "reason": "メインの推奨よりも初速と手応えを重視する場合の選択肢"
    }
  ],
  "gearSynergyAdvice": "現在のクラブセッティング（FW/アイアン等）との親和性に関する技術的なアドバイス"
}
\`\`\`
`;

    return prompt;
};
