// ウェッジ診断ロジック (Vokey Wedge Selector準拠)
// JGGA 60度法表記対応

import type { UserProfile } from '../types/golf';


// ===== ウェッジ診断用の型定義 =====
export interface WedgeProfile {
    diagnosisMode: 'ADD' | 'REPLACE'; // 診断モード
    targetLoft?: number; // ADDモード時のターゲットロフト
    handicap: 'scratch' | 'single' | 'mid' | 'high' | 'beginner';
    pwLoft: number | null;  // PWロフト角
    highestLoft: 56 | 58 | 60 | null; // 最も寝ているロフト
    divotDepth: 'shallow' | 'normal' | 'deep';  // ディボット傾向
    fairwayCondition: 'firm' | 'normal' | 'soft'; // フェアウェイコンディション
    bunkerCondition: 'firm' | 'normal' | 'soft';  // バンカーコンディション
    bunkerSkill: 'confident' | 'normal' | 'not_confident'; // バンカー得意度
    shotType: 'square' | 'open_face' | 'various'; // ショットタイプ (旧)
    ironShaftType: 'steel' | 'carbon' | 'unknown';
    wedgeUsage?: {
        pw: ('FULL' | 'GREENSIDE')[];
        gw: ('FULL' | 'GREENSIDE')[];
        sw: ('FULL' | 'GREENSIDE' | 'OPEN_FACE' | 'BUNKER')[];
        lw: ('FULL' | 'GREENSIDE' | 'OPEN_FACE' | 'BUNKER')[];
    };
    freeComments?: string; // フリーコメント
}


export interface WedgeUsageByLoft {
    gap?: ('full' | 'greenside')[];
    sand?: ('full' | 'greenside' | 'open' | 'bunker')[];
    lob?: ('full' | 'greenside' | 'open' | 'bunker')[];
}

export interface WedgeRecommendation {
    loft: number;
    bounce: number;
    grind: string;
    grindDescription: string;
    modelName: string;
    brand: string;
    score: number;
    reasoning: string[];
    shaftRecommendation: string;
    priceEstimate: string;
    setRecommendation?: string; // e.g. "Matching 50°/54°/58°"
}

// ===== バウンス推奨ロジック (Vokey Style) =====
export const recommendBounce = (
    profile: WedgeProfile,
    loft: number
): number => {
    // 1. スイングタイプ（最重要）
    let baseBounce = 10;
    if (profile.divotDepth === 'deep') baseBounce = 12; // Digger -> High Bounce
    if (profile.divotDepth === 'shallow') baseBounce = 6;  // Sweeper -> Low Bounce

    // 2. コンディション補正
    if (profile.fairwayCondition === 'soft') baseBounce += 2;
    if (profile.fairwayCondition === 'firm') baseBounce -= 2;

    // 3. バンカーコンディション補正 (SW/LWのみ)
    if (loft >= 54) {
        if (profile.bunkerCondition === 'soft') baseBounce += 2;
        if (profile.bunkerCondition === 'firm') baseBounce -= 2;

        // バンカー苦手 -> バウンス多め推奨
        if (profile.bunkerSkill === 'not_confident') baseBounce = Math.max(baseBounce, 12);
    }

    // 58-60度のLWはバウンス控えめが一般的だが、条件によっては高くする
    if (loft >= 58 && profile.divotDepth === 'shallow' && profile.fairwayCondition === 'firm') {
        return Math.max(4, baseBounce); // ローバウンス維持
    }

    return Math.max(4, Math.min(14, baseBounce));
};

// ===== グラインドタイプの定義 =====
type GrindType = 'LOW' | 'MID' | 'HIGH' | 'WIDE' | 'FULL';

// メーカーごとのグラインドを共通タイプに変換
export const getGrindType = (brand: string, grind: string): GrindType => {
    const g = grind.toUpperCase();

    // Titleist (Vokey)
    if (brand === 'Titleist') {
        if (g === 'L' || g === 'T') return 'LOW';
        if (g === 'M' || g === 'S') return 'MID';
        if (g === 'F') return 'FULL';
        if (g === 'D') return 'HIGH';
        if (g === 'K') return 'WIDE';
    }

    // Callaway
    if (brand === 'Callaway') {
        if (g === 'Z') return 'LOW';
        if (g === 'S') return 'MID'; // Standard
        if (g === 'W') return 'WIDE';
        if (g === 'X') return 'HIGH';
    }

    // Cleveland
    if (brand === 'Cleveland') {
        if (g === 'LOW') return 'LOW';
        if (g === 'MID') return 'MID';
        if (g === 'FULL') return 'FULL';
    }

    // TaylorMade
    if (brand === 'TaylorMade') {
        if (g === 'LB') return 'LOW';
        if (g === 'SB') return 'MID'; // Standard
        if (g === 'HB') return 'HIGH';
    }

    // Ping
    if (brand === 'Ping') {
        if (g === 'T') return 'LOW';
        if (g === 'S') return 'MID';
        if (g === 'W') return 'WIDE';
        if (g === 'E') return 'HIGH'; // Eye2 (Unique but treats as High/Wide)
    }

    return 'MID'; // Default
};


