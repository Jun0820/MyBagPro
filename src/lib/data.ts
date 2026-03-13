import { TargetCategory } from "../types/golf";

// 日本市場向けゴルフクラブデータベース（2016年〜2026年）
import { CLUB_DATABASE } from "../data/clubMasterDatabase";
export { CLUB_DATABASE };

export const SHAFT_MODELS = [
    // ドライバー用 - カスタムカーボン
    "Tour AD VF", "Tour AD CQ", "Tour AD UB", "Tour AD DI", "Tour AD GP",
    "Ventus Black", "Ventus Blue", "Ventus Red", "Ventus TR Red", "Ventus TR Blue",
    "Speeder NX Violet", "Speeder NX Green", "Speeder 661 Evolution VII", "Speeder Evolution V", "Speeder Evolution VI",
    "Tensei 1K Pro Orange", "Tensei CK Pro White", "Tensei AV Raw Blue", "Tensei Pro Red 1K",
    "Diamana BB", "Diamana WB", "Diamana PD", "Diamana TB", "Diamana GT", "Diamana ZF",
    "The ATTAS V3", "ATTAS DAAAS", "ATTAS 11", "ATTAS King",
    "KUROKAGE Black", "KUROKAGE XD",
    "Fujikura VENTUS TR", "Fujikura Speeder NX",

    // ドライバー用 - 純正カーボン（メーカー標準装着）
    "FUBUKI AX f/w", "FUBUKI MV", "FUBUKI AI III", "FUBUKI V-SERIES", "FUBUKI DC", "FUBUKI TM-5",
    "ALTA J CB BLACK", "ALTA J CB SLATE", "ALTA J CB RED",
    "ELDIO 50", "ELDIO 40", "ELDIO for CW",
    "REXIS KAALA 55", "REXIS KAALA 65",
    "Speeder 569 EVOLUTION", "Speeder 569 EVOLUTION III",
    "Tour AD SLDR", "Tour AD MJ",
    "Diamana Thump", "Diamana S+",
    "Grand Bassara", "Bassara P",
    "Miyazaki C.Kua", "Miyazaki KOSMA",
    "Air Speeder", "AX Speeder",
    "Retio X", "XP",

    // アイアン用 - スチール
    "Dynamic Gold", "Dynamic Gold 120", "Dynamic Gold 105", "Dynamic Gold 95",
    "Dynamic Gold S200", "Dynamic Gold X100",
    "N.S.PRO 950GH neo", "N.S.PRO 950GH", "N.S.PRO 850GH", "N.S.PRO 750GH",
    "N.S.PRO Modus3 Tour 105", "N.S.PRO Modus3 Tour 120", "N.S.PRO Modus3 Tour 130",
    "N.S.PRO Modus3 System3 Tour 125",
    "Project X LZ", "Project X 6.0", "Project X 5.5", "Project X IO",
    "True Temper AMT", "True Temper XP 95", "True Temper XP 105",
    "KBS Tour", "KBS Tour 90", "KBS Tour V", "KBS C-Taper", "KBS $ Taper",

    // アイアン用 - カーボン
    "N.S.PRO Zelos 6", "N.S.PRO Zelos 7", "N.S.PRO Zelos 8",
    "ATTAS IRON", "Diamana Thump i",
    "FUBUKI AX i", "FUBUKI AI II i",
    "Air Speeder for Iron",

    // XXIO/純正
    "MP1300", "MP1200", "MP1100", "MP1000",
    "SX-3000", "SX-2500",

    // ウェッジ用
    "Dynamic Gold Spinner", "N.S.PRO 950GH Wedge"
];

// カテゴリ別シャフトモデル
export const SHAFT_MODELS_BY_CATEGORY: Record<string, string[]> = {
    DRIVER: [
        // カスタム
        "Tour AD VF", "Tour AD CQ", "Tour AD UB", "Tour AD DI", "Tour AD GP",
        "Ventus Black", "Ventus Blue", "Ventus Red", "Ventus TR Red", "Ventus TR Blue",
        "Speeder NX Violet", "Speeder NX Green", "Speeder 661 Evolution VII", "Speeder Evolution V", "Speeder Evolution VI",
        "Tensei 1K Pro Orange", "Tensei CK Pro White", "Tensei AV Raw Blue", "Tensei Pro Red 1K",
        "Diamana BB", "Diamana WB", "Diamana PD", "Diamana TB", "Diamana GT", "Diamana ZF",
        "The ATTAS V3", "ATTAS DAAAS", "ATTAS 11", "ATTAS King",
        "KUROKAGE Black", "KUROKAGE XD",
        // 純正
        "FUBUKI AX f/w", "FUBUKI MV", "FUBUKI AI III", "FUBUKI V-SERIES", "FUBUKI DC", "FUBUKI TM-5",
        "ALTA J CB BLACK", "ALTA J CB SLATE", "ALTA J CB RED",
        "ELDIO 50", "ELDIO 40",
        "REXIS KAALA 55", "REXIS KAALA 65",
        "Speeder 569 EVOLUTION", "Speeder 569 EVOLUTION III",
        "Tour AD SLDR", "Tour AD MJ",
        "Diamana Thump", "Diamana S+",
        "Grand Bassara", "Bassara P",
        "Miyazaki C.Kua", "Miyazaki KOSMA",
        "Air Speeder", "AX Speeder",
        "純正カーボン"
    ],
    FAIRWAY: [
        // カスタム
        "Tour AD VF", "Tour AD CQ", "Tour AD UB",
        "Ventus Black", "Ventus Blue", "Ventus Red",
        "Speeder NX Violet", "Speeder NX Green", "Speeder Evolution V",
        "Diamana PD", "Diamana TB", "Diamana ZF",
        // 純正
        "FUBUKI AX f/w", "FUBUKI MV", "FUBUKI AI III",
        "ALTA J CB BLACK", "ALTA J CB SLATE",
        "ELDIO for CW",
        "Speeder 569 EVOLUTION",
        "Tour AD MJ",
        "純正カーボン"
    ],
    UTILITY: [
        // カスタム
        "Tour AD HY", "Tour AD DI-HY",
        "Ventus HY", "Speeder HY",
        "N.S.PRO Modus3 Hybrid",
        // 純正
        "FUBUKI AX f/w", "FUBUKI MV",
        "ALTA J CB",
        "Speeder EVOLUTION for UT",
        "Air Speeder UT",
        "純正カーボン", "純正スチール"
    ],
    IRON: [
        // スチール
        "Dynamic Gold", "Dynamic Gold 120", "Dynamic Gold 105", "Dynamic Gold 95",
        "Dynamic Gold S200", "Dynamic Gold X100",
        "N.S.PRO 950GH neo", "N.S.PRO 950GH", "N.S.PRO 850GH", "N.S.PRO 750GH",
        "N.S.PRO Modus3 Tour 105", "N.S.PRO Modus3 Tour 120", "N.S.PRO Modus3 Tour 130",
        "N.S.PRO Modus3 System3 Tour 125",
        "Project X LZ", "Project X 6.0", "Project X IO",
        "KBS Tour", "KBS Tour 90", "KBS C-Taper", "KBS $ Taper",
        // カーボン
        "N.S.PRO Zelos 6", "N.S.PRO Zelos 7", "N.S.PRO Zelos 8",
        "ATTAS IRON", "Diamana Thump i",
        "FUBUKI AX i", "FUBUKI AI II i",
        "Air Speeder for Iron",
        "MP1300", "MP1200", "MP1100",
        "純正カーボン"
    ],
    WEDGE: [
        "Dynamic Gold", "Dynamic Gold S200", "Dynamic Gold X100",
        "N.S.PRO 950GH", "N.S.PRO Modus3 Tour 120",
        "KBS Wedge", "KBS Tour"
    ]
};

