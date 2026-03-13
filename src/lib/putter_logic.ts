// パター診断ロジック (Odyssey/Ping式ストローク分析準拠)

import type { UserProfile } from '../types/golf';

// ===== パター診断用の型定義 =====
export interface PutterProfile {
    strokeType: 'straight' | 'slight_arc' | 'strong_arc' | 'unknown';
    gripStyle: 'armlock' | 'reverse_overlap' | 'claw' | 'conventional';
    distanceIssue: 'short' | 'long' | 'none';
    shortPuttIssue: 'push' | 'pull' | 'none';
    preferredFeel: 'soft' | 'firm';
    currentShape: 'blade' | 'mallet' | 'neo_mallet' | 'unknown';
    putterLength: number;  // インチ
    freeComments?: string; // フリーコメント
}

export interface PutterRecommendation {
    modelName: string;
    brand: string;
    headShape: string;
    neckType: string;
    hangAngle: number;  // トゥハング角度
    insertType: string;
    score: number;
    reasoning: string[];
    lengthRecommendation: string;
    priceEstimate: string;
    characteristics: {
        forgiveness: number;  // 1-10
        feel: number;  // 1-10 (高い=ソフト)
        alignment: number;  // 1-10
        control: number;  // 1-10
    };
}

// ===== ストロークタイプから推奨形状を決定 =====
export const recommendHeadShape = (
    strokeType: 'straight' | 'slight_arc' | 'strong_arc' | 'unknown'
): { shape: string; hangAngle: number; reason: string }[] => {
    switch (strokeType) {
        case 'straight':
            return [
                { shape: 'neo_mallet', hangAngle: 0, reason: 'フェースバランスで真っすぐ引いて真っすぐ出せる' },
                { shape: 'mallet', hangAngle: 15, reason: '高MOIで方向性が安定' }
            ];
        case 'slight_arc':
            return [
                { shape: 'mallet', hangAngle: 25, reason: 'セミアークで適度なトゥハングが自然なストロークをサポート' },
                { shape: 'neo_mallet', hangAngle: 20, reason: '寛容性と操作性のバランス' }
            ];
        case 'strong_arc':
            return [
                { shape: 'blade', hangAngle: 45, reason: 'トゥハングが自然なフェースローテーションを促進' },
                { shape: 'mallet', hangAngle: 35, reason: '操作性を維持しつつ安定感' }
            ];
        case 'unknown':
        default:
            return [
                { shape: 'mallet', hangAngle: 25, reason: '万能型で多くのストロークに対応' },
                { shape: 'neo_mallet', hangAngle: 0, reason: '寛容性が高く初心者にも安心' }
            ];
    }
};

// ===== パットの悩みから推奨を調整 =====
export const adjustForIssues = (
    distanceIssue: 'short' | 'long' | 'none',
    shortPuttIssue: 'push' | 'pull' | 'none'
): { insertType: string; reason: string; moiBonus: number } => {
    let insertType = 'ミルドフェース';
    let reason = '距離感の打ち分けがしやすい';
    let moiBonus = 0;

    // 距離感の悩み
    if (distanceIssue === 'short') {
        // ショートしがち → 反発の良いインサート
        insertType = 'ソフトインサート (White Hot)';
        reason = '反発が良く転がりが伸びる';
    } else if (distanceIssue === 'long') {
        // オーバーしがち → 柔らかいインサート
        insertType = 'マイクロヒンジインサート';
        reason = '打感がソフトで距離が出過ぎない';
    }

    // ショートパットの悩み
    if (shortPuttIssue === 'push' || shortPuttIssue === 'pull') {
        // 方向性の問題 → 高MOI推奨
        moiBonus = 10;
        reason += '。高MOIで打点ブレに強い';
    }

    return { insertType, reason, moiBonus };
};

// ===== ネック形状から推奨 =====
export const getNeckTypeFromHang = (hangAngle: number): string => {
    if (hangAngle <= 10) return 'センターシャフト / フェースバランス';
    if (hangAngle <= 25) return 'スラントネック / セミアーク';
    if (hangAngle <= 35) return 'ショートスラント';
    return 'クランクネック / プランバーネック';
};