// ===== ソールグラインド推奨ロジック (Generic Updated) =====
export const recommendGrind = (
    profile: WedgeProfile,
    loft: number
): { types: GrindType[]; description: string } => {
    const { divotDepth, bunkerSkill, fairwayCondition, wedgeUsage } = profile;

    // 用途を取得 (Usage Check)
    let usage: string[] = [];
    if (loft <= 48) usage = wedgeUsage?.pw || [];
    else if (loft <= 52) usage = wedgeUsage?.gw || [];
    else if (loft <= 56) usage = wedgeUsage?.sw || [];
    else usage = wedgeUsage?.lw || [];

    // --- GW/PW (46-52) ---
    if (loft <= 52) {
        return { types: ['FULL', 'MID'], description: 'フルショット対応の標準ソール' };
    }

    // --- SW/LW (54-60) ---
    const useForBunker = usage.includes('BUNKER');
    const useOpenFace = usage.includes('OPEN_FACE');

    // 1. バンカー苦手 / 柔らかい砂 -> WIDE or HIGH
    if (useForBunker && (bunkerSkill === 'not_confident' || fairwayCondition === 'soft')) {
        return { types: ['WIDE', 'HIGH'], description: '幅広ソールでバンカー・ラフからやさしく脱出' };
    }

    // 2. フェースを開きたい -> LOW or MID (Relief)
    if (useOpenFace) {
        if (divotDepth === 'deep') {
            return { types: ['HIGH', 'MID'], description: 'バウンスがありつつフェースも開ける形状' }; // D Grind equivalent
        }
        if (fairwayCondition === 'firm') {
            return { types: ['LOW'], description: 'ローバウンスで薄いライから拾う' };
        }
        return { types: ['MID', 'LOW'], description: '操作性が良く、多彩なショットに対応' };
    }

    // 3. バンカー重視だが開かない -> WIDE or FULL
    if (useForBunker && !useOpenFace) {
        if (divotDepth === 'deep') {
            return { types: ['WIDE', 'FULL'], description: '刺さりにくく、バンカーで潜らないソール' };
        }
        return { types: ['MID', 'FULL'], description: 'オートマチックに打てる標準～幅広ソール' };
    }

    // 4. スクエアインパクト / フルショット
    if (divotDepth === 'deep') {
        return { types: ['FULL', 'HIGH'], description: 'バウンス効果でザックリを防止' };
    }

    return { types: ['MID', 'FULL'], description: '万能な標準ソール' };
};

// ===== ロフト構成推奨ロジック =====
export const recommendLoftSet = (
    pwLoft: number | null
): number[] => {
    // PWロフトからのギャップを考慮してロフト構成を提案
    const basePwLoft = pwLoft || 44; // 最近の飛び系アイアンは42-44が多い

    // パターンA: PW 46-48 -> 52-56-(60) or 52-58
    if (basePwLoft >= 46) {
        return [52, 56, 60];
    }

    // パターンB: PW 44-45 -> 50-54-58
    if (basePwLoft >= 44) {
        return [50, 54, 58];
    }

    // パターンC: PW 43以下 -> 48-52-56-(60) or 48-54-58
    // ギャップが大きいので4本ウェッジ推奨
    return [48, 52, 56, 60];
};

// ===== シャフト推奨ロジック =====
export const recommendWedgeShaft = (
    ironShaftType: 'steel' | 'carbon' | 'unknown',
    handicap: 'scratch' | 'single' | 'mid' | 'high' | 'beginner'
): string => {
    if (ironShaftType === 'steel') {
        // スチールアイアン使用者
        if (handicap === 'scratch' || handicap === 'single') {
            return 'Dynamic Gold S200 / MODUS3 Tour 120';
        } else {
            return 'Dynamic Gold S300 / NS PRO 950GH';
        }
    } else if (ironShaftType === 'carbon') {
        // カーボンアイアン使用者 (軽量スチール推奨)
        return 'NS PRO 950GH / KBS Tour Lite';
    } else {
        // 不明 (標準推奨)
        return 'Dynamic Gold S300 (標準)';
    }
};

