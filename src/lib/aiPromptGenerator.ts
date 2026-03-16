import type { UserProfile } from '../types/golf';
import { DiagnosisMode, TargetCategory } from '../types/golf';

/**
 * ユーザーの診断プロファイルから、Gemini APIへ送信するためのプロンプト文字列を生成します。
 * 本番運用では、AIからパース可能なJSON形式でのレスポンスを要求します。
 */
export const generateAiPrompt = (profile: UserProfile): string => {
    const isTotalSetting = profile.targetCategory === TargetCategory.TOTAL_SETTING;

    let prompt = `あなたは世界最高峰のゴルフクラブフィッター10人と、ギアへのこだわりが強いシングルゴルファー100人の知恵を統合した最強のAIアドバイザーです。
以下の分析データに基づいて、ユーザーにとって「最高に美しく、最高に結果が出るセッティング」を診断し、指定されたJSONフォーマットで回答してください。

### 【診断の重要ルール（専門家10人×ユーザー100人の協議結果）】
1. **重量フローの整合性**: ドライバーからウェッジまで、重量が一定の傾きで重くなる「黄金の重量フロー」を最重視してください。
2. **飛距離の階段（ギャップ）**: 170〜210ydのレンジで「打てない番手」が発生していないか厳密にチェックし、解消策を提示してください。
3. **最新機と名器のミックス**: 最新2024-2026年モデルの恩恵と、過去10年の「変える必要がない完成度の高い中古名器」をバランスよく組み合わせてください。
4. **エモーショナルな助言**: 単なるデータの羅列ではなく、ユーザーの悩みに寄り添い、ゴルフがもっと楽しくなるようなワクワクする言葉を選んでください。
${isTotalSetting ? '5. **セッティング診断モード**: 各クラブ個別の診断ではなく「14本の流れ」を評価し、特定のクラブだけが浮いていないかを評価してください。\n6. **現在のバッグの解体・再構築**: ユーザーのMyBagにある中で「残すべき宝物」と「今すぐ変えるべき弱点」を明確に分けて助言してください。' : ''}
${isTotalSetting ? '7' : '5'}. **JSONフォーマット**: 出力は必ず以下のJSON構造に従ってください。Markdownのコードブロック（ \`\`\`json ... \`\`\` ）で囲んで出力してください。

---

### 【ユーザープロファイル】
- **診断対象カテゴリ**: ${profile.targetCategory || '総合'}
- **年齢層**: ${profile.age || '未回答'} / **性別**: ${profile.gender || '指定なし'}
- **ゴルフ歴/レベル**: ${profile.skillLevel || '未回答'}
- **現在の悩み/傾向**: ${profile.missTendencies.length > 0 ? profile.missTendencies.join(', ') : '特になし'}
- **スイングテンポ**: ${profile.swingTempo || '未回答'}
- **ヘッドスピード**: ${profile.headSpeed ? `約${profile.headSpeed} m/s` : '未回答'}
`;

    // セッティング情報（MyBag）の追加
    if (isTotalSetting && profile.myBag && profile.myBag.clubs.length > 0) {
        prompt += `\n### 【現在のクラブセッティング（MyBag）】\n`;
        profile.myBag.clubs.forEach(club => {
            prompt += `- ${club.category}: ${club.brand} ${club.model} (シャフト: ${club.shaft || '不明'}, ロフト: ${club.loft || '不明'})\n`;
        });
        if (profile.myBag.ball) {
            prompt += `- 使用ボール: ${profile.myBag.ball}\n`;
        }
    }

    // 診断モードによる情報追加 (単体診断の場合)
    if (!isTotalSetting && profile.diagnosisMode === DiagnosisMode.FULL_SPEC) {
        prompt += `- **現在の使用クラブ**: ${profile.currentBrand || ''} ${profile.currentModel || ''}\n`;
        prompt += `- **現在のシャフト**: ${profile.currentShaftModel || ''} ${profile.currentShaftWeight || ''} ${profile.currentShaftFlex || ''}\n`;
        prompt += `- **現在のロフト角**: ${profile.currentLoft || ''}\n`;
    }

    // こだわりメーカー
    if (profile.brandPreferenceMode !== 'any' && profile.preferredBrands && profile.preferredBrands.length > 0) {
        const modeText = profile.brandPreferenceMode === 'strict' ? '（必須条件）' : '（できれば）';
        prompt += `- **希望するメーカー**: ${profile.preferredBrands.join(', ')} ${modeText}\n`;
    }

    // ショットの傾向
    prompt += `\n### 【ショットデータ/傾向】\n`;
    if (profile.trajectoryHeight) prompt += `- **現在の弾道高さ**: ${profile.trajectoryHeight}\n`;
    if (profile.idealTrajectory) prompt += `- **理想の弾道**: ${profile.idealTrajectory}\n`;
    if (profile.preferredBallFlight) prompt += `- **好みの球筋**: ${profile.preferredBallFlight}\n`;
    if (profile.impactStyle) prompt += `- **インパクトの傾向**: ${profile.impactStyle}\n`;

    if (profile.freeComments) {
        prompt += `\n### 【ユーザーメッセージ・特定の悩み】\n${profile.freeComments}\n`;
    }

    if (isTotalSetting) {
        prompt += `\n### 【セッティング診断用詳細データ】\n`;
        if (profile.diagnosisGoal) prompt += `- 診断の最重要目標: ${profile.diagnosisGoal}\n`;
        if (profile.roundFrequency) prompt += `- ラウンド頻度: ${profile.roundFrequency}\n`;
        if (profile.weightFlowFeel) prompt += `- 重量フローの違和感: ${profile.weightFlowFeel}\n`;
        if (profile.brandConsistency) prompt += `- ブランド統一感への懸念: ${profile.brandConsistency}\n`;
        if (profile.gapDistance170210) prompt += `- 170-210ydレンジの空白地帯: ${profile.gapDistance170210}\n`;
        if (profile.missQuality) prompt += `- ミスの質（打点 vs スピン）: ${profile.missQuality}\n`;
        if (profile.attackAngleLevel) prompt += `- 自覚している入射角: ${profile.attackAngleLevel}\n`;
        if (profile.bestClub) prompt += `- 最も信頼しているクラブ: ${profile.bestClub}\n`;
        if (profile.worstClub) prompt += `- 最も苦手/構えたくないクラブ: ${profile.worstClub}\n`;
        if (profile.situationalIssue && profile.situationalIssue.length > 0) prompt += `- 苦手なシチュエーション: ${profile.situationalIssue.join(', ')}\n`;
        if (profile.commonCourseType) prompt += `- よく行くコース特性: ${profile.commonCourseType}\n`;
        if (profile.playStyle) prompt += `- プレースタイル: ${profile.playStyle}\n`;
    }

    prompt += `
---

### 【出力JSONスキーマ】
\`\`\`json
{
  "aiResponseText": "ユーザーへの挨拶と、スイング傾向および${isTotalSetting ? 'セッティング全体' : 'クラブ'}の総評を含むMarkdown形式のテキスト",
  "userSwingDna": {
    "type": "スイングタイプの名称（例：パワードロー型）",
    "description": "スイング特性の解説",
    "keyNeeds": ["改善すべき点1", "改善すべき点2"]
  },
  "currentGearAnalysis": {
    "matchPercentage": 適合率(数値),
    "typeDescription": "${isTotalSetting ? '現在のセッティング構成' : '現在のクラブ'}のタイプ解説",
    "pros": "現在の良い点",
    "cons": "現在の課題点・改善点"
  },
  "idealTrajectory": {
    "recommendation": "推奨される弾道の方向性（例：高弾道ロースピン）",
    "details": {
      "launchAngle": "適正な打ち出し角の目安",
      "spinRate": "適正なスピン量の目安",
      "maxHeight": "適正な最高到達点の目安"
    }
  },
  "rankings": [
    {
      "rank": 1,
      "brand": "メーカー名",
      "modelName": "${isTotalSetting ? '推奨するセッティングのキーとなるクラブ' : '製品名'}",
      "matchPercentage": 適合率(0-100の数値),
      "catchphrase": "キャッチコピー",
      "reasoning": "${isTotalSetting ? '各番手の重量フローとロフト角の階段を物理的に算出した結果、' : ''}選定した論理的理由",
      "technicalFit": "物理スペック的な適合ポイント",
      "radarChart": {
        "axis1": ${isTotalSetting ? '重量フロー' : '飛距離性能'}(1-10),
        "axis2": ${isTotalSetting ? 'ロフトギャップ' : '寛容性/やさしさ'}(1-10),
        "axis3": ${isTotalSetting ? '操作性' : '操作性'}(1-10),
        "axis4": '感性・打感'(1-10),
        "axis5": 'トータル整合性'(1-10)
      },
      "shafts": ["推奨シャフト名1(スペック含む)", "推奨シャフト名2"],
      "priceEstimate": "目安価格",
      "isUsedMasterpiece": false,
      "expertOpinion": "フィッターとしての熱い一言"
    },
    {
      "rank": 2,
      "...": "(同様の構造で計3件程度)"
    }
  ],
  "weightFlowAnalysis": "${isTotalSetting ? '現在のセッティングの重量フローに関する詳細な科学的分析' : 'なし'}",
  "distanceGapAnalysis": "${isTotalSetting ? '14本の距離の階段に関する詳細な分析' : 'なし'}",
  "summary": {
    "title": "診断の要約タイトル",
    "items": [
      { "model": "製品名", "description": "一言メモ" }
    ]
  },
  "advice": "セッティング全体の流れを良くするための具体的なアドバイス（番手の追加・削除、シャフトの重量調整など）"
}
\`\`\`
`;

    return prompt;
};
