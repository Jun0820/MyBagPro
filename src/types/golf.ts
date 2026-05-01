export enum TargetCategory {
    BALL = 'ゴルフボール',
    DRIVER = 'ドライバー',
    FAIRWAY = 'フェアウェイウッド',
    UTILITY = 'ユーティリティ',
    IRON = 'アイアン',
    WEDGE = 'ウェッジ',
    PUTTER = 'パター',
    TOTAL_SETTING = 'クラブセッティング診断'
}

export enum Gender {
    MALE = '男性',
    FEMALE = '女性'
}

export enum SkillLevel {
    BEGINNER = '初心者 (100切り目標)',
    INTERMEDIATE = '中級者 (90切り目標)',
    UPPER_INTERMEDIATE = '上級者 (80切り目標)',
    ADVANCED = 'シングル (ハンデ一桁目標)',
    PRO = '競技志向・プロ'
}

export enum GolfHistory {
    LESS_THAN_1 = '1年未満',
    YEAR_1_3 = '1〜3年',
    YEAR_3_5 = '3〜5年',
    YEAR_5_10 = '5〜10年',
    OVER_10 = '10年以上'
}

export enum MissType {
    SLICE = 'スライス (右)',
    HOOK = 'フック (左)',
    TOP = 'トップ / ダフり',
    LOW_TRAJECTORY = '球が上がらない',
    HIGH_TRAJECTORY = '吹け上がる',
    DISTANCE = '飛距離不足',
    SPIN_TOO_MUCH = 'スピン過多',
    UNSTABLE = '方向性が安定しない',
    PUSH_OUT = 'プッシュアウト',
    PULL = 'ひっかけ'
}

export enum SwingTempo {
    FAST = '速い (切り返しが鋭い)',
    NORMAL = '普通',
    SMOOTH = 'ゆったり (大きな弧を描く)'
}

export enum ImpactStyle {
    LEVEL = 'レベルブロー (払い打ち)',
    DOWNBLOW = 'ダウンブロー (打ち込む)',
    UNKNOWN = 'わからない'
}

export enum IdealTrajectory {
    HIGH_DRAW = '高弾道ドロー (飛距離重視)',
    LOW_DRAW = '中弾道ドロー (ラン重視)',
    STRAIGHT = 'ストレート (安定性重視)',
    HIGH_FADE = '高弾道フェード (止まる)',
    LOW_FADE = 'ライン出しフェード (操作性)',
    AUTO = 'おまかせ (AI推奨)'
}

export enum TrajectoryHeight {
    HIGH = '高弾道 (上がりすぎる)',
    MID = '中弾道 (理想的)',
    LOW = '低弾道 (上がらない)',
    UNKNOWN = 'わからない'
}

export enum SpinTendency {
    HIGH = 'スピン多め (吹け上がる/戻りすぎる)',
    NORMAL = '適正',
    LOW = 'スピン少なめ (ドロップする/止まらない)',
    UNKNOWN = 'わからない'
}

export enum ShaftFeelPreference {
    KICK_TIP = '先が走る (捕まる感じ)',
    KICK_MID = '素直・癖がない (中調子)',
    KICK_HAND = '手元がしなる (タイミング取りやすい)',
    HARD = '硬い・棒のよう (しなりを感じない)',
    SOFT = '柔らかすぎる・頼りない (暴れる)',
    UNKNOWN = 'わからない'
}

export enum ShaftWeightFeel {
    TOO_HEAVY = '重すぎて振り切れない',
    HEAVY = '少し重く感じる',
    GOOD = '丁度良い',
    LIGHT = '少し軽く感じる',
    TOO_LIGHT = '軽すぎて手打ちになる',
    UNKNOWN = 'わからない'
}

export enum HeadShapePreference {
    ROUND = '丸型 (安心感・シャロー)',
    PEAR = '洋梨型 (操作性・ディープ)',
    SQUARE = 'スクエア・異形 (直進性)',
    AUTO = 'こだわらない'
}