// カテゴリ別シャフト重量オプション
export const SHAFT_WEIGHT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    DRIVER: [
        { value: "40g", label: "40g台 (軽量)" },
        { value: "50g", label: "50g台 (標準軽量)" },
        { value: "60g", label: "60g台 (標準)" },
        { value: "70g", label: "70g台 (やや重め)" },
        { value: "80g", label: "80g台~ (重め)" }
    ],
    FAIRWAY: [
        { value: "50g", label: "50g台" },
        { value: "60g", label: "60g台" },
        { value: "70g", label: "70g台" },
        { value: "80g", label: "80g台~" }
    ],
    UTILITY: [
        { value: "60g", label: "60g台 (カーボン)" },
        { value: "70g", label: "70g台 (カーボン)" },
        { value: "90g", label: "90g台 (軽量スチール)" },
        { value: "100g", label: "100g台~ (スチール)" }
    ],
    IRON: [
        { value: "軽量スチール", label: "軽量スチール (80-95g)" },
        { value: "中重量スチール", label: "中重量スチール (105-115g)" },
        { value: "重量スチール", label: "重量スチール (120g~)" },
        { value: "カーボン", label: "カーボン (50-70g)" }
    ],
    WEDGE: [
        { value: "標準スチール", label: "標準スチール (120-130g)" },
        { value: "アイアン同じ", label: "アイアンと同じ" }
    ]
};

// カテゴリからシャフトモデルを取得
export const getShaftModels = (category: string): string[] => {
    const key = mapCategoryToKey(category);
    return SHAFT_MODELS_BY_CATEGORY[key] || SHAFT_MODELS_BY_CATEGORY.DRIVER;
};

// カテゴリから重量オプションを取得
export const getShaftWeightOptions = (category: string): { value: string; label: string }[] => {
    const key = mapCategoryToKey(category);
    return SHAFT_WEIGHT_OPTIONS[key] || SHAFT_WEIGHT_OPTIONS.DRIVER;
};

export const mapCategoryToKey = (category: TargetCategory | string): string => {
    if (category.includes("ドライバー") || category.includes("DRIVER")) return "DRIVER";
    if (category.includes("フェアウェイ") || category.includes("FAIRWAY")) return "FAIRWAY";
    if (category.includes("ユーティリティ") || category.includes("UTILITY")) return "UTILITY";
    if (category.includes("アイアン") || category.includes("IRON")) return "IRON";
    if (category.includes("ウェッジ") || category.includes("WEDGE")) return "WEDGE";
    if (category.includes("ボール") || category.includes("BALL")) return "BALL";
    if (category.includes("パター") || category.includes("PUTTER")) return "PUTTER";
    return "DRIVER";
};

export const getBrands = (category: TargetCategory | string): string[] => {
    const brands: string[] = [];
    const targetKey = mapCategoryToKey(category);
    Object.keys(CLUB_DATABASE).forEach(brand => {
        if (CLUB_DATABASE[brand][targetKey]) brands.push(brand);
    });
    return brands.sort();
};

export const getAllBrands = (): string[] => {
    return Object.keys(CLUB_DATABASE).sort();
};

export const getModels = (brand: string, category: TargetCategory | string): string[] => {
    if (!brand) return [];
    const targetKey = mapCategoryToKey(category);
    return CLUB_DATABASE[brand]?.[targetKey] || [];
};

export const getAllModels = (brand: string): string[] => {
    if (!brand || !CLUB_DATABASE[brand]) return [];
    const allModels = new Set<string>();
    Object.values(CLUB_DATABASE[brand]).forEach(models => {
        models.forEach(m => allModels.add(m));
    });
    return Array.from(allModels).sort();
};
