import type { BallSpecs, BallPreferences, ShotData } from "../types/golf_ball";
import type { UserProfile } from "../types/golf";
import { MissType } from "../types/golf";
import { BALL_DB, calcPhysicsScore } from "./ball_data";

export interface BallDiagnosisResult {
    rank: number;
    ball: BallSpecs;
    score: number;
    physicsScore: number;      // 物理適合スコア
    matchReasons: string[];    // マッチした理由（数値的根拠付き）
    negativeReasons: string[]; // 注意点
    isCurrentGear?: boolean;   // 現在使用中のボールかどうか
    rankingExplanation?: string; // ランキング順位の説明
    radarChart: {
        distance: number;
        spin: number;
        feel: number;
        control: number;
        stability: number;
    };
}

/**
 * 高精度ボール診断ロジック（Gemini DB対応版）
 * 物理適合性: S_phys = 100 - |(HS × 2.1) - Comp|
 * D-Spin: スライス対策（低いほど曲がりにくい）
 * W-Spin: グリーン止め（高いほど止まる）
 * 弾道: 球の上がりやすさ
 */
export const calculateBallFits = (
    profile: UserProfile,
    shotData: ShotData | null,
    preferences: BallPreferences
): BallDiagnosisResult[] => {

    // 基準ヘッドスピードの決定 (計測データがあればそちらを優先)
    const effectiveHS = shotData?.headSpeed ?? profile.headSpeed;

    // ブランドフィルタリング (モードに応じて処理)
    let candidateBalls = BALL_DB;
    const brandMode = profile.brandPreferenceMode || 'any';
    const preferredBrands = profile.preferredBrands || [];

    console.log('[BALL_LOGIC] Brand Mode:', brandMode, 'Preferred:', preferredBrands);

    if (brandMode === 'strict' && preferredBrands.length > 0) {
        // strictモード: 選択ブランドのみ
        candidateBalls = BALL_DB.filter(ball =>
            preferredBrands.includes(ball.brand)
        );
        console.log('[BALL_LOGIC] Strict mode - Candidates:', candidateBalls.length);
    } else if (brandMode === 'preferred' && preferredBrands.length > 0) {
        // preferredモード: 優先ブランドはボーナス付与（後のスコアリングで処理）
        // 全ブランドを候補にするが、後でボーナスを付与
        candidateBalls = BALL_DB;
    }
    // anyモード: 全ブランドから選定（フィルタなし）

    // スコアリング
    const scoredBalls = candidateBalls.map(ball => {
        let score = 0;
        const reasons: string[] = [];
        const negatives: string[] = [];

        // === 1. 物理的適合性 (S_phys) ===
        // 公式: S_phys = 100 - |(HS × 2.1) - Comp|
        const physicsScore = calcPhysicsScore(effectiveHS, ball.compression);
        score += Math.max(0, physicsScore * 0.4); // 最大40点

        if (physicsScore >= 90) {
            reasons.push(`物理適合性: ${Math.round(physicsScore)}点（あなたのHS ${effectiveHS}m/sに最適）`);
        } else if (physicsScore >= 70) {
            reasons.push(`物理適合性: ${Math.round(physicsScore)}点（許容範囲内）`);
        } else if (physicsScore < 50) {
            negatives.push(`物理適合性: ${Math.round(physicsScore)}点（HSに対して${ball.compression > effectiveHS * 2.1 ? '硬すぎ' : '柔らかすぎ'}の可能性）`);
        }

        // === 2. HS範囲チェック ===
        if (effectiveHS >= ball.recommendedHeadSpeed.min && effectiveHS <= ball.recommendedHeadSpeed.max) {
            score += 15;
        } else if (effectiveHS < ball.recommendedHeadSpeed.min) {
            score -= 10;
            negatives.push(`推奨HS ${ball.recommendedHeadSpeed.min}m/s〜のため、少し硬く感じる可能性`);
        } else {
            score -= 5;
            negatives.push(`あなたのパワーに対して柔らかすぎる可能性`);
        }

        // === 3. D-Spin（ドライバースピン）マッチング ===
        // スライス悩み → D-Spin低いほど高スコア
        if (profile.missTendencies.includes(MissType.SLICE)) {
            if (ball.dSpinIndex <= 20) {
                score += 25;
                reasons.push(`D-Spin: ${ball.dSpinIndex}（低スピンでスライスを抑制）`);
            } else if (ball.dSpinIndex <= 30) {
                score += 15;
                reasons.push(`D-Spin: ${ball.dSpinIndex}（中程度のスピンでバランス良し）`);
            } else {
                score -= 5;
                negatives.push(`D-Spin: ${ball.dSpinIndex}（高スピンでスライスが増幅する可能性）`);
            }
        }

        // フック悩み → D-Spin高めでも問題なし
        if (profile.missTendencies.includes(MissType.HOOK)) {
            if (ball.dSpinIndex <= 25) {
                score += 15;
                reasons.push(`D-Spin: ${ball.dSpinIndex}（低スピンで方向性安定）`);
            }
        }

        // 飛距離優先 → D-Spin低いほど良い
        if (preferences.priority === 'DISTANCE') {
            if (ball.dSpinIndex <= 18) {
                score += 20;
                reasons.push(`D-Spin: ${ball.dSpinIndex}（超低スピンで飛距離最大化）`);
            } else if (ball.dSpinIndex <= 25) {
                score += 10;
            }
        }

        // === 4. W-Spin（ウェッジスピン）マッチング ===
        // スピン優先 → W-Spin高いほど良い
        if (preferences.priority === 'SPIN') {
            if (ball.wSpinIndex >= 95) {
                score += 25;
                reasons.push(`W-Spin: ${ball.wSpinIndex}（最高レベルのグリーン止め性能）`);
            } else if (ball.wSpinIndex >= 85) {
                score += 15;
                reasons.push(`W-Spin: ${ball.wSpinIndex}（高スピンでグリーンで止まる）`);
            }
        } else {
            // 通常でもW-Spin考慮
            if (ball.wSpinIndex >= 90) {
                score += 10;
            }
        }

        // === 5. 弾道マッチング ===
        // 球が上がらない悩み → 弾道高いほど良い
        if (profile.missTendencies.includes(MissType.LOW_TRAJECTORY)) {
            if (ball.trajectoryIndex >= 75) {
                score += 20;
                reasons.push(`弾道: ${ball.trajectoryIndex}（高弾道で球が上がりやすい）`);
            } else if (ball.trajectoryIndex >= 60) {
                score += 10;
            }
        }

        // === 6. 打感マッチング ===
        // コンプレッションから打感を推定
        const estimatedFeel = ball.compression <= 70 ? 'VERY_SOFT' :
            ball.compression <= 85 ? 'SOFT' :
                ball.compression <= 95 ? 'FIRM' : 'VERY_FIRM';

        if (preferences.preferredFeel === 'VERY_SOFT' && estimatedFeel === 'VERY_SOFT') {
            score += 15;
            reasons.push(`打感: 非常にソフトな打感`);
        } else if (preferences.preferredFeel === 'SOFT' && (estimatedFeel === 'SOFT' || estimatedFeel === 'VERY_SOFT')) {
            score += 15;
            reasons.push(`打感: ソフトな打感`);
        } else if (preferences.preferredFeel === 'FIRM' && (estimatedFeel === 'FIRM' || estimatedFeel === 'VERY_FIRM')) {
            score += 15;
            reasons.push(`打感: しっかりした打感`);
        }

        // === 8. カバー素材ボーナス ===
        if (ball.coverMaterial === 'URETHANE') {
            score += 5; // ウレタンは操作性が高い
        }

        // === 9. プロ使用ボーナス ===
        if (ball.usedByPros.length > 0) {
            score += 5;
            // 有名プロの名前を理由に追加
            const famousPros = ball.usedByPros.slice(0, 2).join('、');
            if (famousPros) {
                reasons.push(`使用プロ: ${famousPros}など`);
            }
        }

        // === 10. 優先ブランドボーナス (preferredモード) ===
        if (brandMode === 'preferred' && preferredBrands.includes(ball.brand)) {
            score += 15;
            reasons.push(`お気に入りブランド: ${ball.brand}`);
        }

        return {
            rank: 0,
            ball,
            score,
            physicsScore,
            matchReasons: reasons,
            negativeReasons: negatives,
            radarChart: {
                distance: Math.min(10, Math.round((100 - ball.dSpinIndex) / 10)), // D-Spin低い＝飛ぶ
                spin: Math.min(10, Math.round(ball.wSpinIndex / 10)),             // W-Spin高い＝スピン
                feel: Math.min(10, Math.round((110 - ball.compression) / 10)),    // Comp低い＝ソフト
                control: ball.coverMaterial === 'URETHANE' ? 9 : 7,               // ウレタン＝操作性高
                stability: Math.min(10, Math.round((60 - ball.dSpinIndex) / 5))   // D-Spin低い＝安定
            }
        };
    });

    // ソートしてランク付け
    const sorted = scoredBalls.sort((a, b) => b.score - a.score);

    // 現在使用中のボールを検出
    const currentBrand = profile.currentBrand?.toLowerCase() || '';
    const currentModel = profile.currentModel?.toLowerCase() || '';

    // ランキング説明を生成
    const generateRankingExplanation = (res: typeof sorted[0], idx: number, allResults: typeof sorted): string => {
        if (idx === 0) {
            return '総合適合度が最も高いモデルです';
        }
        // 1位との差分で説明を変える
        const topScore = allResults[0].score;
        const scoreDiff = topScore - res.score;

        if (res.physicsScore > allResults[0].physicsScore) {
            return `物理適合性は最高（${Math.round(res.physicsScore)}点）ですが、他の要素で差が出ました`;
        }
        if (res.ball.wSpinIndex > allResults[0].ball.wSpinIndex) {
            return 'スピン性能重視ならこちらも◎';
        }
        if (res.ball.dSpinIndex < allResults[0].ball.dSpinIndex) {
            return '飛距離重視ならおすすめ';
        }
        if (scoreDiff < 5) {
            return '1位とほぼ同等の適合度です';
        }
        return 'バランスの取れた選択肢です';
    };

    return sorted.map((res, idx) => {
        // 現在使用中のボールかチェック
        const isCurrentGear = !!(currentBrand && currentModel &&
            (res.ball.brand.toLowerCase().includes(currentBrand) || currentBrand.includes(res.ball.brand.toLowerCase())) &&
            (res.ball.modelName.toLowerCase().includes(currentModel) || currentModel.includes(res.ball.modelName.toLowerCase())));

        return {
            ...res,
            rank: idx + 1,
            isCurrentGear,
            rankingExplanation: generateRankingExplanation(res, idx, sorted)
        };
    }).slice(0, 3); // Top 3
};