export enum PutterStroke {
    STRAIGHT = 'ストレート (真っ直ぐ引く)',
    ARC = 'アーク (扇型に開閉)',
    UNKNOWN = 'わからない'
}

export enum PutterMiss {
    SHORT = 'ショートする (距離感)',
    OVER = 'オーバーする (距離感)',
    PUSH = '右に外す (プッシュ)',
    PULL = '左に外す (ひっかけ)',
    OFF_CENTER = '芯に当たらない',
    YIPS = 'イップス気味・手が動かない'
}

export enum PutterHeadType {
    BLADE = 'ブレード型 (ピン型)',
    MALLET = 'マレット型 (カマボコ型)',
    NEO_MALLET = 'ネオマレット型 (大型)',
    L_MALLET = 'L字マレット',
    CENTER = 'センターシャフト系',
    UNKNOWN = 'わからない (形状で選ぶ)'
}

export enum PutterNeckType {
    CRANK = 'クランクネック',
    BENT = 'ベントネック',
    CENTER = 'センターシャフト',
    SHORT_SLANT = 'ショートスラント',
    L_NECK = 'L字ネック',
    UNKNOWN = 'わからない (形状で選ぶ)'
}

export enum BallPerformanceGoal {
    CURVE_REDUCTION = '曲がりを抑えたい (直進性)',
    MORE_SPIN = 'スピンをかけたい (操作性)',
    HIGH_TRAJECTORY = '弾道を高くしたい',
    MAX_DISTANCE = '飛距離を伸ばしたい',
    SOFT_FEEL = '打感を柔らかくしたい'
}

export enum DiagnosisMode {
    HEAD_ONLY = 'ヘッド診断 (今のシャフトに合うヘッドを提案)',
    SHAFT_ONLY = 'シャフト診断 (今のヘッドに合うシャフトを提案)',
    FULL_SPEC = 'フル診断 (最適なヘッド+シャフトを提案)'
}

export enum WristAction {
    STRONG_LAG = 'タメが強い (ハンドファースト)',
    NATURAL = '標準的 (自然なリリース)',
    EARLY_RELEASE = 'リリースが早い (すくい打ち気味)',
    UNKNOWN = 'わからない'
}

export interface Club {
    id: string;
    category: string;
    brand: string;
    model: string;
    shaft: string;
    flex: string;   // Hardness of shaft
    number: string; // [NEW] Number (e.g., 3W, 7I)
    loft: string;   // [NEW] Loft angle (e.g., 15 deg)
    distance: string; // total distance
    carryDistance?: string;
    worry?: string; // [NEW] 個別の悩みメモ
}

export interface ClubSetting {
    clubs: Club[];
    ball: string;
}

export interface UserCustomLink {
    id: string;
    label: string;
    url: string;
}

export interface UserSocialLinks {
    instagram?: string;
    x?: string;
    customLinks?: UserCustomLink[];
    profileStats?: {
        bestScore?: number;
        averageScore?: number;
    };
    bagSnapshot?: {
        clubs: Club[];
        ball?: string;
        updatedAt?: string;
    };
}

// ウェッジ詳細用途
export interface WedgeUsage {
    pw: ('FULL' | 'GREENSIDE')[];
    gw: ('FULL' | 'GREENSIDE')[];
    sw: ('FULL' | 'GREENSIDE' | 'OPEN_FACE' | 'BUNKER')[];
    lw: ('FULL' | 'GREENSIDE' | 'OPEN_FACE' | 'BUNKER')[];
}

export interface UserProfile {
    targetCategory: TargetCategory | null;
    name: string;
    gender: Gender | null;
    age: string | null;
    height: string | null;
    skillLevel: SkillLevel | null;
    headSpeed: number;
    spinRate: string;
    birthdate?: string;
    golfHistory?: GolfHistory | null;
    diagnosisMode: DiagnosisMode;
    isPublic: boolean;

