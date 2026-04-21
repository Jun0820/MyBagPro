import type { UserProfile } from '../types/golf';
import { TargetCategory } from '../types/golf';
import { buildBallPromptCandidates, buildClubPromptCandidates } from './diagnosisCandidates';

const LATEST_CLUB_REFERENCE = `### 【2026年の最新クラブ参照ライン】
- TaylorMade: Qi35 / Qi35 LS / Qi35 MAX / Qi4D / Qi4D LS / Qi4D MAX
- Callaway: ELYTE Driver / ELYTE X / ELYTE Triple Diamond / ELYTE MAX FAST
- Ping: G440 MAX / G440 LST / G440 SFT / G440 K
- Titleist: GT2 / GT3 / GT4
- Cobra: DS-ADAPT LS / DS-ADAPT X / DS-ADAPT MAX-K / DS-ADAPT MAX-D
- Srixon: ZXi5 / ZXi7 / ZXi FW / ZXi Hybrid
- Mizuno: ST-MAX 230 / ST-Z 230 / ST-X 230 / JPX 925 Forged / JPX 925 Hot Metal
- Bridgestone: B3 MAX / B3 LS / B3 FW / 241CB / 242CB+

### 【2026年の最新アイアン参照ライン】
- TaylorMade: P790 (2025) / P770 (2025) / Qi
- Callaway: ELYTE Iron / ELYTE X Iron / Apex Ai200 / Apex Ai300 / Apex Pro (2024)
- Ping: i240 / i540 / Blueprint S / Blueprint T / G440
- Titleist: T100 / T150 / T200 / T350
- Srixon: ZXi5 / ZXi7 / Z-Forged II
- Mizuno: Mizuno Pro 241 / 243 / 245 / JPX 925 Forged / JPX 925 Hot Metal
- Bridgestone: 241CB / 242CB+ / 221CB / 222CB+

### 【2026年の最新ウェッジ・ボール参照ライン】
- Wedge: Vokey SM10 / Opus / Opus Platinum / s159 / s259 / MG4 / T24 / RTX 6 ZipCore / RM-W
- Ball: Pro V1 / Pro V1x / Chrome Tour / Chrome Tour X / TP5 / TP5x / TOUR B X / TOUR B XS / Z-Star / Z-Star XV

### 【2026年の最新シャフト参照ライン】
- Graphite Design: Tour AD GC / Tour AD VF / Tour AD CQ / Tour AD UB
- Fujikura: 26 VENTUS TR Blue / 26 VENTUS TR Black / 26 VENTUS TR Red / 24 VENTUS Blue / 24 VENTUS Black / 24 VENTUS Red / Speeder BOOST / Speeder NX Gold / Speeder NX Violet / Speeder NX FW / Speeder NX HB / New MCI / TRAVIL IRON
- Mitsubishi Chemical: Diamana RB / Diamana BB / Diamana WB / TENSEI 1K Black / Blue / White / Red / Pro Orange
- Nippon Shaft: N.S.PRO MODUS3 Tour 105 / 115 / 120 / 125 / 130 / 950GH neo / MODUS3 Hybrid GOST
- True Temper / Project X: Dynamic Gold Tour Issue / Dynamic Gold MID 90 / 100 / 115 / 130 Tour Issue / Project X IO / Denali Black / Blue / Red / Denali Frost Blue CB
- KBS: Tour / Tour V / C-Taper / $-Taper
`;