/**
 * 現在使用中のボールを分析する（物理パラメーター対応版）
 */
export const analyzeCurrentBall = (
    profile: UserProfile,
    shotData: ShotData | null,
    _preferences: BallPreferences
) => {
    const brand = profile.currentBrand?.toLowerCase() || '';
    const model = profile.currentModel?.toLowerCase() || '';

    if (!brand || !model || brand === 'unknown' || model === 'unknown') {
        return {
            matchPercentage: 50,
            typeDescription: "現在のボール未設定",
            pros: "診断結果を参考に、最適なボールをお選びください。",
            cons: ""
        };
    }

    // DBから検索 (完全一致または部分一致)
    const currentBall = BALL_DB.find(b =>
        (b.brand.toLowerCase() === brand || brand.includes(b.brand.toLowerCase())) &&
        (model.includes(b.modelName.toLowerCase()) || b.modelName.toLowerCase().includes(model))
    );

    if (!currentBall) {
        return {
            matchPercentage: 50,
            typeDescription: `${profile.currentBrand || ''} ${profile.currentModel || ''}`,
            pros: "詳細データ未登録のためスコア算出不可。おすすめモデルと比較してご確認ください。",
            cons: ""
        };
    }

    const effectiveHS = shotData?.headSpeed ?? profile.headSpeed;
    const physicsScore = calcPhysicsScore(effectiveHS, currentBall.compression);
    const pros: string[] = [];
    const cons: string[] = [];

    // 物理適合性
    if (physicsScore >= 80) {
        pros.push(`物理適合性: ${Math.round(physicsScore)}点（HS ${effectiveHS}m/sに最適）`);
    } else if (physicsScore < 60) {
        cons.push(`物理適合性: ${Math.round(physicsScore)}点（最適ではない可能性）`);
    }

    // D-Spin
    if (profile.missTendencies.includes(MissType.SLICE)) {
        if (currentBall.dSpinIndex <= 25) {
            pros.push(`D-Spin: ${currentBall.dSpinIndex}（スライス抑制に効果的）`);
        } else {
            cons.push(`D-Spin: ${currentBall.dSpinIndex}（スライス対策には低D-Spinボールを推奨）`);
        }
    }

    // W-Spin
    if (currentBall.wSpinIndex >= 90) {
        pros.push(`W-Spin: ${currentBall.wSpinIndex}（高いスピン性能）`);
    }

    const matchPercentage = Math.min(99, Math.max(10, Math.round(physicsScore * 0.8 + 20)));

    return {
        matchPercentage,
        typeDescription: `${currentBall.brand} ${currentBall.modelName}`,
        pros: pros.length > 0 ? pros.join('。') : "現在のボールを使用中。",
        cons: cons.length > 0 ? cons.join('。') : ""
    };
};