    // 計測データ（オプション）
    measurementData: {
        driverCarryDistance: string;      // ドライバーキャリー飛距離 (例: "230")
        driverTotalDistance: string;      // ドライバートータル飛距離 (例: "250")
        sevenIronDistance: string;        // 7番アイアン飛距離 (例: "160")
        ballSpeed: string;                // ボールスピード m/s (例: "65")
        launchAngle: string;              // 打ち出し角度 (例: "12.5")
        spinRateMeasured: string;         // スピン量 rpm (例: "2800")
        clubPath: string;                 // クラブパス (例: "+2.5" インサイドアウト)
        faceAngle: string;                // フェース角 (例: "-1.0" クローズ)
        attackAngle: string;              // 入射角 (例: "-1.5" ダウンブロー)
        smashFactor: string;              // ミート率 (例: "1.48")

        // クラブ別追加計測データ
        measurementClubType?: string;     // 計測に使用した番手/ロフト (FW/UT/Wedge用)
        sevenIronLoft?: string;           // 7iロフト角
        wedgeFullDistance?: string;       // ウェッジフルショット距離
        wedgeSpinRate?: string;           // ウェッジスピン量
        fwCarryDistance?: string;         // FWキャリー距離
        fwSpinRate?: string;              // FWスピン量
        fwLaunchAngle?: string;           // FW打ち出し角
        utCarryDistance?: string;         // UTキャリー距離
        utSpinRate?: string;              // UTスピン量
        ironSpinRate?: string;            // 7iスピン量
        ironLaunchAngle?: string;         // 7i打ち出し角
        ironDescentAngle?: string;        // 7i落下角

        // ウェッジ診断用 (Vokey準拠)
        pwLoft?: string;                  // PWロフト角 (例: "45")
        highestLoft?: string;             // 最もロフトが寝ているウェッジ (例: "58")
        divotDepth?: string;              // ディボット傾向 ("shallow" | "normal" | "deep")
        ironShaftType?: string;           // アイアンシャフトタイプ ("steel" | "carbon" | "unknown")
        handicapLevel?: string;           // ハンディキャップ区分

        // パター診断用 (Odyssey/Ping準拠)
        strokeType?: string;              // ストローク軌道 ("straight" | "slight_arc" | "strong_arc")
        distanceIssue?: string;           // 距離感の悩み ("short" | "long" | "none")
        shortPuttIssue?: string;          // ショートパット傾向 ("push" | "pull" | "none")
        preferredFeel?: string;           // 好みの打感 ("soft" | "firm")
        currentShape?: string;            // 現在のパター形状 ("blade" | "mallet" | "neo_mallet")
        putterLength?: string;            // パター長さ (例: "34")
        alignmentPreference?: string;     // アライメント好み
    };
    hasMeasurementData: boolean;          // 計測データを持っているかどうか

    // Current Gear
    currentBrand: string;
    currentModel: string;
    currentShaftModel: string;
    currentShaftWeight: string;
    currentShaftFlex: string;
    currentLoft: string;

    // ドライバーシャフト情報（FW/UT連携用）
    driverShaftModel?: string;      // ドライバーのシャフトモデル
    driverShaftFlex?: string;       // ドライバーのシャフトフレックス
    driverShaftWeight?: string;     // ドライバーのシャフト重量

    // クラブ別詳細質問
    headVolumePreference?: 'LARGE' | 'COMPACT' | 'ANY';     // ドライバーヘッド体積好み
    shaftKickPoint?: 'TIP' | 'MID' | 'BUTT' | 'UNKNOWN';    // シャフト調子
    mainFairwayNumber?: '3W' | '5W' | '7W' | '9W';          // 主なFW番手
    fwUsageScene?: 'TEE' | 'GROUND' | 'BOTH';               // FW使用シーン
    utShapePreference?: 'WOOD' | 'IRON' | 'HYBRID';         // UT形状好み
    ironReplacement?: string;                              // 代替アイアン番手
    ironShaftType?: 'STEEL' | 'CARBON' | 'UNKNOWN';         // アイアンシャフトタイプ
    ironSetComposition?: string;                           // アイアンセット構成
    soleWidthPreference?: 'WIDE' | 'NORMAL' | 'THIN';       // ソール幅好み
    wedgePwLoft?: string;                                  // PWロフト角
    wedgeSetup?: string[];                                 // ウェッジ構成
    wedgeBounce?: 'HIGH' | 'MID' | 'LOW' | 'UNKNOWN';        // バウンス好み (既存: DivotTypeの代わりに使う)
    wedgeSoleGrind?: 'STANDARD' | 'FULL' | 'LOW';           // ソール形状
    bunkerFrequency?: 'HIGH' | 'NORMAL' | 'LOW';            // バンカー頻度

