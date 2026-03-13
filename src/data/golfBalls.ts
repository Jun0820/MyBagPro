import type { DiagnosisAnswers } from '../pages/ball-diagnosis/BallDiagnosisApp';

export interface GolfBall {
  id: string;
  name: string;
  brand: string;
  type: string;
  img: string; // URL for the image
  desc: string;
  profiles: {
    targetSpeed: string[]; // e.g., ['44-47', '48-49', 'over50']
    targetScore: string[];
    targetConcern: string[]; // focus areas
    targetTrajectory: string[]; // compatible ball flights
  };
  radar: {
    distance: number; // 1-5 scale
    spin: number;
    feel: number;
  };
}

// 2026 Latest Premium Golf Balls Database
export const BALL_DATABASE: GolfBall[] = [
  {
    id: 'prov1x-2025',
    name: 'Pro V1x (2025/2026 Model)',
    brand: 'Titleist',
    type: 'スピン系・高弾道',
    img: 'https://images.unsplash.com/photo-1535136128453-34e8929e5fa2?w=500&q=80',
    desc: '最新のデュアルコア技術により、ドライバーでの圧倒的な低スピンとアイアンでの高弾道・高スピンを両立させたフラッグシップモデル。',
    profiles: {
      targetSpeed: ['44-47', '48-49', 'over50'],
      targetScore: ['under80', '80s', '90s'],
      targetConcern: ['distance', 'spin'],
      targetTrajectory: ['draw', 'straight'],
    },
    radar: { distance: 5, spin: 5, feel: 4 },
  },
  {
    id: 'prov1-2025',
    name: 'Pro V1 (2025/2026 Model)',
    brand: 'Titleist',
    type: 'スピン系・中弾道',
    img: 'https://images.unsplash.com/photo-1592534571990-2ef42111161d?w=500&q=80',
    desc: 'すべてのゴルファーに推奨される完成度。Xと比べて中弾道で、より柔らかい打感と優れたショートゲームコントロールを提供。',
    profiles: {
      targetSpeed: ['40-43', '44-47', '48-49'],
      targetScore: ['under80', '80s', '90s', 'over100'],
      targetConcern: ['feel', 'spin', 'stability'],
      targetTrajectory: ['fade', 'straight', 'slice'],
    },
    radar: { distance: 4.5, spin: 5, feel: 5 },
  },
  {
    id: 'tp5-2024',
    name: 'TP5 (2024/2026 Model)',
    brand: 'TaylorMade',
    type: '5ピース・スピン系',
    img: 'https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?w=500&q=80',
    desc: '独自の5層構造がもたらすグリーン周りでの最強のスピン量。アプローチをとにかく食いつかせたいプレーヤー向け。',
    profiles: {
      targetSpeed: ['40-43', '44-47'],
      targetScore: ['under80', '80s', '90s'],
      targetConcern: ['spin', 'feel'],
      targetTrajectory: ['draw', 'fade', 'straight'],
    },
    radar: { distance: 4, spin: 5, feel: 5 },
  },
  {
    id: 'tp5x-2024',
    name: 'TP5x (2024/2026 Model)',
    brand: 'TaylorMade',
    type: '5ピース・ディスタンス',
    img: 'https://images.unsplash.com/photo-1535136128453-34e8929e5fa2?w=500&q=80',
    desc: 'ツアーレベルのボールの中でトップクラスの初速。風に負けない強弾道で、5層フェースが飛距離を限界まで引き上げる。',
    profiles: {
      targetSpeed: ['44-47', '48-49', 'over50'],
      targetScore: ['under80', '80s', '90s'],
      targetConcern: ['distance', 'stability'],
      targetTrajectory: ['draw', 'straight', 'slice'],
    },
    radar: { distance: 5, spin: 4, feel: 3.5 },
  },
  {
    id: 'chrome-tour-2025',
    name: 'Chrome Tour',
    brand: 'Callaway',
    type: 'スピン系・ディスタンス',
    img: 'https://images.unsplash.com/photo-1592534571990-2ef42111161d?w=500&q=80',
    desc: '最新のエアロネットワークパターンにより、強風下でも落ち際まで伸びる弾道。飛距離とスピンの高次元なバランス。',
    profiles: {
      targetSpeed: ['44-47', '48-49'],
      targetScore: ['under80', '80s'],
      targetConcern: ['distance', 'spin', 'stability'],
      targetTrajectory: ['draw', 'fade', 'straight'],
    },
    radar: { distance: 4.8, spin: 4.8, feel: 4.5 },
  },
  {
    id: 'zstar-diamond-2025',
    name: 'Z-STAR ◆ (Diamond)',
    brand: 'Srixon',
    type: 'スピン系・アイアン強化',
    img: 'https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?w=500&q=80',
    desc: 'アイアンでの強烈なスピンと飛距離性能を兼ね備えたモダンプロファイル。ハードヒッターがピンをデッドに狙うためのボール。',
    profiles: {
      targetSpeed: ['48-49', 'over50'],
      targetScore: ['under80', '80s'],
      targetConcern: ['spin', 'distance'],
      targetTrajectory: ['fade', 'straight', 'hook'],
    },
    radar: { distance: 4.5, spin: 5, feel: 4 },
  },
  {
    id: 'avx-2024',
    name: 'AVX',
    brand: 'Titleist',
    type: '低弾道・低スピン',
    img: 'https://images.unsplash.com/photo-1535136128453-34e8929e5fa2?w=500&q=80',
    desc: '極めて柔らかい打感と、吹け上がりを抑えた低弾道が特徴。スライスやフックの曲がり幅を抑えたいプレーヤーの救世主。',
    profiles: {
      targetSpeed: ['under40', '40-43', '44-47'],
      targetScore: ['90s', 'over100'],
      targetConcern: ['stability', 'feel'],
      targetTrajectory: ['slice', 'hook'],
    },
    radar: { distance: 4.5, spin: 3, feel: 5 },
  }
];