// ===== パターデータベース =====
export const PUTTER_DB = [
    // Scotty Cameron
    {
        id: 'SC_NEWPORT_2024',
        brand: 'Scotty Cameron',
        model: 'Super Select Newport',
        shape: 'blade',
        neckType: 'クランクネック',
        hangAngle: 45,
        insertType: 'ミルドフェース',
        moi: 3500,
        price: 68200,
        characteristics: { forgiveness: 5, feel: 8, alignment: 6, control: 10 }
    },
    {
        id: 'SC_NEWPORT2_2024',
        brand: 'Scotty Cameron',
        model: 'Super Select Newport 2',
        shape: 'blade',
        neckType: 'ショートスラント',
        hangAngle: 35,
        insertType: 'ミルドフェース',
        moi: 3800,
        price: 68200,
        characteristics: { forgiveness: 6, feel: 8, alignment: 7, control: 9 }
    },
    {
        id: 'SC_PHANTOM_5_2024',
        brand: 'Scotty Cameron',
        model: 'Phantom X 5',
        shape: 'mallet',
        neckType: 'スラントネック',
        hangAngle: 25,
        insertType: 'ミルドフェース',
        moi: 5500,
        price: 74800,
        characteristics: { forgiveness: 8, feel: 7, alignment: 9, control: 7 }
    },
    {
        id: 'SC_PHANTOM_9_2024',
        brand: 'Scotty Cameron',
        model: 'Phantom X 9',
        shape: 'neo_mallet',
        neckType: 'センターシャフト',
        hangAngle: 0,
        insertType: 'ミルドフェース',
        moi: 6500,
        price: 74800,
        characteristics: { forgiveness: 9, feel: 6, alignment: 10, control: 6 }
    },

    // Odyssey
    {
        id: 'ODY_ELEVEN_2M',
        brand: 'Odyssey',
        model: 'Eleven 2M',
        shape: 'neo_mallet',
        neckType: 'ダブルベンド',
        hangAngle: 0,
        insertType: 'White Hot インサート',
        moi: 7000,
        price: 44000,
        characteristics: { forgiveness: 10, feel: 9, alignment: 9, control: 5 }
    },
    {
        id: 'ODY_TRIHOT_2_2024',
        brand: 'Odyssey',
        model: 'Tri-Hot 5K #2',
        shape: 'blade',
        neckType: 'クランクネック',
        hangAngle: 40,
        insertType: 'White Hot インサート',
        moi: 5000,
        price: 55000,
        characteristics: { forgiveness: 7, feel: 9, alignment: 7, control: 8 }
    },
    {
        id: 'ODY_TRIHOT_7_2024',
        brand: 'Odyssey',
        model: 'Tri-Hot 5K #7',
        shape: 'mallet',
        neckType: 'ショートスラント',
        hangAngle: 25,
        insertType: 'White Hot インサート',
        moi: 5500,
        price: 55000,
        characteristics: { forgiveness: 8, feel: 9, alignment: 8, control: 7 }
    },
    {
        id: 'ODY_AI_ONE_7_2024',
        brand: 'Odyssey',
        model: 'Ai-ONE #7',
        shape: 'mallet',
        neckType: 'ダブルベンド',
        hangAngle: 15,
        insertType: 'Ai-ONE インサート',
        moi: 6000,
        price: 49500,
        characteristics: { forgiveness: 9, feel: 8, alignment: 9, control: 6 }
    },

    // Ping
    {
        id: 'PING_ANSER_2D_2023',
        brand: 'Ping',
        model: '2023 ANSER 2D',
        shape: 'blade',
        neckType: 'クランクネック',
        hangAngle: 42,
        insertType: 'PEBAXインサート',
        moi: 4000,
        price: 49500,
        characteristics: { forgiveness: 6, feel: 8, alignment: 6, control: 9 }
    },
    {
        id: 'PING_PLD_TYNE4_2023',
        brand: 'Ping',
        model: 'PLD Milled Tyne 4',
        shape: 'neo_mallet',
        neckType: 'センターシャフト',
        hangAngle: 0,
        insertType: 'ミルドフェース',
        moi: 6500,
        price: 77000,
        characteristics: { forgiveness: 10, feel: 7, alignment: 10, control: 5 }
    },
    {
        id: 'PING_DS72_2023',
        brand: 'Ping',
        model: 'DS 72',
        shape: 'mallet',
        neckType: 'ショートスラント',
        hangAngle: 22,
        insertType: 'PEBAXインサート',
        moi: 5200,
        price: 49500,
        characteristics: { forgiveness: 8, feel: 8, alignment: 8, control: 7 }
    },

    // TaylorMade
    {
        id: 'TM_SPIDER_GTX_2024',
        brand: 'TaylorMade',
        model: 'Spider GTx',
        shape: 'neo_mallet',
        neckType: 'シングルベンド',
        hangAngle: 10,
        insertType: 'Pure Roll インサート',
        moi: 6000,
        price: 41800,
        characteristics: { forgiveness: 9, feel: 7, alignment: 9, control: 6 }
    },
    {
        id: 'TM_TP_RESERVE_B11_2024',
        brand: 'TaylorMade',
        model: 'TP Reserve B11',
        shape: 'blade',
        neckType: 'クランクネック',
        hangAngle: 45,
        insertType: 'ミルドフェース',
        moi: 3500,
        price: 55000,
        characteristics: { forgiveness: 5, feel: 9, alignment: 6, control: 10 }
    },
];