// ===== ウェッジデータベース =====
export const WEDGE_DB = [
    // Titleist Vokey SM10
    { id: 'SM10_50_08F', brand: 'Titleist', model: 'SM10', loft: 50, bounce: 8, grind: 'F', price: 24200 },
    { id: 'SM10_50_12F', brand: 'Titleist', model: 'SM10', loft: 50, bounce: 12, grind: 'F', price: 24200 },
    { id: 'SM10_52_08F', brand: 'Titleist', model: 'SM10', loft: 52, bounce: 8, grind: 'F', price: 24200 },
    { id: 'SM10_52_12F', brand: 'Titleist', model: 'SM10', loft: 52, bounce: 12, grind: 'F', price: 24200 },
    { id: 'SM10_54_10S', brand: 'Titleist', model: 'SM10', loft: 54, bounce: 10, grind: 'S', price: 24200 },
    { id: 'SM10_54_12D', brand: 'Titleist', model: 'SM10', loft: 54, bounce: 12, grind: 'D', price: 24200 },
    { id: 'SM10_56_08M', brand: 'Titleist', model: 'SM10', loft: 56, bounce: 8, grind: 'M', price: 24200 },
    { id: 'SM10_56_10S', brand: 'Titleist', model: 'SM10', loft: 56, bounce: 10, grind: 'S', price: 24200 },
    { id: 'SM10_56_12D', brand: 'Titleist', model: 'SM10', loft: 56, bounce: 12, grind: 'D', price: 24200 },
    { id: 'SM10_56_14K', brand: 'Titleist', model: 'SM10', loft: 56, bounce: 14, grind: 'K', price: 24200 },
    { id: 'SM10_58_04L', brand: 'Titleist', model: 'SM10', loft: 58, bounce: 4, grind: 'L', price: 24200 },
    { id: 'SM10_58_08M', brand: 'Titleist', model: 'SM10', loft: 58, bounce: 8, grind: 'M', price: 24200 },
    { id: 'SM10_58_10S', brand: 'Titleist', model: 'SM10', loft: 58, bounce: 10, grind: 'S', price: 24200 },
    { id: 'SM10_58_12D', brand: 'Titleist', model: 'SM10', loft: 58, bounce: 12, grind: 'D', price: 24200 },
    { id: 'SM10_60_04L', brand: 'Titleist', model: 'SM10', loft: 60, bounce: 4, grind: 'L', price: 24200 },
    { id: 'SM10_60_08M', brand: 'Titleist', model: 'SM10', loft: 60, bounce: 8, grind: 'M', price: 24200 },
    { id: 'SM10_60_10S', brand: 'Titleist', model: 'SM10', loft: 60, bounce: 10, grind: 'S', price: 24200 },

    // Cleveland RTX ZipCore
    { id: 'RTX_50_10M', brand: 'Cleveland', model: 'RTX ZipCore', loft: 50, bounce: 10, grind: 'Mid', price: 19800 },
    { id: 'RTX_52_10M', brand: 'Cleveland', model: 'RTX ZipCore', loft: 52, bounce: 10, grind: 'Mid', price: 19800 },
    { id: 'RTX_54_10M', brand: 'Cleveland', model: 'RTX ZipCore', loft: 54, bounce: 10, grind: 'Mid', price: 19800 },
    { id: 'RTX_56_10M', brand: 'Cleveland', model: 'RTX ZipCore', loft: 56, bounce: 10, grind: 'Mid', price: 19800 },
    { id: 'RTX_56_12F', brand: 'Cleveland', model: 'RTX ZipCore', loft: 56, bounce: 12, grind: 'Full', price: 19800 },
    { id: 'RTX_58_06L', brand: 'Cleveland', model: 'RTX ZipCore', loft: 58, bounce: 6, grind: 'Low', price: 19800 },
    { id: 'RTX_58_10M', brand: 'Cleveland', model: 'RTX ZipCore', loft: 58, bounce: 10, grind: 'Mid', price: 19800 },
    { id: 'RTX_60_06L', brand: 'Cleveland', model: 'RTX ZipCore', loft: 60, bounce: 6, grind: 'Low', price: 19800 },
    { id: 'RTX_60_10M', brand: 'Cleveland', model: 'RTX ZipCore', loft: 60, bounce: 10, grind: 'Mid', price: 19800 },

    // Callaway JAWS Raw
    { id: 'JAWS_50_10S', brand: 'Callaway', model: 'JAWS Raw', loft: 50, bounce: 10, grind: 'S', price: 25300 },
    { id: 'JAWS_52_10S', brand: 'Callaway', model: 'JAWS Raw', loft: 52, bounce: 10, grind: 'S', price: 25300 },
    { id: 'JAWS_54_10S', brand: 'Callaway', model: 'JAWS Raw', loft: 54, bounce: 10, grind: 'S', price: 25300 },
    { id: 'JAWS_56_10S', brand: 'Callaway', model: 'JAWS Raw', loft: 56, bounce: 10, grind: 'S', price: 25300 },
    { id: 'JAWS_56_12W', brand: 'Callaway', model: 'JAWS Raw', loft: 56, bounce: 12, grind: 'W', price: 25300 },
    { id: 'JAWS_58_08Z', brand: 'Callaway', model: 'JAWS Raw', loft: 58, bounce: 8, grind: 'Z', price: 25300 },
    { id: 'JAWS_58_10S', brand: 'Callaway', model: 'JAWS Raw', loft: 58, bounce: 10, grind: 'S', price: 25300 },
    { id: 'JAWS_60_08Z', brand: 'Callaway', model: 'JAWS Raw', loft: 60, bounce: 8, grind: 'Z', price: 25300 },
    { id: 'JAWS_60_10S', brand: 'Callaway', model: 'JAWS Raw', loft: 60, bounce: 10, grind: 'S', price: 25300 },

    // TaylorMade Milled Grind 4
    { id: 'MG4_50_09SB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 50, bounce: 9, grind: 'SB', price: 24200 },
    { id: 'MG4_52_09SB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 52, bounce: 9, grind: 'SB', price: 24200 },
    { id: 'MG4_54_09SB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 54, bounce: 9, grind: 'SB', price: 24200 },
    { id: 'MG4_56_12HB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 56, bounce: 12, grind: 'HB', price: 24200 },
    { id: 'MG4_58_08LB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 58, bounce: 8, grind: 'LB', price: 24200 },
    { id: 'MG4_58_11SB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 58, bounce: 11, grind: 'SB', price: 24200 },
    { id: 'MG4_60_06LB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 60, bounce: 6, grind: 'LB', price: 24200 },
    { id: 'MG4_60_10SB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 60, bounce: 10, grind: 'SB', price: 24200 },

    // Ping S159
    { id: 'S159_50_12S', brand: 'Ping', model: 'S159', loft: 50, bounce: 12, grind: 'S', price: 24000 },
    { id: 'S159_52_12S', brand: 'Ping', model: 'S159', loft: 52, bounce: 12, grind: 'S', price: 24000 },
    { id: 'S159_54_12S', brand: 'Ping', model: 'S159', loft: 54, bounce: 12, grind: 'S', price: 24000 },
    { id: 'S159_56_12S', brand: 'Ping', model: 'S159', loft: 56, bounce: 12, grind: 'S', price: 24000 },
    { id: 'S159_56_14W', brand: 'Ping', model: 'S159', loft: 56, bounce: 14, grind: 'W', price: 24000 },
    { id: 'S159_58_06T', brand: 'Ping', model: 'S159', loft: 58, bounce: 6, grind: 'T', price: 24000 },
    { id: 'S159_58_10S', brand: 'Ping', model: 'S159', loft: 58, bounce: 10, grind: 'S', price: 24000 },
    { id: 'S159_60_06T', brand: 'Ping', model: 'S159', loft: 60, bounce: 6, grind: 'T', price: 24000 },
    { id: 'S159_60_08H', brand: 'Ping', model: 'S159', loft: 60, bounce: 8, grind: 'H', price: 24000 }, // Half Moon (similar to Mid/High)

    // Fourteen RM-W / RM-Alpha
    { id: 'RM_50_M', brand: 'Fourteen', model: 'RM-Alpha', loft: 50, bounce: 10, grind: 'M', price: 26000 },
    { id: 'RM_52_M', brand: 'Fourteen', model: 'RM-Alpha', loft: 52, bounce: 10, grind: 'M', price: 26000 },
    { id: 'RM_56_M', brand: 'Fourteen', model: 'RM-Alpha', loft: 56, bounce: 12, grind: 'M', price: 26000 },
    { id: 'RM_58_M', brand: 'Fourteen', model: 'RM-Alpha', loft: 58, bounce: 12, grind: 'M', price: 26000 },
    { id: 'RM_58_H', brand: 'Fourteen', model: 'RM-Alpha', loft: 58, bounce: 14, grind: 'H', price: 26000 },

    // Additional Callaway/TM Options for variety
    { id: 'JAWS_58_12X', brand: 'Callaway', model: 'JAWS Raw', loft: 58, bounce: 12, grind: 'X', price: 25300 },
    { id: 'MG4_56_14HB', brand: 'TaylorMade', model: 'Milled Grind 4', loft: 56, bounce: 14, grind: 'HB', price: 24200 },
    // Forgiving Wedges (High Bounce / Wide Sole)
    { id: 'SM10_58_14K', brand: 'Titleist', model: 'SM10', loft: 58, bounce: 14, grind: 'K', price: 24200 },
    { id: 'RTX_58_12F', brand: 'Cleveland', model: 'RTX ZipCore', loft: 58, bounce: 12, grind: 'Full', price: 19800 },
];

// ===== メイン診断関数 =====
export const calculateWedgeFits = (
    profile: UserProfile,
    wedgeProfile: WedgeProfile
): WedgeRecommendation[] => {
    const results: WedgeRecommendation[] = [];

    // 1. 推奨ロフト構成を決定
    let recommendedLofts: number[] = [];

    // ADDモードかつターゲットロフトが有効な場合
    if (wedgeProfile.diagnosisMode === 'ADD' && wedgeProfile.targetLoft && !isNaN(wedgeProfile.targetLoft)) {
        recommendedLofts = [wedgeProfile.targetLoft];
    } else {
        // REPLACEモード
        // ユーザー希望の最高ロフト (56, 58, 60) を尊重
        const highest = wedgeProfile.highestLoft || 58;

        // PWロフトベースの推奨
        const pw = wedgeProfile.pwLoft || 44;

        if (pw <= 43) {
            // Gapが大きい -> 4本構成推奨 (48-52-56-60 or 48-54-58)
            // ここではシンプルに最高ロフトに合わせて等間隔を目指す
            if (highest === 60) recommendedLofts = [48, 52, 56, 60];
            else if (highest === 58) recommendedLofts = [48, 52, 58]; // 52-58はGap広めだが... 48-54-58がいいか
            else recommendedLofts = [48, 52, 56];
        } else if (pw <= 46) {
            // 44-46 -> 50-54-58 or 52-58?
            if (highest === 60) recommendedLofts = [50, 54, 60]; // 50-56-60?
            else if (highest === 58) recommendedLofts = [50, 54, 58];
            else recommendedLofts = [50, 56]; // 2本構成
        } else {
            // 47-48 -> 52-56-60 or 52-58
            if (highest === 60) recommendedLofts = [52, 56, 60];
            else if (highest === 58) recommendedLofts = [52, 58];
            else recommendedLofts = [52, 56];
        }
    }

    // 2. Identify Key Loft (Highest Loft usually SW/LW)
    const keyLoft = recommendedLofts[recommendedLofts.length - 1]; // e.g. 58 or 60

    // 3. Evaluate Model Series Candidates
    // DBから候補をモデルごとにグループ化
    const modelGroups = new Map<string, typeof WEDGE_DB>();
    WEDGE_DB.forEach(w => {
        const key = `${w.brand} ${w.model}`;
        if (!modelGroups.has(key)) modelGroups.set(key, []);
        modelGroups.get(key)?.push(w);
    });

    // 各モデルについて、必要なロフトが全て揃っているかチェックし、スコア計算
    const validModels: { modelName: string; brand: string; keyWedge: any; score: number; reasons: string[]; setPrice: number }[] = [];

    modelGroups.forEach((wedges, modelKey) => {
        // Key Loft (Highest) Match
        const keyWedgeCandidates = wedges.filter(w => w.loft === keyLoft);
        if (keyWedgeCandidates.length === 0) return; // This model doesn't have the key loft

        // 推奨バウンス & グラインド (Key Loft)
        const recommendedBounce = recommendBounce(wedgeProfile, keyLoft);
        const { types: recommendedGrindTypes, description: grindDesc } = recommendGrind(wedgeProfile, keyLoft);

        // Score the Key Wedge (Best Grind/Bounce option)
        let bestKeyWedge: any = null;
        let maxScore = -1;
        let bestReasons: string[] = [];

        keyWedgeCandidates.forEach(wedge => {
            let score = 70;
            const reasons: string[] = [];
            const wedgeGrindType = getGrindType(wedge.brand, wedge.grind);

            // バウンス適合性
            const bounceDiff = Math.abs(wedge.bounce - recommendedBounce);
            if (bounceDiff === 0) {
                score += 15;
                reasons.push(`バウンス${wedge.bounce}°が入射角とライ条件に最適`);
            } else if (bounceDiff <= 2) {
                score += 10;
                reasons.push(`バウンス${wedge.bounce}°は許容範囲`);
            } else {
                score -= 5;
            }

            // グラインド適合性 (Generic comparison)
            if (recommendedGrindTypes.includes(wedgeGrindType)) {
                score += 20;
                reasons.push(`${wedge.brand}の${wedge.grind}グラインド (${wedgeGrindType}タイプ): ${grindDesc}`);
            } else {
                // 部分点
                if (recommendedGrindTypes.includes('MID') && wedgeGrindType === 'FULL') score += 10;
                else if (recommendedGrindTypes.includes('WIDE') && wedgeGrindType === 'HIGH') score += 10;
            }

            // ブランドボーナス
            if (profile.preferredBrands?.some(b => wedge.brand.toUpperCase().includes(b.toUpperCase()))) {
                score += 30;
                reasons.push(`好みのブランド: ${wedge.brand}`);
            }

            // フリーコメント分析
            if (wedgeProfile.freeComments) {
                const c = wedgeProfile.freeComments.toLowerCase();
                const b = wedge.brand.toLowerCase();
                if (c.includes(b)) {
                    score += 50;
                    reasons.push(`コメントで指定されたブランド: ${wedge.brand}`);
                }
                if (c.includes('やさしい') || c.includes('簡単') || c.includes('easy')) {
                    if (wedgeGrindType === 'WIDE' || wedgeGrindType === 'FULL' || wedge.model.includes('CB') || wedge.model.includes('Cavity')) {
                        score += 30;
                        reasons.push('やさしさを重視したモデル選定');
                    }
                }
                if (c.includes('スピン') || c.includes('止まる')) {
                    if (wedge.model.includes('Raw') || wedge.model.includes('RTX') || wedge.model.includes('SM10')) {
                        score += 15;
                        reasons.push('スピン性能を重視');
                    }
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestKeyWedge = wedge;
                bestReasons = reasons;
            }
        });

        if (bestKeyWedge) {
            // Check coverage for other lofts (Optional warning or strict?)
            // For now, assume if Key Loft exists and it's a major model, the set can be made.
            // Calculate Price = KeyWedge Price * Count
            validModels.push({
                modelName: modelKey,
                brand: bestKeyWedge.brand,
                keyWedge: bestKeyWedge,
                score: maxScore,
                reasons: bestReasons,
                setPrice: bestKeyWedge.price * recommendedLofts.length
            });
        }
    });

    // Score Sort
    validModels.sort((a, b) => b.score - a.score);

    // Select Top 3 Unique Models
    const selected = validModels.slice(0, 3);

    // Format Results
    results.push(...selected.map(item => {
        const setRec = recommendedLofts.map(l => `${l}°`).join(' / ');

        return {
            loft: item.keyWedge.loft,
            bounce: item.keyWedge.bounce,
            grind: item.keyWedge.grind,
            grindDescription: item.reasons[0] || '', // Use first reason as desc
            modelName: `${item.modelName} (推奨セット: ${setRec})`,
            brand: item.brand,
            score: Math.min(99, item.score),
            reasoning: item.reasons,
            shaftRecommendation: recommendWedgeShaft(wedgeProfile.ironShaftType, wedgeProfile.handicap),
            priceEstimate: `¥${item.setPrice.toLocaleString()} (${recommendedLofts.length}本セット)`,
            setRecommendation: `推奨セッティング: ${setRec} (シリーズ統一を推奨)`
        };
    }));

    return results;
};

// ===== ロフト角の日本語表記 =====
export const getLoftCategoryLabel = (loft: number): string => {
    if (loft <= 48) return 'ピッチングウェッジ';
    if (loft <= 52) return 'ギャップウェッジ';
    if (loft <= 56) return 'サンドウェッジ';
    return 'ロブウェッジ';
};