    // Vokey-style Wedge Diagnosis Fields
    wedgeHighestLoft?: '56' | '58' | '60';                 // 最も寝ているロフト
    fairwayCondition?: 'FIRM' | 'NORMAL' | 'SOFT';         // フェアウェイコンディション
    bunkerCondition?: 'FIRM' | 'NORMAL' | 'SOFT';          // バンカーコンディション
    bunkerSkill?: 'CONFIDENT' | 'NORMAL' | 'NOT_CONFIDENT'; // バンカー得意度
    wedgeShotType?: 'SQUARE' | 'OPEN_FACE' | 'VARIOUS';    // ショットタイプ (開くかどうか)
    divotDepth?: 'shallow' | 'normal' | 'deep';            // ディボットタイプ

    putterStrokeType?: 'STRAIGHT' | 'SLIGHT_ARC' | 'STRONG_ARC'; // ストロークタイプ
    putterLength?: string;                                 // パター長さ
    gripType?: 'NORMAL' | 'PISTOL' | 'FATSO' | 'SUPER_STROKE'; // グリップタイプ
    putterFeel?: 'SOFT' | 'FIRM';                          // パター打感
    greenSpeedPreference?: 'FAST' | 'NORMAL' | 'SLOW';     // グリーンスピード好み

    // ウェッジ詳細
    wedgeDiagnosisMode?: 'ADD' | 'REPLACE';                // 診断モード (追加 or 見直し)

    // ウェッジ診断用
    currentWedges?: Array<{ loft: string; bounce?: string; brand?: string; model?: string }>;  // 現在のウェッジ構成
    targetWedgeLoft?: string;                              // 診断対象のロフト
    wedgeUsage?: WedgeUsage;                               // ウェッジ用途詳細
    turfConditionPreference?: 'HARD' | 'NORMAL' | 'SOFT';  // 芝の状態

    // ユーティリティ診断用
    currentUtilities?: Array<{ number: string; brand?: string; model?: string }>;  // 現在のUT構成
    targetUtilityNumber?: string;                          // 診断対象の番手
    ironSetUpperLimit?: string;                            // アイアンセット上限（5I/6I/7I等）
    lowestFairway?: string;                                // 最もロフトが立ったFW

    // Preferences
    trajectoryHeight: TrajectoryHeight | null;
    spinTendency: SpinTendency | null;
    shaftFeelPreference: ShaftFeelPreference | null;
    shaftWeightFeel: ShaftWeightFeel | null;
    headShapePreference: HeadShapePreference | null;

    turfCondition: any | null; // Placeholder as it was missing or unused in current UI
    divotType: any | null;
    wristAction: WristAction | null;
    gloveSize: any | null;

    // Putter specific
    currentPutterHead: PutterHeadType | null;
    currentPutterNeck: PutterNeckType | null;
    putterStroke: PutterStroke | null;
    putterMiss: PutterMiss[];

    // Ball specific
    ballPerformanceGoals: BallPerformanceGoal[];

    // General
    missTendencies: MissType[];
    swingTempo: SwingTempo | null;
    impactStyle: ImpactStyle | null;
    idealTrajectory: IdealTrajectory | null;