// ===== メイン診断関数 =====
export const calculatePutterFits = (
    profile: UserProfile,
    putterProfile: PutterProfile
): PutterRecommendation[] => {
    // 1. ストロークタイプから推奨形状を決定
    const shapeRecommendations = recommendHeadShape(putterProfile.strokeType);

    // 2. 悩みから調整
    const { insertType: _recommendedInsert, reason: _issueReason, moiBonus } = adjustForIssues(
        putterProfile.distanceIssue,
        putterProfile.shortPuttIssue
    );

    // 3. DBからマッチング
    const scored = PUTTER_DB.map(putter => {
        let score = 60;  // ベーススコア
        const reasons: string[] = [];

        // DEBUG LOG
        if (putter.brand.includes('Ping')) console.log(`[DEBUG-PING] Checking ${putter.model} (${putter.brand}). Initial Score: 60`);

        // 形状適合性
        const matchingShape = shapeRecommendations.find(r => r.shape === putter.shape);
        if (matchingShape) {
            score += 20;
            reasons.push(matchingShape.reason);

            // ハング角の近さもチェック
            const hangDiff = Math.abs(putter.hangAngle - matchingShape.hangAngle);
            if (hangDiff <= 5) {
                score += 10;
            } else if (hangDiff <= 15) {
                score += 5;
            }
        }

        // MOIボーナス (方向性の悩みがある場合)
        if (moiBonus > 0 && putter.moi >= 5500) {
            score += moiBonus;
            reasons.push('高MOIで打点ブレに強い');
        }

        // 打感の好み
        if (putterProfile.preferredFeel === 'soft' && putter.insertType.includes('インサート')) {
            score += 10;
            reasons.push('ソフトインサートで好みの打感');
        } else if (putterProfile.preferredFeel === 'firm' && putter.insertType.includes('ミルド')) {
            score += 10;
            reasons.push('ミルドフェースでしっかりした打感');
        }

        // ブランドボーナス
        if (profile.preferredBrands?.includes(putter.brand)) {
            score += 5;
        }

        // フリーコメント分析
        if (putterProfile.freeComments) {
            const comments = putterProfile.freeComments.toLowerCase();
            const brand = putter.brand.toLowerCase();

            // Brand Boost
            if (comments.includes(brand)) {
                score += 50; // Increased from 20 to ensure it tops the list
                reasons.push(`コメントで指定されたブランド: ${putter.brand}`);
            }

            // Keyword Boosts
            if (comments.includes('安定') || comments.includes('優しさ') || comments.includes('easy')) {
                if (putter.characteristics.forgiveness >= 8) {
                    score += 10;
                    reasons.push('寛容性を重視');
                }
            }
            if (comments.includes('打感') || comments.includes('soft') || comments.includes('feel')) {
                if (putter.characteristics.feel >= 8) {
                    score += 10;
                    reasons.push('打感を重視');
                }
            }
            if (comments.includes('操作') || comments.includes('control')) {
                if (putter.characteristics.control >= 8) {
                    score += 10;
                    reasons.push('操作性を重視');
                }
            }
        }

        return {
            modelName: putter.model,
            brand: putter.brand,
            headShape: putter.shape === 'blade' ? 'ブレード' :
                putter.shape === 'mallet' ? 'マレット' : 'ネオマレット',
            neckType: putter.neckType,
            hangAngle: putter.hangAngle,
            insertType: putter.insertType,
            score: score, // Removed cap to allow sorting by >100 scores
            reasoning: reasons,
            lengthRecommendation: `${putterProfile.putterLength || 34}インチ`,
            priceEstimate: `¥${putter.price.toLocaleString()}`,
            characteristics: putter.characteristics
        };
    });

    // スコア順にソート、Top 3
    scored.sort((a, b) => b.score - a.score);

    // Return Top 3 with capped score for display
    return scored.slice(0, 3).map(p => ({
        ...p,
        score: Math.min(99, p.score)
    }));
};

// ===== ストロークタイプ推定 (質問がわからない場合) =====
export const estimateStrokeType = (
    currentShape: 'blade' | 'mallet' | 'neo_mallet' | 'unknown',
    shortPuttIssue: 'push' | 'pull' | 'none'
): 'straight' | 'slight_arc' | 'strong_arc' | 'unknown' => {
    // 現在の形状からストロークを推定
    if (currentShape === 'neo_mallet') {
        return 'straight';  // ネオマレット使用者はストレート軌道が多い
    } else if (currentShape === 'blade') {
        return 'strong_arc';  // ブレード使用者はアーク軌道が多い
    } else if (currentShape === 'mallet') {
        return 'slight_arc';  // マレットは中間
    }

    // 形状不明な場合、ミスパターンから推定
    if (shortPuttIssue === 'push') {
        // 押し出し → アーク軌道でフェースが開きやすい
        return 'strong_arc';
    } else if (shortPuttIssue === 'pull') {
        // 引っかけ → ストレート軌道でフェースが閉じやすい
        return 'straight';
    }

    return 'unknown';
};