const LATEST_BALL_REFERENCE = `### 【2026年の最新ボール参照ライン】
- Titleist: Pro V1 / Pro V1x / Pro V1x Left Dash / AVX / Tour Soft / Velocity / TruFeel
- Callaway: Chrome Tour / Chrome Tour X / Chrome Tour Triple Diamond / Chrome Soft / ERC Soft / Supersoft
- TaylorMade: TP5 / TP5x / Tour Response / Tour Response Stripe / SpeedSoft
- Bridgestone: TOUR B X / TOUR B XS / TOUR B RX / TOUR B RXS / e12 HiLaunch / e12 Straight / e12 Speed
- Srixon: Z-STAR / Z-STAR XV / Z-STAR Diamond / Soft Feel
- Mizuno: RB Tour / RB Tour X / RB Max
- HONMA: TW-X

### 【ボール提案ルール】
- 2026年時点で現行販売・現行流通しているモデル名を優先する
- 旧モデルは「中古で安く試しやすい」「打感比較用」など明確な理由がある場合だけ補助候補として使う
`;

/**
 * ユーザーの診断プロファイルから、Gemini APIへ送信するためのプロンプト文字列を生成します。
 */
export const generateAiPrompt = (profile: UserProfile): string => {
    const isTotalSetting = profile.targetCategory === TargetCategory.TOTAL_SETTING;
    const clubCandidates = buildClubPromptCandidates(profile);

    let prompt = `あなたは世界最高峰のゴルフクラブフィッター10人と、ギアへのこだわりが強いシングルゴルファー100人の知恵を統合した最強のAIアドバイザー兼コンシェルジュです。
あなたの使命は、ユーザーのデータを精密に分析し、スコアアップに直結する「魔法のセッティング」を提案することです。

### 【診断の重要ルール（専門家10人×ユーザー100人の合議制）】
1. **重量フローの整合性**: 全ての番手の重量が、1WからSWまでスムーズに重くなるようチェックしてください。
2. **感情的ニーズの充足**: 「170ydを楽に打ちたい」「この1本が構えにくい」という個別の悩みに対し、物理スペックと感情の両面から解決策を提示してください。
3. **提案の正確性最優先**: 魅力的な表現より、正式名称と実在する候補だけを優先してください。
4. **現行モデル限定**: 基本は2026年時点の現行・実在モデルから提案してください。
5. **JSON厳守**: 出力は必ず指定のJSONフォーマットのみで行ってください。
6. **モデル名の正確性**: 存在しない仮称や曖昧な後継モデル名を作らず、現行正式モデル名だけを使ってください。
7. **シャフト名の正確性**: シャフトも現行正式名称を優先し、旧世代を提案する場合は「中古名器」や「継続使用理由」があるときだけにしてください。
8. **候補外禁止**: このあと提示する「使ってよい候補」にないモデル名・シャフト名は1文字たりとも出力しないでください。

---

${LATEST_CLUB_REFERENCE}

---

${clubCandidates}

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
  "aiResponseText": "診断の要点をMarkdownで簡潔にまとめてください。brand / modelName / shafts には必ず許可候補の正式名称だけを使ってください。",
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
    const ballCandidates = buildBallPromptCandidates();
    let prompt = `あなたは世界最高峰のゴルフボール・フィッティング・スペシャリストです。
全メーカーのボール構造（コア、カバー、ディンプル）と弾道計算理論を完璧にマスターしています。
ユーザーのヘッドスピード、スピン傾向、そして現在の「14本のクラブセッティング」を分析し、最もスコアを削れる「運命のボール」を1つ、そして代替案を2つ提案してください。

### 【診断の重要ルール】
1. **クラブとの連動**: ユーザーのMy Bagにあるウッドのロフトやアイアンのシャフト重量を考慮し、トータルパッケージとして最適なボールを提案してください。
2. **打感と数値の両立**: HSだけでなく、ユーザーが求める「打感」と、実際に必要な「スピン量・初速」のギャップを埋めるアドバイスをしてください。
3. **正式名称厳守**: ボール名は実在する正式名称だけを使ってください。
4. **JSON厳守**: 出力は必ず指定のJSONフォーマットのみで行ってください。
5. **候補外禁止**: このあと提示する候補にないボール名は出力しないでください。

---

${LATEST_BALL_REFERENCE}

---

${ballCandidates}

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
