// クラブ別理想軌道ロジック
// ゴルフフィッティング理論に基づく各クラブの理想軌道パラメータ

import { TargetCategory } from '../types/golf';

// ===== クラブ別理想軌道の型定義 =====
export interface IdealTrajectorySpec {
    launchAngle: { min: number; ideal: number; max: number };  // 打ち出し角（度）
    spinRate: { min: number; ideal: number; max: number };      // スピン量（rpm）
    peakHeight: { min: number; ideal: number; max: number };    // 最高点（ヤード）
    landingAngle: { min: number; ideal: number; max: number };  // 着地角（度）
    description: string;
    keyCharacteristics: string[];
}

// ===== クラブカテゴリ別の理想軌道データ =====
export const IDEAL_TRAJECTORY_BY_CLUB: Record<string, IdealTrajectorySpec> = {
    // ドライバー: 高打ち出し・低スピンが飛距離の鍵
    [TargetCategory.DRIVER]: {
        launchAngle: { min: 10, ideal: 13, max: 17 },
        spinRate: { min: 2000, ideal: 2500, max: 3000 },
        peakHeight: { min: 28, ideal: 32, max: 38 },
        landingAngle: { min: 32, ideal: 38, max: 45 },
        description: '高打ち出し・低スピンで最大キャリーとランを実現',
        keyCharacteristics: [
            '打ち出し角13°前後が理想',
            'スピン量2500rpm前後で浮力と転がりのバランス',
            '着地角38°前後で最大飛距離',
            'HS40m/s以下なら打ち出し15°以上推奨'
        ]
    },

    // フェアウェイウッド: 中弾道・安定した滑り出し
    [TargetCategory.FAIRWAY]: {
        launchAngle: { min: 12, ideal: 15, max: 18 },
        spinRate: { min: 3000, ideal: 4000, max: 5000 },
        peakHeight: { min: 26, ideal: 30, max: 35 },
        landingAngle: { min: 40, ideal: 45, max: 52 },
        description: '中弾道でスムーズに上がり、グリーンで止まる',
        keyCharacteristics: [
            '打ち出し角15°前後で安定したキャリー',
            'スピン4000rpm前後でグリーンに止まる',
            '地面から打つため低重心が重要',
            'ミスに強い浅重心設計を推奨'
        ]
    },

    // ユーティリティ: コントロール性重視・中高弾道
    [TargetCategory.UTILITY]: {
        launchAngle: { min: 14, ideal: 17, max: 21 },
        spinRate: { min: 3500, ideal: 4500, max: 5500 },
        peakHeight: { min: 24, ideal: 28, max: 33 },
        landingAngle: { min: 42, ideal: 48, max: 55 },
        description: '高さのあるショットでピンを狙う',
        keyCharacteristics: [
            '高さを出してグリーンを狙う',
            'スピンで止める能力が重要',
            'ロングアイアン代替として飛距離と安定性のバランス',
            '払い打ちでもダウンブローでも使いやすい'
        ]
    },

    // アイアン: 番手別に弾道とスピンが変化
    [TargetCategory.IRON]: {
        launchAngle: { min: 16, ideal: 20, max: 26 },  // 7番アイアン基準
        spinRate: { min: 5500, ideal: 7000, max: 8500 },
        peakHeight: { min: 26, ideal: 30, max: 36 },
        landingAngle: { min: 45, ideal: 50, max: 58 },
        description: '適切なスピンと着地角でピンを攻める',
        keyCharacteristics: [
            '番手ごとに4°のロフト差（距離10-15yd差）',
            '7番で打ち出し20°・スピン7000rpmが目安',
            'ショートアイアンはスピンを活かして止める',
            'ロングアイアンは高さ確保が優先'
        ]
    },

    // ウェッジ: 高弾道・高スピンでピタッと止める
    [TargetCategory.WEDGE]: {
        launchAngle: { min: 28, ideal: 34, max: 42 },
        spinRate: { min: 8000, ideal: 10000, max: 12000 },
        peakHeight: { min: 22, ideal: 28, max: 35 },
        landingAngle: { min: 48, ideal: 54, max: 62 },
        description: '高いスピンで1ピン以内を狙う',
        keyCharacteristics: [
            '高弾道でグリーンに柔らかくランディング',
            'スピン10000rpm前後で止まる',
            'ロフト別にスピン特性が異なる',
            'グルーブ（溝）の鮮度が重要'
        ]
    }
};

// ===== ヘッドスピード別の理想値調整 =====
export const adjustForHeadSpeed = (
    baseSpec: IdealTrajectorySpec,
    headSpeed: number,
    _category: TargetCategory
): IdealTrajectorySpec => {
    // ヘッドスピードが低いほど打ち出し角を上げ、スピンを増やす
    let launchAdjust = 0;
    let spinAdjust = 0;

    if (headSpeed < 38) {
        launchAdjust = 3;  // +3° 打ち出し
        spinAdjust = 500;   // +500rpm
    } else if (headSpeed < 43) {
        launchAdjust = 1;
        spinAdjust = 200;
    } else if (headSpeed > 48) {
        launchAdjust = -1;  // 速いと低打ち出しでOK
        spinAdjust = -300;
    }

    return {
        ...baseSpec,
        launchAngle: {
            min: baseSpec.launchAngle.min + launchAdjust,
            ideal: baseSpec.launchAngle.ideal + launchAdjust,
            max: baseSpec.launchAngle.max + launchAdjust
        },
        spinRate: {
            min: baseSpec.spinRate.min + spinAdjust,
            ideal: baseSpec.spinRate.ideal + spinAdjust,
            max: baseSpec.spinRate.max + spinAdjust
        }
    };
};