/**
 * 簡易的なマッチングアルゴリズム
 * 各質問の回答とボールのプロファイルを照らし合わせ、スコアを算出する。
 */
export const calculateDiagnosis = (answers: DiagnosisAnswers): { 
  ball: GolfBall; 
  matchScore: number;
  softAlternative?: GolfBall;
  hardAlternative?: GolfBall;
} => {
  // すべてのボールのスコアを計算
  const scoredBalls = BALL_DATABASE.map(ball => {
    let score = 0;

    // 1. ヘッドスピード (ウェイト: 30)
    const hs = answers.headSpeed;
    const isTargetHS = ball.profiles.targetSpeed.some(range => {
      if (range === 'under40' && hs < 40) return true;
      if (range === '40-43' && hs >= 40 && hs <= 43) return true;
      if (range === '44-47' && hs >= 44 && hs <= 47) return true;
      if (range === '48-49' && hs >= 48 && hs <= 49) return true;
      if (range === 'over50' && hs >= 50) return true;
      return false;
    });

    if (isTargetHS) {
      score += 30;
    } else {
      score += 10;
    }

    // 2. 年齢による調整 (ウェイト: 5)
    if (answers.age && (answers.age.includes('60代') || answers.age.includes('70代'))) {
      if (ball.radar.feel >= 4) score += 5;
    }

    // 3. 優先事項 (ウェイト: 25)
    if (answers.priority && answers.priority.length > 0) {
      const priorityMap: Record<string, string> = {
        'distance': 'distance',
        'stability': 'stability',
        'spin': 'spin',
        'high': 'distance'
      };
      
      let matchCount = 0;
      answers.priority.forEach(p => {
        const mapped = priorityMap[p];
        if (mapped && ball.profiles.targetConcern.includes(mapped)) {
          matchCount++;
        }
      });
      
      score += Math.min(25, (matchCount / answers.priority.length) * 25);
    }

    // 4. アプローチスタイル (ウェイト: 10)
    if (answers.approachStyle) {
      if (answers.approachStyle === 'spin' && ball.radar.spin >= 4.5) score += 10;
      if (answers.approachStyle === 'running' && ball.radar.feel >= 4) score += 10;
    }

    // 5. ボールの硬さ (ウェイト: 10)
    if (answers.ballHardness) {
      const preferredFeel = 5 - (answers.ballHardness - 50) / 12.5;
      const diff = Math.abs(ball.radar.feel - preferredFeel);
      score += Math.max(0, 10 - diff * 5);
    }

    // 6. Proモード: ミス傾向 (ウェイト: 10)
    if (answers.missTendencies && answers.missTendencies.length > 0) {
      if (answers.missTendencies.includes('slice') && ball.profiles.targetConcern.includes('stability')) {
        score += 10;
      }
      if (answers.missTendencies.includes('distance_loss') && ball.profiles.targetConcern.includes('distance')) {
        score += 10;
      }
    }

    // 7. MyBag連携 (ボーナス: 10)
    if (answers.useMyBag) {
      if (ball.brand === 'Titleist' || ball.brand === 'TaylorMade' || ball.brand === 'Srixon') {
        score += 10;
      }
    }

    // 8. 好きなメーカー優先 (ボーナス: 20)
    if (answers.favoriteBrands && answers.favoriteBrands.length > 0) {
      const isFavorite = answers.favoriteBrands.some(favId => 
        ball.brand.toLowerCase() === favId.toLowerCase()
      );
      if (isFavorite) {
        score += 20;
      }
    }

    const finalMatchScore = Math.min(65 + (score / 100) * 30 + Math.floor(Math.random() * 5), 99);
    return { ball, finalMatchScore };
  });

  // スコア順にソート
  scoredBalls.sort((a, b) => b.finalMatchScore - a.finalMatchScore);
  
  const bestResult = scoredBalls[0];
  const bestBall = bestResult.ball;

  // 代替案の選定 (Soft/Hard)
  // メインのボールと性能(タイプ)が近く、打感が異なるもの
  const others = scoredBalls.slice(1).map(b => b.ball);
  
  // 柔らかめ: メインよりfeelが高い(数値が大きい)
  const softAlt = others.find(b => b.radar.feel > bestBall.radar.feel) || 
                  others.find(b => b.radar.feel >= bestBall.radar.feel - 0.5);
                  
  // 硬め: メインよりfeelが低い(数値が小さい)
  const hardAlt = others.find(b => b.radar.feel < bestBall.radar.feel) ||
                  others.find(b => b.radar.feel <= bestBall.radar.feel + 0.5);

  return { 
    ball: bestBall, 
    matchScore: Math.round(bestResult.finalMatchScore),
    softAlternative: softAlt,
    hardAlternative: hardAlt
  };
};