    // 弾道・球筋の好み
    preferredTrajectory?: 'HIGH' | 'MID' | 'LOW';        // 弾道高さの好み
    preferredBallFlight?: 'STRAIGHT' | 'FADE' | 'DRAW';  // 球筋（軌道）の好み
    matchDriverShaft?: 'YES' | 'NO';                     // FW用: ドライバーシャフトと揃えるか
    freeComments: string;
    preferredBrands?: string[]; // New: Preferred manufacturers
    preferredShaftBrands?: string[]; // New: Preferred shaft manufacturers
    brandPreferenceMode?: 'strict' | 'preferred' | 'any'; // strict=そのブランドのみ, preferred=優先, any=こだわらない
    // Advanced Data (Optional)
    shotData?: {
        headSpeed?: number;
        ballSpeed?: number;
        backSpin?: number;
        launchAngle?: number;
        carryDistance?: number;
    };

    ballPreferences?: {
        preferredFeel: 'VERY_SOFT' | 'SOFT' | 'FIRM' | 'VERY_FIRM';
        priority: 'DISTANCE' | 'SPIN' | 'BALANCE';
    };

    snsLinks?: UserSocialLinks;
    coverPhoto?: string;
    bestScore?: number;
    averageScore?: number;
    myBag: ClubSetting;
    
    // Phase 8: Extended Ball Diagnosis Fields
    annualRounds?: string;
    currentBall?: string;
    ballUseReason?: string;
    ballImprovementPoints?: string[];
    approachStyle?: string;
    currentBallBrand?: string;
    currentBallModel?: string;

    // [NEW] Total Setting Diagnosis Fields
    diagnosisGoal?: string;            // 診断の目標 (飛距離、安定等)
    roundFrequency?: string;           // ラウンド頻度
    weightFlowFeel?: string;           // 重量フローの違和感
    vibrationFeel?: string;            // 振動数・硬さの違和感
    brandConsistency?: string;         // ブランド混在の懸念
    knowsExactCarry?: boolean;         // 正確なキャリーの把握
    gapDistance170210?: string;        // 170-210ydの空白地帯
    wedgeGapFeel?: string;             // ウェッジの距離刻み
    missQuality?: string;              // ミスの質 (打点 vs スピン)
    attackAngleLevel?: string;         // 入射角の自覚
    bestClub?: string;                 // 最も自信のあるクラブ
    worstClub?: string;                // 最も構えたくないクラブ
    situationalIssue?: string[];        // 苦手な状況
    sensoryComplaints?: string;        // 感性的な不満
    commonCourseType?: string;          // よく行くコース特性
    playStyle?: 'AGGRESSIVE' | 'DEFENSIVE' | 'NEUTRAL'; // プレースタイル
}

export interface ClubPhysics {
    id: string; // Unique Identifier
    modelName: string;
    brand: string;
    releaseYear: number;
    category: TargetCategory;

    // Head Specifications
    head: {
        volume?: number; // cc
        weight?: number; // g
        loft: number; // Real Loft (deg)
        lie: number; // Lie Angle (deg)
        faceAngle: number; // Face Angle (+ Open, - Closed)
        bounce?: number; // Bounce Angle (deg) for Wedges
        grind?: string; // Grind Type (e.g. 'F', 'S', 'M', 'K', 'L', 'D') for Wedges
    };

    // Center of Gravity (COG) Specs
    cog: {
        distance: number; // 重心距離 (mm) - Longer = Stable/Fade, Shorter = Rotatable/Draw
        depth: number; // 重心深度 (mm) - Deeper = High Launch/MOI
        height?: number; // 重心高さ (mm) - Lower = High Launch/Low Spin
        angle: number; // 重心角 (deg) - Larger = Draw Bias (Head rotates easily)
        eff_face_height?: number; // 有効打点距離
    };

    // Moment of Inertia
    moi: {
        total?: number; // Total MOI (g*cm2)
        horizontal?: number; // Left-Right MOI
        vertical?: number; // Top-Bottom MOI
    };

    // Qualitative Tags (Derived or Manufacturer stated)
    characteristics: {
        bias: 'DRAW' | 'FADE' | 'NEUTRAL';
        launch: 'HIGH' | 'MID' | 'LOW';
        spin: 'LOW' | 'MID' | 'HIGH';
        forgiveness: number; // 1-10 (10 being most forgiving)
        control: number; // 1-10 (10 being most workable)
    };
}