// ===== 現在の軌道と理想値の比較 =====
export interface TrajectoryAnalysis {
    launchAngleStatus: 'low' | 'ideal' | 'high';
    spinRateStatus: 'low' | 'ideal' | 'high';
    overallScore: number;  // 0-100
    recommendations: string[];
    clubSuggestion: string;
}

export const analyzeTrajectory = (
    category: TargetCategory,
    currentLaunch: number,
    currentSpin: number,
    headSpeed: number
): TrajectoryAnalysis => {
    const baseSpec = IDEAL_TRAJECTORY_BY_CLUB[category];
    if (!baseSpec) {
        return {
            launchAngleStatus: 'ideal',
            spinRateStatus: 'ideal',
            overallScore: 70,
            recommendations: ['計測データを入力すると詳細分析が可能です'],
            clubSuggestion: ''
        };
    }

    const adjustedSpec = adjustForHeadSpeed(baseSpec, headSpeed, category);

    // 打ち出し角の判定
    let launchAngleStatus: 'low' | 'ideal' | 'high' = 'ideal';
    if (currentLaunch < adjustedSpec.launchAngle.min) {
        launchAngleStatus = 'low';
    } else if (currentLaunch > adjustedSpec.launchAngle.max) {
        launchAngleStatus = 'high';
    }

    // スピン量の判定
    let spinRateStatus: 'low' | 'ideal' | 'high' = 'ideal';
    if (currentSpin < adjustedSpec.spinRate.min) {
        spinRateStatus = 'low';
    } else if (currentSpin > adjustedSpec.spinRate.max) {
        spinRateStatus = 'high';
    }

    // スコア計算
    let score = 70;
    if (launchAngleStatus === 'ideal') score += 15;
    if (spinRateStatus === 'ideal') score += 15;

    // 推奨事項
    const recommendations: string[] = [];
    let clubSuggestion = '';

    if (category === TargetCategory.DRIVER) {
        if (launchAngleStatus === 'low') {
            recommendations.push('打ち出し角が低め。ロフトを上げるか、重心の浅いヘッドを検討');
            clubSuggestion = 'ロフト10.5°以上 / 低重心設計推奨';
        } else if (launchAngleStatus === 'high') {
            recommendations.push('打ち出し角が高め。ロフトを下げるか、スピンを抑えるヘッドを検討');
            clubSuggestion = 'ロースピン設計推奨';
        }

        if (spinRateStatus === 'high') {
            recommendations.push('スピンが多め。飛距離ロスの原因に。ロースピンヘッドを検討');
            score -= 10;
        } else if (spinRateStatus === 'low') {
            recommendations.push('スピンが少なめ。キャリーが出にくい。高弾道設計を検討');
        }
    } else if (category === TargetCategory.IRON) {
        if (launchAngleStatus === 'low') {
            recommendations.push('弾道が低め。グリーンで止まりにくい。高弾道アイアンを検討');
            clubSuggestion = '中空/飛び系アイアン推奨';
        }

        if (spinRateStatus === 'low') {
            recommendations.push('スピンが少なめ。グリーンで止まりにくい。スピン性能の高いヘッドを検討');
            score -= 10;
        }
    }

    if (recommendations.length === 0) {
        recommendations.push('現在の軌道は理想的です！');
    }

    return {
        launchAngleStatus,
        spinRateStatus,
        overallScore: Math.min(100, Math.max(0, score)),
        recommendations,
        clubSuggestion
    };
};

// ===== 診断結果用の簡易サマリー =====
export const getTrajectoryRecommendation = (
    category: TargetCategory,
    headSpeed: number
): {
    ideal: string;
    tips: string[];
    details: { launchAngle: string; spinRate: string; maxHeight: string }
} => {
    const spec = IDEAL_TRAJECTORY_BY_CLUB[category];
    if (!spec) {
        return {
            ideal: '',
            tips: [],
            details: { launchAngle: '-', spinRate: '-', maxHeight: '-' }
        };
    }

    const adjusted = adjustForHeadSpeed(spec, headSpeed, category);

    return {
        ideal: `打ち出し: ${adjusted.launchAngle.ideal}° / スピン: ${adjusted.spinRate.ideal}rpm`,
        tips: spec.keyCharacteristics,
        details: {
            launchAngle: `${adjusted.launchAngle.ideal}°`,
            spinRate: `${adjusted.spinRate.ideal}rpm`,
            maxHeight: `${adjusted.peakHeight.ideal}yd`
        }
    };
};
