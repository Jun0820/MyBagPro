
// ボール構造
export type BallStructure = '2P' | '3P' | '4P' | '5P';

// カバー素材
export type CoverMaterial = 'URETHANE' | 'IONOMER' | 'HYBRID';

// フィーリング（打感）
export type FeelType = 'VERY_SOFT' | 'SOFT' | 'FIRM' | 'VERY_FIRM';

// 弾道（Trajectory）
export type TrajectoryHeight = 'LOW' | 'MID' | 'HIGH';

// スピン性能
export type SpinPerformance = 'LOW' | 'MID' | 'HIGH';

export interface BallSpecs {
    id: string;
    modelName: string;
    brand: string;
    releaseYear: number;

    // 物理スペック（Gemini DB準拠）
    structure: BallStructure;
    compression: number; // Comp: コンプレッション (50-110)
    coverMaterial: CoverMaterial; // U=URETHANE, I=IONOMER, H=HYBRID
    dimpleCount: number; // ディンプル数

    // 新物理パラメーター（数値指数）
    dSpinIndex: number;        // D-Spin: ドライバースピン指数 (5-55, 低いほど曲がりにくい)
    wSpinIndex: number;        // W-Spin: ウェッジスピン指数 (20-100, 高いほど止まる)
    trajectoryIndex: number;   // 弾道指数 (25-90, 高いほど上がる)

    // 価格・仕様
    priceYen: number;          // 単価（ダース）
    colorLineOptions: string;  // 色/ライン選択肢 (例: "W,Y / 矢印")

    // 推奨ターゲット
    recommendedHeadSpeed: {
        min: number;
        max: number;
    };

    // 色バリエーション
    availableColors: string[];

    // アライメントライン
    hasAlignmentLine: boolean;
    alignmentLineType?: 'SIMPLE' | 'TRIPLE_TRACK' | 'NUMBER_ONLY' | 'PIX' | 'STRIPE' | 'NAVI';

    // 使用プロゴルファー
    usedByPros: string[];

    // マーケティング/AI用
    catchphrase: string;
    description: string;

    // レガシー互換（計算で生成可能）
    driverSpin?: SpinPerformance;
    ironSpin?: SpinPerformance;
    wedgeSpin?: SpinPerformance;
    launch?: TrajectoryHeight;
    feelNumeric?: number;
    durability?: number;
    distance?: number;
    control?: number;
}


// ユーザーの詳細ショットデータ (お持ちの方のみ)
export interface ShotData {
    headSpeed?: number; // m/s
    ballSpeed?: number; // m/s
    smashFactor?: number; // ミート率
    launchAngle?: number; // 打ち出し角 (度)
    backSpin?: number; // バックスピン (rpm)
    sideSpin?: number; // サイドスピン (rpm) -> 負:フック, 正:スライス
    carryDistance?: number; // キャリー (yard)
    totalDistance?: number; // トータル (yard)
    dispersion?: number; // 左右ブレ (yard)
}

// ボール診断用の追加ユーザー好み
export interface BallPreferences {
    preferredFeel: FeelType; // 打感の好み
    priority: 'DISTANCE' | 'SPIN' | 'BALANCE'; // 優先順位
    colorPreference?: boolean; // カラーボール希望有無
    alignmentLine?: boolean; // アライメントライン
}