export interface DiagnosisHistoryItem {
    id: string;
    date: string;
    category: string;
    profile: UserProfile;
    result: any;
}

export interface UserAccount {
    id: string;
    isLoggedIn: boolean;
    name: string;
    email: string;
    memberSince: string;
    password?: string;
    apiKey?: string;
    isPremium?: boolean;
    history?: DiagnosisHistoryItem[];
}

export const INITIAL_CLUB_SETTING: ClubSetting = { clubs: [], ball: '' };

export const INITIAL_ACCOUNT: UserAccount = {
    id: '',
    isLoggedIn: false,
    name: '',
    email: '',
    memberSince: '',
    history: []
};

export const INITIAL_PROFILE: UserProfile = {
    targetCategory: null,
    name: '',
    gender: null,
    age: null,
    height: null,
    skillLevel: null,
    headSpeed: 40,
    spinRate: '',
    diagnosisMode: DiagnosisMode.FULL_SPEC,
    isPublic: false,
    measurementData: {
        driverCarryDistance: '',
        driverTotalDistance: '',
        sevenIronDistance: '',
        ballSpeed: '',
        launchAngle: '',
        spinRateMeasured: '',
        clubPath: '',
        faceAngle: '',
        attackAngle: '',
        smashFactor: ''
    },
    hasMeasurementData: false,
    currentBrand: '',
    currentModel: '',
    currentShaftModel: '',
    currentShaftWeight: '',
    currentShaftFlex: '',
    currentLoft: '',
    trajectoryHeight: null,
    spinTendency: null,
    shaftFeelPreference: null,
    shaftWeightFeel: null,
    headShapePreference: null,
    turfCondition: null,
    divotType: null,
    wristAction: null,
    gloveSize: null,
    currentPutterHead: null,
    currentPutterNeck: null,
    putterStroke: null,
    putterMiss: [],
    ballPerformanceGoals: [],
    missTendencies: [],
    swingTempo: null,
    impactStyle: null,
    idealTrajectory: null,
    preferredTrajectory: undefined,
    preferredBallFlight: undefined,
    matchDriverShaft: undefined,
    freeComments: '',
    preferredBrands: [],
    brandPreferenceMode: 'any',
    // 初期値追加
    driverShaftModel: undefined,
    driverShaftFlex: undefined,
    driverShaftWeight: undefined,
    headVolumePreference: undefined,
    shaftKickPoint: undefined,
    mainFairwayNumber: undefined,
    fwUsageScene: undefined,
    utShapePreference: undefined,
    ironReplacement: undefined,
    ironShaftType: undefined,
    ironSetComposition: undefined,
    soleWidthPreference: undefined,
    wedgePwLoft: undefined,
    wedgeSetup: undefined,
    wedgeBounce: undefined,
    wedgeSoleGrind: undefined,
    wedgeDiagnosisMode: undefined, // 追加
    bunkerFrequency: undefined,
    putterStrokeType: undefined,
    putterLength: undefined,
    gripType: undefined,
    putterFeel: undefined,
    greenSpeedPreference: undefined,
    preferredShaftBrands: [], // 追加
    currentWedges: undefined,
    targetWedgeLoft: undefined,
    turfConditionPreference: undefined,
    currentUtilities: undefined,
    targetUtilityNumber: undefined,
    ironSetUpperLimit: undefined,
    lowestFairway: undefined,
    wedgeUsage: undefined,
    snsLinks: {},
    coverPhoto: undefined,
    bestScore: undefined,
    averageScore: undefined,
    myBag: INITIAL_CLUB_SETTING,
    
    // Phase 8
    annualRounds: undefined,
    currentBall: undefined,
    ballUseReason: undefined,
    ballImprovementPoints: [],
    approachStyle: undefined,
    birthdate: undefined,
    golfHistory: null
};
