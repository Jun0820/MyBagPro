import { generatePhysicsBasedDiagnosis } from './diagnosis_logic';
import type { UserProfile } from '../types/golf';
import { generateAiPrompt } from './aiPromptGenerator';

export const generateFittingDiagnosis = async (profile: UserProfile, _apiKey: string) => {
    console.log("Generating Physics-Based Diagnosis (API Free Mode)...");
    
    // [TODO: Fetch from ChatGPT API using this prompt]
    const prompt = generateAiPrompt(profile);
    console.log("----- [AI PROMPT GENERATED] -----");
    console.log(prompt);
    console.log("---------------------------------");

    // Simulate slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generatePhysicsBasedDiagnosis(profile);
    // AIの生成プロンプトをデバッグ用に保持
    result.aiPromptText = prompt;
    
    // UI構築用のダミーAIレスポンス（OpenAI API繋ぎ込み前のモック）
    result.aiResponseText = `
## 🎯 診断サマリー
あなたのスイングデータ（HS約${profile.headSpeed}m/s）と「${profile.missTendencies.length > 0 ? profile.missTendencies.join('、') : '飛距離不足'}」という悩みを分析しました。
インパクトでのフェースの開きや打点のブレが課題です。適度な重心角とつかまりの良いシャフトを組み合わせることで、フェアウェイキープ率と平均飛距離が劇的に向上します。

## 🏆 ベストマッチ提案（メイン）
- **ヘッド**: PING G430 MAX
- **ロフト角**: 10.5度
- **シャフト**: Fujikura Speeder NX Green 50-SR
- **おすすめの理由**: G430 MAXの圧倒的なMOI（慣性モーメント）が打点のブレをカバーし、Speeder NX Greenの手元の安定感と先端の適度な走りがインパクトでのフェース角をスクエアに導きます。ミスを軽減しつつ、初速を最大化できる現在の最高峰の組み合わせです。

## ⏳ 専門家が厳選する中古名器（2年以上前のモデル）
- **ヘッド**: Callaway EPIC SPEED
- **ロフト角**: 10.5度
- **シャフト**: Tour AD HD-5 (S)
- **おすすめの理由**: 2021年の名器です。空気抵抗を減らしたジェイルブレイクフレーム設計でヘッドスピードを底上げし、先端剛性が高いHDシャフトが余計なスピンや左への引っかけを防ぎつつ強い弾道を生み出します。中古市場（GDO等）でも手頃な価格帯で手に入る非常に完成度の高いセッティングです。

## ⚙️ セッティングのワンポイントアドバイス
- 現在お使いのクラブより少しだけ短く握る（指1本分）ことで、ミート率が上がりシャフトの恩恵をより受けやすくなります。スリーブ調整機能がある場合は「Draw」または「Upright」ポジションから試してみてください。
    `;
    
    return { result, groundingMetadata: null };
};
