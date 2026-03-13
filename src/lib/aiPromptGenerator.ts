import type { UserProfile } from '../types/golf';
import { DiagnosisMode } from '../types/golf';

/**
 * ユーザーの診断プロファイルから、ChatGPTなどのAIへ送信するためのプロンプト文字列を生成します。
 */
export const generateAiPrompt = (profile: UserProfile): string => {
    let prompt = `あなたはプロのゴルフクラブフィッターであり、PGAツアーレベルの知識を持つギアの専門家です。
以下の分析データに基づいて、ユーザーに「最も適した具体的なゴルフクラブのモデルとシャフトの組み合わせ」を提案してください。

【重要ルール】
1. 抽象的なスペック（例：「スピン量が少ないヘッド」）だけでなく、必ず「具体的な製品名（例：TaylorMade SIM2 MAX, Titleist TSR2）」を複数提案すること。
2. 提案するモデルは、過去10年程度の名器から最新モデル（2026年モデル含む）まで幅広く対象とし、コストパフォーマンスの高い中古モデルも1つは入れること。
3. ユーザーの悩みや傾向に対して、なぜそのクラブが合うのかの「物理的・力学的な理由」を必ず添えること。
4. Markdown形式で、読みやすく出力すること。

---

### 【ユーザープロファイル】
- **診断対象**: ${profile.targetCategory || '総合'}
- **年齢層**: ${profile.age || '未回答'} / **性別**: ${profile.gender || '指定なし'}
- **ゴルフ歴**: ${profile.skillLevel || '未回答'}
- **現在の悩み**: ${profile.missTendencies.length > 0 ? profile.missTendencies.join(', ') : '特になし'}
- **スイングテンポ**: ${profile.swingTempo || '未回答'}
- **ヘッドスピード**: ${profile.headSpeed ? `約${profile.headSpeed} m/s` : '未回答'}
`;

    // 診断モードによる情報追加
    if (profile.diagnosisMode === DiagnosisMode.FULL_SPEC) {
        prompt += `- **現在の使用クラブ**: ${profile.currentBrand || ''} ${profile.currentModel || ''}\n`;
        prompt += `- **現在のシャフト**: ${profile.currentShaftModel || ''} ${profile.currentShaftWeight || ''} ${profile.currentShaftFlex || ''}\n`;
        prompt += `- **現在のロフト角**: ${profile.currentLoft || ''}\n`;
    }

    // こだわりメーカー
    if (profile.brandPreferenceMode !== 'any' && profile.preferredBrands && profile.preferredBrands.length > 0) {
        const modeText = profile.brandPreferenceMode === 'strict' ? '（必須条件）' : '（できれば）';
        prompt += `- **希望するメーカー**: ${profile.preferredBrands.join(', ')} ${modeText}\n`;
    }

    if (profile.preferredShaftBrands && profile.preferredShaftBrands.length > 0) {
        prompt += `- **希望するシャフトメーカー**: ${profile.preferredShaftBrands.join(', ')}\n`;
    }

    // ゴルフカテゴリ固有の要望
    prompt += `\n### 【ショットの傾向と理想】\n`;
    if (profile.trajectoryHeight) prompt += `- **現在の弾道高さ**: ${profile.trajectoryHeight}\n`;
    if (profile.idealTrajectory) prompt += `- **理想の弾道**: ${profile.idealTrajectory}\n`;
    if (profile.preferredBallFlight) prompt += `- **好みの球筋**: ${profile.preferredBallFlight}\n`;
    if (profile.impactStyle) prompt += `- **インパクトの傾向**: ${profile.impactStyle}\n`;

    // コメント
    if (profile.freeComments) {
        prompt += `\n### 【ユーザーからの特記事項・要望】\n${profile.freeComments}\n`;
    }

    prompt += `
---
上記のデータをもとに、以下の構成で出力してください：

## 🎯 診断サマリー
ユーザーのスイング傾向や悩みの根本原因の分析（簡潔に）。

## 🏆 ベストマッチ提案（メイン）
- **ヘッド**: 具体的な製品名（例: PING G430 MAX）
- **ロフト角**: おすすめのロフト
- **シャフト**: 具体的な製品名とスペック（例: Fujikura VENTUS TR BLUE 5-S）
- **おすすめの理由**: なぜこの組み合わせが悩みを解決するのか

## ⏳ 専門家が厳選する中古名器（2年以上前のモデル）
- 発売から2年以上経過し、価格も落ち着きながら現在の悩みを解決できる「名器」と呼ばれるヘッドとシャフトの組み合わせ。中古市場（GDO等）で探しやすいモデルを1つ厳選してください。

## ⚙️ セッティングのワンポイントアドバイス
- 鉛の貼り方、可変スリーブの調整方法、またはスイング上の注意点など。
`;

    return prompt;
};
