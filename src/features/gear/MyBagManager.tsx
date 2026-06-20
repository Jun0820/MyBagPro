import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Copy,
    Layers3,
    Loader2,
    MoreHorizontal,
    Save,
    Sparkles,
} from 'lucide-react';
import { type Club, type ClubSetting, TargetCategory } from '../../types/golf';
import { cn } from '../../lib/utils';
import { ShareImageExporter } from '../../components/ShareImageExporter';
import { BALL_MASTER_DATA } from '../../data/ballMasterData';

const ROUND_LIMIT = 14;
const DEFAULT_SETTING_NAME = '現在のクラブセッティング';

const PURPOSES = ['メイン', 'サブ', '競技用', '練習用', '冬用', '試打・検討中', '過去のセッティング'];
const BRAND_SUGGESTIONS = ['PING', 'TaylorMade', 'Callaway', 'Titleist', 'Srixon', 'Dunlop', 'Mizuno', 'Yamaha', 'Bridgestone', 'PRGR', 'Cobra', 'PXG', 'ONOFF', 'Fourteen', 'Honma', 'XXIO', 'Cleveland', 'Epon', 'Miura', 'RomaRo', 'Bettinardi', 'Odyssey', 'Scotty Cameron', 'その他'];
const MODEL_SUGGESTIONS = [
    'G430', 'G430 MAX', 'G430 LST', 'G440', 'G440 MAX', 'G440 LST', 'G440 SFT',
    'Qi10', 'Qi10 LS', 'Qi35', 'Qi35 LS', 'Qi35 MAX', 'Qi4D', 'STEALTH', 'STEALTH GLOIRE',
    'Kalea Gold',
    'ELYTE', 'ELYTE ◆◆◆', 'PARADYM', 'PARADYM Ai Smoke', 'Ai Smoke MAX',
    'REVA RISE', 'REVA',
    'GT2', 'GT3', 'TSR2', 'TSR3', 'T100', 'T150', 'T200', 'T250',
    'ZX5 Mk II', 'ZX7 Mk II', 'ZXi5', 'ZXi7', 'ZXi LS',
    'DS-ADAPT LS', 'DS-ADAPT X', 'DS-ADAPT MAX-K',
    'ST-MAX 230', 'JPX 925 HOT METAL', 'Mizuno Pro 241', 'Mizuno Pro 243', 'Mizuno Pro S-3',
    '221 CB', '222 CB+', '220 MB', 'BRM2', 'B1ST', 'B2HT',
    'XXIO 13', 'XXIO X', 'XXIO PRIME', 'G Le3', 'G Le4', 'ONOFF KURO', 'ONOFF AKA', 'RMX VD', 'RMX VD/M', 'RS X', 'LS', 'SUPER egg',
    'Vokey SM10', 'Vokey SM11', 'RTX', 'RTZ', 'JAWS RAW', 'OPUS', 's159', 'T-1', 'T-3',
    'Spider Tour', 'Spider Tour X', 'Spider Tour Z', 'Phantom 5', 'Phantom 5.2', 'Phantom 7', 'Phantom 7.2', 'Phantom 7.5', 'Phantom 9R',
    'Studio Style Newport 2', 'Studio Style Squareback 2', 'Ai-ONE', 'Ai-ONE #7', 'Ai-ONE MILLED', 'WHITE HOT OG', 'Square 2 Square Jailbird', 'PLD ANSER',
];
const SHAFT_SUGGESTIONS = [
    'VENTUS',
    '24 VENTUS BLUE', '24 VENTUS BLUE 5', '24 VENTUS BLUE 6', '24 VENTUS BLUE 7',
    '24 VENTUS BLACK', '24 VENTUS BLACK 5', '24 VENTUS BLACK 6', '24 VENTUS BLACK 7',
    '24 VENTUS RED', '24 VENTUS RED 5', '24 VENTUS RED 6', '24 VENTUS RED 7',
    '26 VENTUS TR BLUE', '26 VENTUS TR BLUE 5', '26 VENTUS TR BLUE 6', '26 VENTUS TR BLUE 7',
    '26 VENTUS TR BLACK', '26 VENTUS TR BLACK 5', '26 VENTUS TR BLACK 6', '26 VENTUS TR BLACK 7',
    '26 VENTUS TR RED', '26 VENTUS TR RED 5', '26 VENTUS TR RED 6', '26 VENTUS TR RED 7',
    'VENTUS HB', 'VENTUS HB BLUE', 'VENTUS HB BLACK',
    'SPEEDER NX', 'SPEEDER NX BLACK', 'SPEEDER NX BLACK 40', 'SPEEDER NX BLACK 50', 'SPEEDER NX BLACK 60', 'SPEEDER NX GREEN', 'SPEEDER NX GREEN 40', 'SPEEDER NX GREEN 50', 'SPEEDER NX GREEN 60', 'SPEEDER NX VIOLET', 'SPEEDER NX VIOLET 40', 'SPEEDER NX VIOLET 50', 'SPEEDER NX VIOLET 60', 'SPEEDER NX GOLD', 'SPEEDER NX GOLD 40', 'SPEEDER NX GOLD 50', 'SPEEDER NX GOLD 60',
    'Tour AD', 'Tour AD DI', 'Tour AD DI-5', 'Tour AD DI-6', 'Tour AD VF', 'Tour AD VF-5', 'Tour AD VF-6', 'Tour AD CQ', 'Tour AD CQ-5', 'Tour AD CQ-6', 'Tour AD UB', 'Tour AD UB-5', 'Tour AD UB-6', 'Tour AD HD', 'Tour AD HD-5', 'Tour AD HD-6', 'Tour AD GC', 'Tour AD GC-5', 'Tour AD GC-6', 'Tour AD PT', 'Tour AD PT-5', 'Tour AD PT-6', 'Tour AD HYBRID', 'Tour AD HY-75', 'Tour AD HY-85', 'Tour AD HY-95',
    'Diamana', 'Diamana BB', 'Diamana BB 43', 'Diamana BB 53', 'Diamana BB 63', 'Diamana WB', 'Diamana WB 43', 'Diamana WB 53', 'Diamana WB 63', 'Diamana RB', 'Diamana RB 43', 'Diamana RB 53', 'Diamana RB 63', 'Diamana GT', 'Diamana TB',
    'TENSEI', 'TENSEI Pro Blue 1K', 'TENSEI Pro Blue 1K 50', 'TENSEI Pro Blue 1K 60', 'TENSEI Pro White 1K', 'TENSEI Pro White 1K 60', 'TENSEI Pro Orange 1K', 'TENSEI Pro Orange 1K 50', 'TENSEI Pro Red 1K', 'TENSEI Pro Red 1K 50', 'TENSEI Pro Black 1K Core', 'TENSEI Pro Black 1K Core 60', 'TENSEI 1K BLUE 55', 'TENSEI 1K BLUE 65', 'TENSEI 1K BLUE HY 65', 'TENSEI AV BLUE', 'TENSEI AV BLUE 55', 'TENSEI BLUE TM50', 'TENSEI SILVER TM55', 'TENSEI GREEN 60 for Callaway', 'TENSEI 1K Hybrid',
    'VANQUISH', 'VANQUISH VV', 'VANQUISH VV 4', 'VANQUISH VV 5', 'VANQUISH VV 6', 'VANQUISH 4', 'VANQUISH 5', 'VANQUISH Driver', 'VANQUISH FW', 'VANQUISH Hybrid', 'VANQUISH Iron', 'KAI\'LI', 'MMT',
    'LIN-Q', 'LIN-Q BLUE EX', 'LIN-Q BLUE EX 5', 'LIN-Q BLUE EX 6', 'LIN-Q WHITE EX', 'LIN-Q WHITE EX 5', 'LIN-Q WHITE EX 6', 'LIN-Q RED EX', 'LIN-Q RED EX 5', 'LIN-Q RED EX 6', 'LIN-Q PowerCore Blue', 'LIN-Q PowerCore Blue 5', 'LIN-Q PowerCore White', 'LIN-Q PowerCore White 6', 'LIN-Q PowerCore Red', 'LIN-Q PowerCore Hybrid', 'LIN-Q LTE 40', 'ATTAS', 'ATTAS RX SUNRISE RED', 'ATTAS RX SUNRISE RED 5', 'ATTAS RX SUNRISE RED 6', 'ATTAS MB-FW', 'ATTAS MB-HY', 'Helium', 'Recoil', 'PROFORCE',
    'Dynamic Gold', 'Dynamic Gold 95', 'Dynamic Gold 105', 'Dynamic Gold 120', 'Dynamic Gold Tour Issue', 'AMT', 'Project X', 'Project X 6.0', 'Project X 6.5', 'Project X LZ', 'Project X IO', 'Project X LS',
    'MODUS', 'MODUS3 TOUR 105', 'MODUS3 TOUR 105 R', 'MODUS3 TOUR 105 S', 'MODUS3 TOUR 105 X', 'MODUS3 TOUR 115', 'MODUS3 TOUR 115 S', 'MODUS3 TOUR 120', 'MODUS3 TOUR 120 S', 'MODUS3 TOUR 125', 'MODUS3 TOUR 125 S', 'MODUS3 TOUR 130', 'MODUS3 WEDGE', 'MODUS3 HYBRID',
    'N.S.PRO 950GH neo', 'N.S.PRO 950GH neo S', 'N.S.PRO 950GH neo R', 'N.S.PRO 850GH', 'N.S.PRO 850GH neo', 'N.S.PRO 850GH neo S', 'N.S.PRO 850GH neo R', 'N.S.PRO 750GH neo', 'N.S.PRO 750GH neo S', 'N.S.PRO 750GH neo R', 'Zelos 7', 'Zelos 8', 'Regio Formula', 'Regio Formula MB+', 'Regio Formula B+', 'PING ULT 250D', 'PING ULT 250F', 'PING ULT 250H',
    'KBS TOUR', 'KBS C-TAPER', 'KBS TOUR LITE', 'KBS PGI',
    'MCI', 'MCI 50', 'MCI 60', 'MCI 70', 'MCI 80', 'MCI 90', 'MCI 100', 'MCI BLACK 60', 'MCI BLACK 80', 'PING TOUR', 'PING TOUR 2.0 CHROME 65', 'PING TOUR 2.0 CHROME 75', 'PING TOUR 2.0 BLACK 65', 'PING TOUR 2.0 BLACK 75', 'ALTA J CB', 'ALTA J CB BLACK', 'ALTA J CB SLATE', 'ALTA DISTANZA', 'VENTUS GREEN 50 for Callaway', 'Titleist Diamana Blue 55', '純正シャフト', 'その他'
];
const FLEX_SUGGESTIONS = ['L', 'A', 'R', 'SR', 'S', 'SX', 'X', 'TX', '5S', '5X', '6S', '6X', '7S', '7X', '8S', '8X', 'S200', 'S300', 'X100', 'R300', 'その他', '不明'];
const SHAFT_WEIGHT_SUGGESTIONS = ['40g', '45g', '50g', '55g', '60g', '65g', '70g', '75g', '80g', '85g', '90g', '95g', '100g', '105g', '110g', '115g', '120g', '40g台', '50g台', '60g台', '70g台', '80g台', '90g台', '100g台', '110g台', '120g台'];
const BRAND_MODEL_MAP: Record<string, string[]> = {
    ping: ['G430 MAX', 'G430 LST', 'G430 SFT', 'G440 MAX', 'G440 LST', 'G440 SFT', 'BLUEPRINT T', 'BLUEPRINT S', 'i230', 'i530', 's159', 'PLD ANSER'],
    'g le': ['G Le3', 'G Le4', 'G Le4 Anser 2D', 'G Le4 Louise', 'G Le4 Oslo'],
    taylormade: ['Qi10', 'Qi10 LS', 'Qi35', 'Qi35 LS', 'Qi35 MAX', 'Qi4D', 'Kalea Gold', 'P790', 'P770', 'P7CB', 'P7MB', 'MG4', 'MG5', 'Spider Tour', 'Spider Tour X', 'TP5', 'TP5x'],
    callaway: ['ELYTE', 'ELYTE ◆◆◆', 'PARADYM', 'PARADYM Ai Smoke', 'Ai Smoke MAX', 'REVA RISE', 'REVA', 'APEX UW', 'X FORGED', 'X FORGED STAR', 'OPUS', 'JAWS RAW', 'Ai-ONE', '2-BALL BLADE'],
    titleist: ['GT2', 'GT3', 'TSR2', 'TSR3', 'T100', 'T150', 'T200', 'T250', 'SM10', 'SM11', 'Phantom', 'Scotty Cameron Newport 2', 'Pro V1', 'Pro V1x'],
    srixon: ['ZXi LS', 'ZXi', 'ZX5 Mk II', 'ZX7 Mk II', 'ZXi5', 'ZXi7', 'Z-STAR XV', 'Z-STAR'],
    cobra: ['DS-ADAPT LS', 'DS-ADAPT X', 'DS-ADAPT MAX-K', 'DS-ADAPT MAX-D', 'KING TEC', 'KING TEC-X'],
    bridgestone: ['B1ST', 'B2HT', '241CB', '242CB+', 'BITING SPIN', 'TOUR B X', 'TOUR B XS'],
    mizuno: ['ST-MAX 230', 'ST-G', 'JPX 925 HOT METAL', 'Mizuno Pro 241', 'Mizuno Pro 243', 'Mizuno Pro S-3', 'T-1', 'T-3'],
    yamaha: ['RMX VD', 'RMX VD/M', 'inpres DRIVESTAR'],
    prgr: ['RS X', 'LS', 'SUPER egg'],
    xxio: ['XXIO 13', 'XXIO X', 'XXIO PRIME'],
    onoff: ['ONOFF KURO', 'ONOFF AKA'],
    pxg: ['0311 BLACK OPS', '0311 XP GEN7', 'Battle Ready II'],
    odyssey: ['Ai-ONE #7', 'Ai-ONE MILLED', 'WHITE HOT OG', 'ROSSIE S', 'Square 2 Square Jailbird', 'Square 2 Square Double Wide'],
    'scotty cameron': ['Phantom 5', 'Phantom 5.2', 'Phantom 7', 'Phantom 7.2', 'Phantom 7.5', 'Phantom 9R', 'Newport 2', 'Squareback 2', 'Studio Style Newport 2', 'Studio Style Squareback 2'],
    fourteen: ['RM-4', 'RM-α', 'DJ-6'],
};
const BRAND_SHAFT_MAP: Record<string, string[]> = {
    ping: ['PING TOUR 2.0 CHROME 65', 'PING TOUR 2.0 CHROME 75', 'PING TOUR 2.0 BLACK 65', 'PING TOUR 2.0 BLACK 75', 'ALTA J CB', 'ALTA J CB BLACK', 'ALTA J CB SLATE', 'ALTA DISTANZA', '24 VENTUS BLUE', 'TENSEI Pro Blue 1K'],
    taylormade: ['TENSEI BLUE TM50', 'TENSEI SILVER TM55', 'SPEEDER NX BLACK 50', 'SPEEDER NX GREEN 50', 'SPEEDER NX VIOLET 50', 'SPEEDER NX GOLD 50', '24 VENTUS BLUE', '26 VENTUS TR BLUE', 'Diamana WB 53'],
    callaway: ['VENTUS GREEN 50 for Callaway', 'TENSEI GREEN 60 for Callaway', 'LIN-Q BLUE EX 5', 'LIN-Q WHITE EX 5', 'VANQUISH 4', 'VANQUISH 5', 'ATTAS RX SUNRISE RED 5'],
    titleist: ['TENSEI 1K BLUE 55', 'TENSEI 1K BLUE 65', 'TENSEI 1K BLUE HY 65', 'TENSEI AV BLUE 55', 'Titleist Diamana Blue 55', '24 VENTUS BLUE', '26 VENTUS TR BLUE', 'Tour AD DI-6'],
    srixon: ['VENTUS TR BLACK', 'Diamana RB 53', 'Tour AD DI-6', 'Tour AD HY-85', 'MODUS3 TOUR 105 S', 'N.S.PRO 950GH neo S'],
    bridgestone: ['Tour AD GC-5', 'Tour AD GC-6', 'Diamana BB 53', 'VANQUISH VV 5', 'MCI 80', 'MODUS3 TOUR 105 S'],
    mizuno: ['Tour AD DI-6', '24 VENTUS BLUE', 'MCI 70', 'MCI 80', 'MODUS3 TOUR 105 S', 'N.S.PRO 950GH neo S'],
    yamaha: ['Diamana YR', 'Diamana WB 53', 'Tour AD UB-5', '24 VENTUS BLUE'],
    prgr: ['SPEEDER NX BLACK 40', 'SPEEDER NX GREEN 40', 'Diamana RB 43', 'VENTUS TR RED'],
    xxio: ['MP1300', 'Miyazaki AX-3', 'Diamana RB 43', 'SPEEDER NX GOLD 40'],
    onoff: ['SMOOTH KICK MP', 'LABOSPEC HASHIRI', 'LABOSPEC SHINARI', 'Diamana WB 53'],
    cobra: ['MCA Kai\'li Blue', '24 VENTUS BLUE', 'TENSEI AV BLUE 55', 'KBS PGI'],
};
const MODEL_SHAFT_MAP: Record<string, string[]> = {
    'g440': ['PING TOUR 2.0 CHROME 65', 'PING TOUR 2.0 BLACK 65', 'ALTA J CB', 'ALTA DISTANZA', '24 VENTUS BLUE'],
    'g430': ['PING TOUR 2.0 CHROME 65', 'PING TOUR 2.0 BLACK 65', 'ALTA J CB', '24 VENTUS BLUE'],
    'gt2': ['TENSEI 1K BLUE 55', 'TENSEI 1K BLUE 65', 'Titleist Diamana Blue 55', 'TENSEI AV BLUE 55'],
    'gt3': ['TENSEI 1K BLUE 65', '24 VENTUS BLUE', '26 VENTUS TR BLUE', 'Titleist Diamana Blue 55'],
    'tsr2': ['TENSEI AV BLUE 55', 'Titleist Diamana Blue 55', '24 VENTUS BLUE'],
    'tsr3': ['TENSEI AV BLUE 55', '24 VENTUS BLUE', '26 VENTUS TR BLUE'],
    'elyte': ['VENTUS GREEN 50 for Callaway', 'TENSEI GREEN 60 for Callaway', 'LIN-Q BLUE EX 5', 'VANQUISH 4'],
    'paradym': ['VENTUS GREEN 50 for Callaway', 'TENSEI GREEN 60 for Callaway', 'LIN-Q BLUE EX 5'],
    'qi35': ['TENSEI BLUE TM50', 'SPEEDER NX GOLD 50', '24 VENTUS BLUE', 'Diamana WB 53'],
    'qi10': ['TENSEI BLUE TM50', 'SPEEDER NX BLACK 50', '24 VENTUS BLUE'],
    'q i4d': ['SPEEDER NX GOLD 50', '24 VENTUS BLUE', 'Diamana WB 53'],
    'zxi': ['Diamana RB 53', 'VENTUS TR BLACK', 'Tour AD DI-6', 'N.S.PRO 950GH neo S'],
    'zx5mk ii': ['N.S.PRO 950GH neo S', 'MODUS3 TOUR 105 S', 'MCI 80'],
    'zx7mk ii': ['MODUS3 TOUR 105 S', 'MODUS3 TOUR 120 S', 'Dynamic Gold 105'],
    'p790': ['MCI 70', 'MCI 80', 'N.S.PRO 950GH neo S', 'MODUS3 TOUR 105 S'],
    'p770': ['MCI 80', 'MODUS3 TOUR 105 S', 'Dynamic Gold 105'],
};
const CATEGORY_WEIGHT_MAP: Partial<Record<TargetCategory, string[]>> = {
    [TargetCategory.DRIVER]: ['40g', '45g', '50g', '55g', '60g', '65g', '40g台', '50g台', '60g台'],
    [TargetCategory.FAIRWAY]: ['50g', '55g', '60g', '65g', '70g', '50g台', '60g台', '70g台'],
    [TargetCategory.UTILITY]: ['65g', '70g', '75g', '80g', '85g', '90g', '70g台', '80g台', '90g台'],
    [TargetCategory.IRON]: ['80g', '85g', '90g', '95g', '100g', '105g', '110g', '120g', '80g台', '90g台', '100g台', '110g台', '120g台'],
    [TargetCategory.WEDGE]: ['95g', '100g', '105g', '110g', '115g', '120g', '95g', '100g台', '110g台', '120g台'],
    [TargetCategory.PUTTER]: ['33インチ', '34インチ', '35インチ'],
};
const MISS_OPTIONS = ['左に行く', '右に行く', 'チーピン', 'スライス', '球が上がらない', '吹け上がる', '距離が合わない', 'ミスは特にない', 'その他'];
const USE_OPTIONS = ['ティーショット', 'セカンド', '狭いホール用', '風の日用', '距離の階段用', 'ロングアイアンの代わり', 'UTの代わり'];
const WEDGE_USE_OPTIONS = ['フルショット', '100y以内', 'アプローチ', 'バンカー', 'ラフ', 'ベアグラウンド', 'ロブショット', '転がし'];
const OTHER_MISS_OPTION = 'その他';

type Step = 1 | 2 | 3 | 4 | 5;

type SlotDefinition = {
    id: string;
    label: string;
    group: string;
    category: TargetCategory;
    number: string;
    clubType: string;
    defaultLoft?: string;
};

type CommonEditState = {
    brand: string;
    model: string;
    shaft: string;
    flex: string;
    shaftWeight: string;
};

interface MyBagManagerProps {
    setting: ClubSetting;
    onUpdate: (setting: ClubSetting | ((prev: ClubSetting) => ClubSetting)) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    isManualSaveInFlight?: boolean;
    saveErrorDetail?: string | null;
    hasUnsavedChanges?: boolean;
    pendingBagChangeCount?: number;
    pendingBagChangeIds?: string[];
    lastCloudSavedAt?: string | null;
    lastSaveTargetClubCount?: number;
    lastSavedClubCount?: number;
    extendedColumnsSaved?: boolean;
    missingExtendedColumns?: string[];
    onManualSave?: (settingOverride?: ClubSetting) => void;
    onManualSaveClub?: (clubId: string, settingOverride?: ClubSetting) => Promise<{ ok: boolean; error?: string }>;
    onReloadFromCloud?: () => void;
    onOpenBallDiagnosis?: () => void;
    intakeMode?: 'default' | 'missing-clubs' | 'ball-first';
    requestedEditClubId?: string | null;
    onConsumeRequestedEditClubId?: () => void;
    desktopLayout?: 'default' | 'table';
}

type ClubEditorDraft = {
    club: Club;
    ballBrand: string;
    ballModel: string;
    ballColor: string;
    ballMemo: string;
};

type ClubEditorNotice = {
    tone: 'success' | 'warning' | 'error';
    message: string;
    detail?: string;
};

const BALL_BRAND_SUGGESTIONS = Array.from(new Set(BALL_MASTER_DATA.map((brand) => brand.name))).sort((a, b) => a.localeCompare(b));
const BALL_MODEL_SUGGESTIONS = Array.from(
    new Set(
        BALL_MASTER_DATA.flatMap((brand) =>
            brand.models
                .map((model) => model.name)
                .filter((name) => name !== 'わからない・相談したい'),
        ),
    ),
).sort((a, b) => a.localeCompare(b));

const wedgeSlots = Array.from({ length: 21 }, (_, index) => {
    const loft = 44 + index;
    return {
        id: `wedge-${loft}`,
        label: `${loft}°`,
        group: 'ウェッジ',
        category: TargetCategory.WEDGE,
        number: `${loft}°`,
        clubType: 'specialty_wedge',
        defaultLoft: `${loft}°`,
    };
});

const SLOT_GROUPS: Array<{ title: string; tone: string; slots: SlotDefinition[] }> = [
    {
        title: 'ドライバー・ミニドライバー',
        tone: 'emerald',
        slots: [
            { id: 'driver-1w', label: '1W', group: 'ドライバー', category: TargetCategory.DRIVER, number: '1W', clubType: 'standard_driver' },
            { id: 'driver-mini', label: 'ミニドライバー / 2W', group: 'ドライバー', category: TargetCategory.DRIVER, number: 'Mini / 2W', clubType: 'mini_driver' },
        ],
    },
    {
        title: 'フェアウェイウッド',
        tone: 'teal',
        slots: ['2W', '3W', '4W', '5W', '7W', '9W', '11W', 'その他FW'].map((number) => ({
            id: `fw-${number}`,
            label: number,
            group: 'フェアウェイウッド',
            category: TargetCategory.FAIRWAY,
            number,
            clubType: 'fairway_wood',
        })),
    },
    {
        title: 'ユーティリティ / ハイブリッド',
        tone: 'cyan',
        slots: ['2U', '3U', '4U', '5U', '6U', '7U', '8U', 'その他UT'].map((number) => ({
            id: `ut-${number}`,
            label: number,
            group: 'ユーティリティ',
            category: TargetCategory.UTILITY,
            number,
            clubType: 'hybrid',
        })),
    },
    {
        title: 'ドライビングアイアン',
        tone: 'sky',
        slots: ['2DI', '3DI', '4DI', '5DI', 'その他DI'].map((number) => ({
            id: `di-${number}`,
            label: number,
            group: 'ドライビングアイアン',
            category: TargetCategory.UTILITY,
            number,
            clubType: 'utility_iron',
        })),
    },
    {
        title: 'アイアン',
        tone: 'blue',
        slots: ['1I', '2I', '3I', '4I', '5I', '6I', '7I', '8I', '9I', '10I', 'PW', 'AW', 'GW', 'SW', 'LW'].map((number) => ({
            id: `iron-${number}`,
            label: number,
            group: 'アイアン',
            category: ['PW', 'AW', 'GW', 'SW', 'LW'].includes(number) ? TargetCategory.WEDGE : TargetCategory.IRON,
            number,
            clubType: ['PW', 'AW', 'GW', 'SW', 'LW'].includes(number) ? 'set_wedge' : 'iron',
        })),
    },
    {
        title: 'ウェッジ',
        tone: 'indigo',
        slots: [
            ...wedgeSlots,
            { id: 'wedge-custom', label: 'その他ロフトを入力', group: 'ウェッジ', category: TargetCategory.WEDGE, number: 'その他ロフト', clubType: 'specialty_wedge' },
        ],
    },
    {
        title: 'その他',
        tone: 'slate',
        slots: [
            { id: 'other-chipper', label: 'チッパー', group: 'その他', category: TargetCategory.WEDGE, number: 'Chipper', clubType: 'chipper' },
            { id: 'putter-standard', label: 'パター', group: 'パター', category: TargetCategory.PUTTER, number: 'PT', clubType: 'standard_putter' },
            { id: 'putter-long', label: '長尺パター', group: 'パター', category: TargetCategory.PUTTER, number: 'Long PT', clubType: 'long_putter' },
            { id: 'putter-mid', label: '中尺パター', group: 'パター', category: TargetCategory.PUTTER, number: 'Mid PT', clubType: 'mid_putter' },
            { id: 'putter-arm', label: 'アームロックパター', group: 'パター', category: TargetCategory.PUTTER, number: 'Arm Lock PT', clubType: 'arm_lock_putter' },
            { id: 'ball', label: 'ボール', group: 'ボール', category: TargetCategory.BALL, number: 'BALL', clubType: 'ball' },
        ],
    },
];

const ALL_SLOTS = SLOT_GROUPS.flatMap((group) => group.slots);
const BATCH_GROUPS = ['フェアウェイウッド', 'ユーティリティ', 'ドライビングアイアン', 'アイアン', 'ウェッジ'];

const generateClubId = () => {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `club-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const parseShaftParts = (club: Club) => {
    const shaft = club.shaft || '';
    const weight = club.shaftWeight || shaft.match(/(\d{2,3}g台|\d{2,3}g)/)?.[1] || '';
    const flex = club.flex || '';
    const model = shaft
        .replace(weight, '')
        .replace(new RegExp(`\\b${flex}\\b`, 'i'), '')
        .replace(/\s+/g, ' ')
        .trim();
    return { model, weight, flex };
};

const buildShaft = (shaft: string, weight: string, flex: string) =>
    [shaft, weight, flex].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

const normalizeLoftValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const withoutDegree = trimmed.replace(/°/g, '').trim();
    return /^[0-9]+(?:\.[0-9]+)?$/.test(withoutDegree) ? `${withoutDegree}°` : trimmed;
};

const normalizeSuggestionKey = (value: string) => value.toLowerCase().replace(/\s+/g, '').replace(/[・._-]/g, '');

const buildModelSuggestions = (brand: string, category: string, currentModel: string) => {
    const key = normalizeSuggestionKey(brand);
    const brandModels = Object.entries(BRAND_MODEL_MAP).find(([mapKey]) => key.includes(normalizeSuggestionKey(mapKey)))?.[1] || [];
    const categoryModels =
        category === TargetCategory.PUTTER
            ? ['Spider Tour', 'Phantom 5', 'Phantom 7', 'Ai-ONE #7', 'WHITE HOT OG', 'Newport 2', 'PLD ANSER']
            : category === TargetCategory.WEDGE
                ? ['Vokey SM10', 'Vokey SM11', 'OPUS', 'JAWS RAW', 'RTX', 's159', 'RM-4']
                : category === TargetCategory.IRON
                    ? ['P790', 'P770', 'T100', 'T150', 'ZX5 Mk II', 'ZX7 Mk II', 'i230', 'i530', '241CB', '242CB+']
                    : [];
    return Array.from(new Set([currentModel, ...brandModels, ...categoryModels, ...MODEL_SUGGESTIONS].filter(Boolean)));
};

const buildWeightSuggestions = (category: string, currentWeight: string) =>
    Array.from(new Set([currentWeight, ...(CATEGORY_WEIGHT_MAP[category as TargetCategory] || []), ...SHAFT_WEIGHT_SUGGESTIONS].filter(Boolean)));

const buildModelAwareShaftSuggestions = (brand: string, model: string, currentShaft: string) => {
    const brandKey = normalizeSuggestionKey(brand);
    const modelKey = normalizeSuggestionKey(model);
    const brandShafts = Object.entries(BRAND_SHAFT_MAP).find(([mapKey]) => brandKey.includes(normalizeSuggestionKey(mapKey)))?.[1] || [];
    const modelShafts = Object.entries(MODEL_SHAFT_MAP).find(([mapKey]) => modelKey.includes(normalizeSuggestionKey(mapKey)))?.[1] || [];
    return Array.from(new Set([currentShaft, ...modelShafts, ...brandShafts, ...SHAFT_SUGGESTIONS].filter(Boolean)));
};

const buildFlexSuggestions = (shaft: string, currentFlex: string) => {
    const shaftKey = normalizeSuggestionKey(shaft);
    const steelFlexes = ['R300', 'S200', 'S300', 'X100', '6.0', '6.5'];
    const graphiteFlexes = ['L', 'A', 'R', 'SR', 'S', 'SX', 'X', 'TX', '4R', '4S', '5R', '5S', '5X', '6S', '6X', '7S', '7X'];
    const hybridFlexes = ['R', 'S', 'X', '5S', '5X', '6S', '6X', '7S', '7X'];
    const pool =
        /dynamicgold|modus|nspro|projectx|kbsc|kbspgi|kbstour|zelos/.test(shaftKey)
            ? steelFlexes
            : /hybrid|hb|hy-|mci|mmt|recoil|pgi/.test(shaftKey)
                ? hybridFlexes
                : graphiteFlexes;
    return Array.from(new Set([currentFlex, ...pool, ...FLEX_SUGGESTIONS].filter(Boolean)));
};

const buildBallModelSuggestions = (brand: string, currentModel: string) => {
    const key = normalizeSuggestionKey(brand);
    const brandModels = BALL_MASTER_DATA.find((item) => normalizeSuggestionKey(item.name) === key)?.models.map((model) => model.name) || [];
    return Array.from(new Set([currentModel, ...brandModels, ...BALL_MODEL_SUGGESTIONS].filter(Boolean)));
};

const slotKeyForClub = (club: Club) => `${club.category}:${club.number || club.model || club.id}`;
const slotKey = (slot: SlotDefinition) => `${slot.category}:${slot.number}`;

const makeClubFromSlot = (slot: SlotDefinition): Club => ({
    id: generateClubId(),
    category: slot.category,
    brand: '',
    model: '',
    shaft: '',
    flex: '',
    shaftWeight: '',
    number: slot.number,
    loft: slot.defaultLoft || '',
    distance: '',
    carryDistance: '',
    mainUse: [],
    missTendency: [],
    memo: '',
    worry: '',
});

const sortClub = (club: Club) => {
    const categoryOrder = [TargetCategory.DRIVER, TargetCategory.FAIRWAY, TargetCategory.UTILITY, TargetCategory.IRON, TargetCategory.WEDGE, TargetCategory.PUTTER, TargetCategory.BALL];
    const categoryIndex = categoryOrder.indexOf(club.category as TargetCategory);
    const number = club.number || '';
    const numeric = Number(number.match(/\d+/)?.[0] || 999);
    return categoryIndex * 1000 + numeric;
};

const parseDistanceValue = (value?: string) => {
    const normalized = String(value || '').replace(/[^\d.]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const sortClubByDistance = (view: 'total' | 'carry') => (a: Club, b: Club) => {
    const specialOrder = (club: Club) =>
        club.category === TargetCategory.PUTTER ? 1 :
        club.category === TargetCategory.BALL ? 2 :
        0;
    const specialDiff = specialOrder(a) - specialOrder(b);
    if (specialDiff !== 0) return specialDiff;
    if (specialOrder(a) > 0) return sortClub(a) - sortClub(b);

    const primaryA = parseDistanceValue(view === 'carry' ? a.carryDistance : a.distance);
    const primaryB = parseDistanceValue(view === 'carry' ? b.carryDistance : b.distance);
    const fallbackA = parseDistanceValue(view === 'carry' ? a.distance : a.carryDistance);
    const fallbackB = parseDistanceValue(view === 'carry' ? b.distance : b.carryDistance);
    const distanceA = primaryA || fallbackA;
    const distanceB = primaryB || fallbackB;

    if (distanceA !== distanceB) return distanceB - distanceA;
    return sortClub(a) - sortClub(b);
};

const displayShaftText = (club: Club) => {
    if (club.category === TargetCategory.BALL) return '';
    const parts = parseShaftParts(club);
    const values = [parts.model || club.shaft, parts.weight, parts.flex]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
    return Array.from(new Set(values)).join(' ');
};

const displayShaftModelText = (club: Club) => {
    if (club.category === TargetCategory.BALL) return '';
    const parts = parseShaftParts(club);
    return String(parts.model || club.shaft || '').trim();
};

const displayShaftSpecText = (club: Club) => {
    if (club.category === TargetCategory.BALL) return '';
    const parts = parseShaftParts(club);
    const values = [parts.weight, parts.flex, club.loft]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
    return Array.from(new Set(values)).join(' / ');
};

const formatDistanceLabel = (value: string) => {
    const trimmed = String(value || '').trim();
    if (!trimmed || trimmed === '-') return '-';
    return /y|yd|yard|ヤード/i.test(trimmed) ? trimmed : `${trimmed}y`;
};

const distanceBadgeText = (club: Club, view: 'total' | 'carry') => {
    if (club.category === TargetCategory.PUTTER || club.category === TargetCategory.BALL) {
        return '-';
    }
    const total = String(club.distance || '').trim();
    const carry = String(club.carryDistance || '').trim();
    const active = view === 'carry' ? carry : total;
    const fallback = view === 'carry' ? total : carry;
    return formatDistanceLabel(active || fallback || '-');
};

const inferPutterHeadShape = (model: string) => {
    const text = model.toLowerCase();
    if (!text.trim()) return '';
    if (/2-ball|spider|rossie|seven|phantom|mallet|#7|no\.7/.test(text)) return 'ネオマレット';
    if (/newport|anser|blade|ping型|ピン型/.test(text)) return 'ブレード';
    if (/center|センター/.test(text)) return 'センターシャフト';
    if (/l字|l-shape/.test(text)) return 'L字';
    return '';
};

const toggleArrayValue = (values: string[] | undefined, value: string) => {
    const current = values || [];
    return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
};

const sameStringArray = (left?: string[], right?: string[]) => {
    const a = left || [];
    const b = right || [];
    return a.length === b.length && a.every((value, index) => value === b[index]);
};

const Field = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <label className="block">
        <span className="mb-0.5 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 md:mb-1 md:text-[10px] md:tracking-[0.18em]">{label}</span>
        {children}
    </label>
);

const textInputClass = 'h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-trust-navy outline-none transition focus:border-[#176534] focus:ring-2 focus:ring-[#176534]/10 md:h-10 md:rounded-lg md:px-3 md:text-sm';

export const MyBagManager: React.FC<MyBagManagerProps> = ({
    setting,
    onUpdate,
    saveStatus,
    isManualSaveInFlight = false,
    saveErrorDetail = null,
    hasUnsavedChanges = false,
    pendingBagChangeIds = [],
    lastCloudSavedAt = null,
    lastSaveTargetClubCount = 0,
    lastSavedClubCount = 0,
    onManualSave,
    onReloadFromCloud,
    onOpenBallDiagnosis,
    intakeMode = 'default',
    requestedEditClubId = null,
    onConsumeRequestedEditClubId,
    desktopLayout = 'default',
}) => {
    const latestSettingRef = useRef(setting);
    const [step, setStep] = useState<Step>(1);
    const [showFlowEditor, setShowFlowEditor] = useState(
        () => intakeMode !== 'default' || Boolean(requestedEditClubId) || setting.clubs.length === 0,
    );
    const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
    const [batchTarget, setBatchTarget] = useState(BATCH_GROUPS[0]);
    const [batchEditIds, setBatchEditIds] = useState<string[]>([]);
    const [copySourceId, setCopySourceId] = useState('');
    const [copyTargetSlotId, setCopyTargetSlotId] = useState('');
    const [copyFields, setCopyFields] = useState(['brand', 'model', 'shaft', 'flex', 'shaftWeight', 'memo']);
    const [clubListDistanceView, setClubListDistanceView] = useState<'total' | 'carry'>('total');
    const [commonEdit, setCommonEdit] = useState<CommonEditState>({
        brand: '',
        model: '',
        shaft: '',
        flex: '',
        shaftWeight: '',
    });
    const [editingClubId, setEditingClubId] = useState<string | null>(null);
    const [editingDraft, setEditingDraft] = useState<ClubEditorDraft | null>(null);
    const [clubEditorNotice, setClubEditorNotice] = useState<ClubEditorNotice | null>(null);
    const isClubEditorSaving = isManualSaveInFlight;

    useEffect(() => {
        latestSettingRef.current = setting;
    }, [setting]);

    const clubs = useMemo(() => [...setting.clubs].sort(sortClubByDistance(clubListDistanceView)), [setting.clubs, clubListDistanceView]);
    const selectedKeys = useMemo(() => new Set(setting.clubs.map(slotKeyForClub)), [setting.clubs]);
    const settingName = setting.name?.trim() || DEFAULT_SETTING_NAME;
    const purpose = setting.purpose || 'メイン';
    const selectedClubCount = setting.clubs.length;
    const nonBallClubs = setting.clubs.filter((club) => club.category !== TargetCategory.BALL);
    const ballClub = setting.clubs.find((club) => club.category === TargetCategory.BALL);
    const warningOverLimit = nonBallClubs.length > ROUND_LIMIT;
    const useDesktopTable = desktopLayout === 'table';
    void saveErrorDetail;

    const commitSetting = useCallback((updater: ClubSetting | ((prev: ClubSetting) => ClubSetting)) => {
        const base = latestSettingRef.current;
        const next = typeof updater === 'function' ? updater(base) : updater;
        latestSettingRef.current = next;
        onUpdate(next);
        return next;
    }, [onUpdate]);

    const buildEditorDraft = useCallback((club: Club, sourceSetting: ClubSetting): ClubEditorDraft => ({
        club: {
            ...club,
            mainUse: [...(club.mainUse || [])],
            missTendency: [...(club.missTendency || [])],
        },
        ballBrand: sourceSetting.ballBrand || club.brand || '',
        ballModel: sourceSetting.ball || club.model || '',
        ballColor: sourceSetting.ballColor || '',
        ballMemo: sourceSetting.ballMemo || club.memo || '',
    }), []);

    const isDraftDirty = useCallback((clubId: string, draft: ClubEditorDraft | null) => {
        if (!draft) return false;
        const sourceClub = latestSettingRef.current.clubs.find((club) => club.id === clubId);
        if (!sourceClub) return false;
        const sourceSetting = latestSettingRef.current;

        return (
            sourceClub.brand !== draft.club.brand ||
            sourceClub.model !== draft.club.model ||
            sourceClub.shaft !== draft.club.shaft ||
            (sourceClub.flex || '') !== (draft.club.flex || '') ||
            (sourceClub.number || '') !== (draft.club.number || '') ||
            sourceClub.loft !== draft.club.loft ||
            sourceClub.distance !== draft.club.distance ||
            (sourceClub.carryDistance || '') !== (draft.club.carryDistance || '') ||
            (sourceClub.worry || '') !== (draft.club.worry || '') ||
            (sourceClub.shaftWeight || '') !== (draft.club.shaftWeight || '') ||
            (sourceClub.sleeveSetting || '') !== (draft.club.sleeveSetting || '') ||
            (sourceClub.length || '') !== (draft.club.length || '') ||
            (sourceClub.lieAngle || '') !== (draft.club.lieAngle || '') ||
            (sourceClub.bounce || '') !== (draft.club.bounce || '') ||
            (sourceClub.grind || '') !== (draft.club.grind || '') ||
            (sourceClub.headShape || '') !== (draft.club.headShape || '') ||
            !sameStringArray(sourceClub.mainUse, draft.club.mainUse) ||
            !sameStringArray(sourceClub.missTendency, draft.club.missTendency) ||
            (sourceClub.memo || '') !== (draft.club.memo || '') ||
            (sourceSetting.ballBrand || sourceClub.brand || '') !== draft.ballBrand ||
            (sourceSetting.ball || sourceClub.model || '') !== draft.ballModel ||
            (sourceSetting.ballColor || '') !== draft.ballColor ||
            (sourceSetting.ballMemo || sourceClub.memo || '') !== draft.ballMemo
        );
    }, []);

    const saveCurrentSetting = useCallback((override?: ClubSetting) => {
        const next = {
            ...(override || latestSettingRef.current),
            name: (override || latestSettingRef.current).name?.trim() || DEFAULT_SETTING_NAME,
        };
        latestSettingRef.current = next;
        onManualSave?.(next);
    }, [onManualSave]);

    const discardEditingDraft = (message = '編集中の内容を破棄しますか？') => {
        if (!hasDirtyEditingDraft) {
            setEditingClubId(null);
            setEditingDraft(null);
            setExpandedClubId(null);
            return true;
        }

        const shouldDiscard = window.confirm(message);
        if (!shouldDiscard) return false;

        setEditingClubId(null);
        setEditingDraft(null);
        setExpandedClubId(null);
        return true;
    };

    const enterFlowEditor = (nextStep: Step = 4) => {
        if (isClubEditorSaving) return;
        setShowFlowEditor(true);
        setStep(nextStep);
    };

    const closeFlowEditor = () => {
        if (isClubEditorSaving) return;
        if (hasDirtyEditingDraft) {
            applyEditingDraftLocally();
        } else {
            setEditingClubId(null);
            setEditingDraft(null);
            setExpandedClubId(null);
        }
        setStep(4);
        setShowFlowEditor(false);
    };

    const openClubEditor = (clubId: string) => {
        if (isClubEditorSaving) return;
        setShowFlowEditor(true);
        setStep(4);

        if (editingClubId === clubId) {
            if (hasDirtyEditingDraft) {
                const nextSetting = applyEditingDraftLocally();
                if (nextSetting) {
                    setClubEditorNotice({
                        tone: 'success',
                        message: '入力内容を一覧に反映しました。',
                        detail: 'ほかのクラブも続けて編集できます。最後に「変更を保存」でまとめて保存してください。',
                    });
                }
            } else {
                setEditingClubId(null);
                setEditingDraft(null);
                setExpandedClubId(null);
            }
            return;
        }

        if (editingClubId && editingClubId !== clubId && isDraftDirty(editingClubId, editingDraft)) {
            applyEditingDraftLocally();
        }

        const sourceClub = latestSettingRef.current.clubs.find((club) => club.id === clubId);
        if (!sourceClub) return;

        setExpandedClubId(clubId);
        setEditingClubId(clubId);
        setEditingDraft(buildEditorDraft(sourceClub, latestSettingRef.current));
        setClubEditorNotice(
            editingClubId && editingClubId !== clubId
                ? {
                    tone: 'success',
                    message: '前のクラブの入力内容を一覧に反映しました。',
                    detail: '最後に「変更を保存」でまとめて保存できます。',
                }
                : null,
        );
    };

    const cancelClubEditor = () => {
        if (isClubEditorSaving) return;
        discardEditingDraft('編集中の内容を破棄してキャンセルしますか？');
    };

    const updateEditingDraftClub = (patch: Partial<Club>) => {
        setEditingDraft((prev) => prev ? {
            ...prev,
            club: {
                ...prev.club,
                ...patch,
            },
        } : prev);
    };

    const updateEditingDraftBall = (patch: Partial<Pick<ClubEditorDraft, 'ballBrand' | 'ballModel' | 'ballColor' | 'ballMemo'>>) => {
        setEditingDraft((prev) => prev ? { ...prev, ...patch } : prev);
    };

    const buildSettingFromEditingDraft = useCallback((
        sourceSetting: ClubSetting,
        clubId = editingClubId,
        draft = editingDraft,
    ): ClubSetting | null => {
        if (!clubId || !draft) return null;

        const nextClub = {
            ...draft.club,
            mainUse: [...(draft.club.mainUse || [])],
            missTendency: [...(draft.club.missTendency || [])],
        };

        return {
            ...sourceSetting,
            clubs: sourceSetting.clubs.map((club) => (club.id === clubId ? nextClub : club)),
            ...(nextClub.category === TargetCategory.BALL
                ? {
                    ballBrand: draft.ballBrand,
                    ball: draft.ballModel,
                    ballColor: draft.ballColor,
                    ballMemo: draft.ballMemo,
                  }
                : {}),
        };
    }, [editingClubId, editingDraft]);

    const applyEditingDraftLocally = useCallback(() => {
        const nextSetting = buildSettingFromEditingDraft(latestSettingRef.current);
        if (!nextSetting) return null;
        commitSetting(nextSetting);
        setEditingClubId(null);
        setEditingDraft(null);
        setExpandedClubId(null);
        return nextSetting;
    }, [buildSettingFromEditingDraft, commitSetting]);

    const hasDirtyEditingDraft = Boolean(editingClubId && isDraftDirty(editingClubId, editingDraft));

    useEffect(() => {
        if (!requestedEditClubId) return;
        if (!setting.clubs.some((club) => club.id === requestedEditClubId)) {
            onConsumeRequestedEditClubId?.();
            return;
        }

        setShowFlowEditor(true);
        setStep(4);
        openClubEditor(requestedEditClubId);
        onConsumeRequestedEditClubId?.();
    }, [requestedEditClubId, setting.clubs, onConsumeRequestedEditClubId]);

    useEffect(() => {
        if (intakeMode !== 'default' || setting.clubs.length === 0) {
            setShowFlowEditor(true);
        }
    }, [intakeMode, setting.clubs.length]);

    useEffect(() => {
        const shouldWarn = hasDirtyEditingDraft || hasUnsavedChanges || isClubEditorSaving || isManualSaveInFlight;
        if (!shouldWarn) return;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasDirtyEditingDraft, hasUnsavedChanges, isClubEditorSaving, isManualSaveInFlight]);

    const navigateToStep = (nextStep: Step) => {
        if (isClubEditorSaving) return;
        if (hasDirtyEditingDraft) {
            applyEditingDraftLocally();
        }
        setStep(nextStep);
    };

    const handleSaveCurrentSetting = () => {
        if (isClubEditorSaving) return;
        const nextSetting = hasDirtyEditingDraft ? applyEditingDraftLocally() : latestSettingRef.current;
        saveCurrentSetting(nextSetting || latestSettingRef.current);
        if (hasDirtyEditingDraft) {
            setClubEditorNotice({
                tone: 'success',
                message: '編集中の内容を反映して保存しました。',
            });
        }
    };

    const handleReloadFromCloud = () => {
        if (isClubEditorSaving) return;
        if (hasDirtyEditingDraft) {
            if (!discardEditingDraft('編集中の内容は未保存です。破棄してクラウドから再読み込みしますか？')) return;
        }
        onReloadFromCloud?.();
    };

    const handleOpenBallDiagnosis = () => {
        if (isClubEditorSaving) return;
        if (hasDirtyEditingDraft) {
            applyEditingDraftLocally();
        }
        onOpenBallDiagnosis?.();
    };

    const handleRemoveClub = (club: Club) => {
        if (isClubEditorSaving) return;
        if (hasDirtyEditingDraft) {
            if (editingClubId === club.id) {
                const shouldDiscard = window.confirm('編集中の内容を破棄してこのクラブを削除しますか？');
                if (!shouldDiscard) return;
                setEditingClubId(null);
                setEditingDraft(null);
                setExpandedClubId(null);
            } else {
                const shouldDiscard = window.confirm('別のクラブを編集中です。編集中の内容を破棄して削除を続けますか？');
                if (!shouldDiscard) return;
                setEditingClubId(null);
                setEditingDraft(null);
                setExpandedClubId(null);
            }
        }

        if (!window.confirm(`${club.number || club.category} を削除しますか？`)) return;
        removeClub(club.id);
    };

    const duplicateClubFromCard = (sourceClub: Club) => {
        if (isClubEditorSaving) return;
        let nextSourceClub = sourceClub;
        let baseSetting = latestSettingRef.current;

        if (hasDirtyEditingDraft) {
            const nextSetting = applyEditingDraftLocally();
            if (nextSetting) {
                baseSetting = nextSetting;
                const refreshedSourceClub = nextSetting.clubs.find((club) => club.id === sourceClub.id);
                if (refreshedSourceClub) {
                    nextSourceClub = refreshedSourceClub;
                }
            }
        }

        const sourceSlot = ALL_SLOTS.find((candidate) => slotKey(candidate) === slotKeyForClub(nextSourceClub));
        const nextSlot = ALL_SLOTS.find((slot) =>
            slot.category !== TargetCategory.BALL &&
            slot.id !== sourceSlot?.id &&
            (!sourceSlot || slot.group === sourceSlot.group || slot.category === sourceSlot.category) &&
            !selectedKeys.has(slotKey(slot)),
        );

        if (!nextSlot) {
            setClubEditorNotice({
                tone: 'warning',
                message: '複製先に使える空き番手が見つかりませんでした。',
                detail: '先に STEP 2 で番手を追加するか、STEP 3 の複製機能を使ってください。',
            });
            return;
        }

        const nextClub = makeClubFromSlot(nextSlot);
        const copiedClub: Club = {
            ...nextClub,
            brand: nextSourceClub.brand,
            model: nextSourceClub.model,
            shaft: nextSourceClub.shaft,
            flex: nextSourceClub.flex,
            shaftWeight: nextSourceClub.shaftWeight,
            carryDistance: nextSourceClub.carryDistance,
            distance: nextSourceClub.distance,
            worry: nextSourceClub.worry,
            sleeveSetting: nextSourceClub.sleeveSetting,
            length: nextSourceClub.length,
            lieAngle: nextSourceClub.lieAngle,
            bounce: nextSourceClub.bounce,
            grind: nextSourceClub.grind,
            headShape: nextSourceClub.headShape,
            mainUse: [...(nextSourceClub.mainUse || [])],
            missTendency: [...(nextSourceClub.missTendency || [])],
            memo: nextSourceClub.memo,
            copiedFromClubId: nextSourceClub.id,
            loft: nextClub.loft || nextSourceClub.loft,
        };

        const nextSetting = {
            ...baseSetting,
            clubs: [...baseSetting.clubs, copiedClub],
        };
        commitSetting(nextSetting);
        setExpandedClubId(copiedClub.id);
        setEditingClubId(copiedClub.id);
        setEditingDraft(buildEditorDraft(copiedClub, nextSetting));
        setClubEditorNotice({
            tone: 'success',
            message: 'クラブを複製しました。',
            detail: `${copiedClub.number || copiedClub.category} の内容を続けて調整できます。`,
        });
    };

    const removeClub = (clubId: string) => {
        commitSetting((prev) => ({
            ...prev,
            clubs: prev.clubs.filter((club) => club.id !== clubId),
        }));
        if (expandedClubId === clubId) setExpandedClubId(null);
        if (editingClubId === clubId) {
            setEditingClubId(null);
            setEditingDraft(null);
        }
    };

    const toggleSlot = (slot: SlotDefinition) => {
        if (slot.category === TargetCategory.BALL) {
            commitSetting((prev) => {
                const exists = prev.clubs.some((club) => club.category === TargetCategory.BALL);
                if (exists) return { ...prev, clubs: prev.clubs.filter((club) => club.category !== TargetCategory.BALL), ball: '', ballBrand: '', ballColor: '', ballMemo: '' };
                return { ...prev, clubs: [...prev.clubs, makeClubFromSlot(slot)] };
            });
            return;
        }

        const key = slotKey(slot);
        commitSetting((prev) => {
            const exists = prev.clubs.some((club) => slotKeyForClub(club) === key);
            if (exists) return { ...prev, clubs: prev.clubs.filter((club) => slotKeyForClub(club) !== key) };
            const nextClub = makeClubFromSlot(slot);
            return { ...prev, clubs: [...prev.clubs, nextClub] };
        });
    };

    const applyCommonToGroup = () => {
        const targets = setting.clubs.filter((club) => {
            const slot = ALL_SLOTS.find((candidate) => slotKey(candidate) === slotKeyForClub(club));
            return slot?.group === batchTarget;
        });
        if (targets.length === 0) return;

        const shaft = buildShaft(commonEdit.shaft, commonEdit.shaftWeight, commonEdit.flex);
        commitSetting((prev) => ({
            ...prev,
            clubs: prev.clubs.map((club) => {
                if (!targets.some((target) => target.id === club.id)) return club;
                return {
                    ...club,
                    brand: commonEdit.brand || club.brand,
                    model: commonEdit.model || club.model,
                    shaft: shaft || club.shaft,
                    flex: commonEdit.flex || club.flex,
                    shaftWeight: commonEdit.shaftWeight || club.shaftWeight,
                };
            }),
        }));
    };

    const applyBatchEdit = () => {
        if (batchEditIds.length === 0) return;
        const shaft = buildShaft(commonEdit.shaft, commonEdit.shaftWeight, commonEdit.flex);
        commitSetting((prev) => ({
            ...prev,
            clubs: prev.clubs.map((club) => {
                if (!batchEditIds.includes(club.id)) return club;
                return {
                    ...club,
                    brand: commonEdit.brand || club.brand,
                    model: commonEdit.model || club.model,
                    shaft: shaft || club.shaft,
                    flex: commonEdit.flex || club.flex,
                    shaftWeight: commonEdit.shaftWeight || club.shaftWeight,
                };
            }),
        }));
        setBatchEditIds([]);
    };

    const duplicateClub = () => {
        const source = setting.clubs.find((club) => club.id === copySourceId);
        const target = ALL_SLOTS.find((slot) => slot.id === copyTargetSlotId);
        if (!source || !target) return;
        const newClub = makeClubFromSlot(target);
        const copied: Club = {
            ...newClub,
            brand: copyFields.includes('brand') ? source.brand : newClub.brand,
            model: copyFields.includes('model') ? source.model : newClub.model,
            shaft: copyFields.includes('shaft') ? source.shaft : newClub.shaft,
            flex: copyFields.includes('flex') ? source.flex : newClub.flex,
            shaftWeight: copyFields.includes('shaftWeight') ? source.shaftWeight : newClub.shaftWeight,
            memo: copyFields.includes('memo') ? source.memo : newClub.memo,
            copiedFromClubId: source.id,
        };
        commitSetting((prev) => ({ ...prev, clubs: [...prev.clubs, copied] }));
        setExpandedClubId(copied.id);
    };

    const saveStatusMeta = (() => {
        if (isManualSaveInFlight) return { label: '保存中', tone: 'border-amber-200 bg-amber-50 text-amber-800', icon: <Loader2 size={14} className="animate-spin" /> };
        if (saveStatus === 'error') return { label: '保存に失敗しました。通信状況を確認して再度保存してください。', tone: 'border-rose-200 bg-rose-50 text-rose-800', icon: <AlertTriangle size={14} /> };
        if (hasUnsavedChanges) return { label: `未保存の変更があります${lastCloudSavedAt ? ` / 前回 ${new Date(lastCloudSavedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}` : ''}`, tone: 'border-cyan-200 bg-cyan-50 text-cyan-800', icon: <Save size={14} /> };
        if (saveStatus === 'saved') return { label: '保存済み', tone: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: <CheckCircle2 size={14} /> };
        return { label: '入力途中でも保存できます', tone: 'border-slate-200 bg-slate-50 text-slate-700', icon: <Save size={14} /> };
    })();

    const diagnosis = useMemo(() => {
        const clubsForDiagnosis = clubs.filter((club) => club.category !== TargetCategory.BALL);
        const distances = clubsForDiagnosis
            .map((club) => ({ club, distance: Number(String(club.distance || '').replace(/\D/g, '')) }))
            .filter((entry) => entry.distance > 0)
            .sort((a, b) => b.distance - a.distance);
        const distanceGaps = distances.slice(1).map((entry, index) => distances[index].distance - entry.distance);
        const largeGaps = distanceGaps.filter((gap) => gap >= 25).length;
        const wedgeLofts = clubsForDiagnosis
            .filter((club) => club.category === TargetCategory.WEDGE)
            .map((club) => Number(String(club.loft || club.number || '').replace(/[^\d.]/g, '')))
            .filter((loft) => loft > 0)
            .sort((a, b) => a - b);
        const wedgeGapProblem = wedgeLofts.slice(1).some((loft, index) => loft - wedgeLofts[index] > 6);
        const weightValues = clubsForDiagnosis
            .map((club) => Number(String(club.shaftWeight || club.shaft || '').match(/\d{2,3}/)?.[0] || 0))
            .filter(Boolean);
        const missClubs = clubsForDiagnosis.filter((club) => (club.missTendency || []).some((miss) => miss !== 'ミスは特にない'));

        return [
            { label: 'クラブ本数', value: `${clubsForDiagnosis.length}本`, helper: clubsForDiagnosis.length > ROUND_LIMIT ? '練習用・候補クラブとして保存できます。' : clubsForDiagnosis.length >= 10 ? 'バッグ全体を見やすい本数です。' : 'まずは代表番手から増やしましょう。' },
            { label: '飛距離階段', value: distances.length >= 3 ? (largeGaps > 0 ? `${largeGaps}箇所要確認` : '大きな抜けは少なめ') : '距離入力待ち', helper: 'ロフト・キャリー・総距離を入れるほど精度が上がります。' },
            { label: 'ウェッジ間隔', value: wedgeLofts.length >= 2 ? (wedgeGapProblem ? '間隔広め' : '確認しやすい') : '入力待ち', helper: '44〜64°のロフトを入れると100y以内が見えます。' },
            { label: '重量フロー', value: weightValues.length >= 4 ? '確認可能' : '入力待ち', helper: 'シャフト重量を入れるとウッドからウェッジの流れを見られます。' },
            { label: '左右ミス', value: missClubs.length > 0 ? `${missClubs.length}本に悩み` : '未登録', helper: 'チーピン、スライスなどを入れると診断に使いやすくなります。' },
            { label: 'プロ比較', value: clubsForDiagnosis.length >= 8 ? '比較しやすい' : 'もう少し登録', helper: 'プロの14本はそのまま真似ず、番手構成の考え方を見るのがおすすめです。' },
        ];
    }, [clubs]);

    const importantFieldWarning = (club: Club) => {
        if (club.category === TargetCategory.PUTTER || club.category === TargetCategory.BALL) return '';
        const missing = [
            !String(club.loft || '').trim() ? 'ロフト' : '',
            !String(club.shaftWeight || '').trim() ? 'シャフト重量' : '',
            !String(club.carryDistance || club.distance || '').trim() ? '飛距離' : '',
        ].filter(Boolean);

        if (missing.length === 0) return '';
        return `診断精度を上げるには、${missing.join('・')}を入力してください。`;
    };

    const saveEditedClub = () => {
        if (!editingClubId || !editingDraft) return;

        const nextSetting = buildSettingFromEditingDraft(latestSettingRef.current, editingClubId, editingDraft);
        if (!nextSetting) return;
        const nextClub = nextSetting.clubs.find((club) => club.id === editingClubId) || editingDraft.club;

        setClubEditorNotice(null);
        commitSetting(nextSetting);
        setEditingClubId(null);
        setEditingDraft(null);
        setExpandedClubId(null);
        const warningMessage = importantFieldWarning(nextClub);
        setClubEditorNotice({
            tone: warningMessage ? 'warning' : 'success',
            message: 'クラブ情報を一覧に反映しました。',
            detail: warningMessage || 'ほかのクラブも続けて編集できます。最後に「変更を保存」でまとめて保存してください。',
        });
    };

    const renderStepNav = () => (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
            {[
                [1, '名前・用途'],
                [2, '番手選択'],
                [3, '一括登録'],
                [4, '詳細調整'],
                [5, '確認・保存'],
            ].map(([stepNumber, label]) => (
                <button
                    key={stepNumber}
                    type="button"
                    onClick={() => navigateToStep(stepNumber as Step)}
                    disabled={isClubEditorSaving}
                    className={cn(
                        'min-h-[40px] min-w-[112px] shrink-0 rounded-xl px-3 py-2 text-left text-[11px] font-black transition ring-1 disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[44px] md:min-w-0 md:rounded-lg md:text-xs',
                        step === stepNumber ? 'bg-[#176534] text-white ring-[#176534]' : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50',
                    )}
                >
                    <span className="block text-[10px] opacity-70">STEP {stepNumber}</span>
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );

    const renderSuggestionInputs = (club: Club, applyPatch: (patch: Partial<Club>) => void) => {
        const shaftParts = parseShaftParts(club);
        const modelSuggestionId = `mybag-model-suggestions-${club.id}`;
        const shaftSuggestionId = `mybag-shaft-suggestions-${club.id}`;
        const shaftWeightSuggestionId = `mybag-shaft-weight-suggestions-${club.id}`;
        const modelSuggestions = buildModelSuggestions(club.brand, club.category, club.model);
        const flexSuggestionId = `mybag-flex-suggestions-${club.id}`;
        const shaftSuggestions = buildModelAwareShaftSuggestions(club.brand, club.model, shaftParts.model);
        const flexSuggestions = buildFlexSuggestions(shaftParts.model, club.flex || shaftParts.flex);
        const weightSuggestions = buildWeightSuggestions(club.category, club.shaftWeight || shaftParts.weight);
        return (
            <>
                <datalist id={modelSuggestionId}>{modelSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
                <datalist id={shaftSuggestionId}>{shaftSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
                <datalist id={flexSuggestionId}>{flexSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
                <datalist id={shaftWeightSuggestionId}>{weightSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-5 xl:gap-3">
                    <Field label="ブランド">
                        <input list="mybag-brand-suggestions" className={textInputClass} value={club.brand} onChange={(e) => applyPatch({ brand: e.target.value })} placeholder="PING / Titleist" />
                    </Field>
                    <Field label="モデル名">
                        <input list={modelSuggestionId} className={textInputClass} value={club.model} onChange={(e) => applyPatch({ model: e.target.value })} placeholder="G430 / Qi35" />
                    </Field>
                    <div className="col-span-2 xl:col-span-1">
                    <Field label="シャフト">
                        <input list={shaftSuggestionId} className={textInputClass} value={shaftParts.model} onChange={(e) => applyPatch({ shaft: buildShaft(e.target.value, shaftParts.weight, shaftParts.flex) })} placeholder="VENTUS / MODUS" />
                    </Field>
                    </div>
                    <Field label="フレックス">
                        <input list={flexSuggestionId} className={textInputClass} value={club.flex || shaftParts.flex} onChange={(e) => applyPatch({ flex: e.target.value, shaft: buildShaft(shaftParts.model, shaftParts.weight, e.target.value) })} placeholder="S / X / S200" />
                    </Field>
                    <Field label="シャフト重量">
                        <input list={shaftWeightSuggestionId} className={textInputClass} value={club.shaftWeight || shaftParts.weight} onChange={(e) => applyPatch({ shaftWeight: e.target.value, shaft: buildShaft(shaftParts.model, e.target.value, shaftParts.flex) })} placeholder="65g / 80g台" />
                    </Field>
                </div>
            </>
        );
    };

    const renderClubSpecificFields = (
        club: Club,
        applyPatch: (patch: Partial<Club>) => void,
        ballDraft?: Pick<ClubEditorDraft, 'ballBrand' | 'ballModel' | 'ballColor' | 'ballMemo'>,
        applyBallPatch?: (patch: Partial<Pick<ClubEditorDraft, 'ballBrand' | 'ballModel' | 'ballColor' | 'ballMemo'>>) => void,
    ) => {
        const slot = ALL_SLOTS.find((candidate) => slotKey(candidate) === slotKeyForClub(club));
        const isDriver = club.category === TargetCategory.DRIVER;
        const isLongClub = club.category === TargetCategory.FAIRWAY || club.category === TargetCategory.UTILITY;
        const isIron = club.category === TargetCategory.IRON;
        const isWedge = club.category === TargetCategory.WEDGE;
        const isPutter = club.category === TargetCategory.PUTTER;
        const inferredHeadShape = isPutter ? inferPutterHeadShape(club.model) : '';

        if (club.category === TargetCategory.BALL) {
            const ballModelSuggestionId = `mybag-ball-suggestions-${club.id}`;
            const ballModelSuggestions = buildBallModelSuggestions(ballDraft?.ballBrand || '', ballDraft?.ballModel || '');
            return (
                <>
                    <datalist id={ballModelSuggestionId}>{ballModelSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                        <Field label="ブランド"><input list="mybag-ball-brand-suggestions" className={textInputClass} value={ballDraft?.ballBrand || ''} onChange={(e) => { applyPatch({ brand: e.target.value }); applyBallPatch?.({ ballBrand: e.target.value }); }} placeholder="Titleist" /></Field>
                        <Field label="モデル名"><input list={ballModelSuggestionId} className={textInputClass} value={ballDraft?.ballModel || ''} onChange={(e) => { applyPatch({ model: e.target.value }); applyBallPatch?.({ ballModel: e.target.value }); }} placeholder="Pro V1x" /></Field>
                        <Field label="カラー"><input className={textInputClass} value={ballDraft?.ballColor || ''} onChange={(e) => applyBallPatch?.({ ballColor: e.target.value })} placeholder="ホワイト" /></Field>
                        <div className="col-span-2 md:col-span-1">
                            <Field label="メモ"><input className={textInputClass} value={ballDraft?.ballMemo || ''} onChange={(e) => { applyPatch({ memo: e.target.value }); applyBallPatch?.({ ballMemo: e.target.value }); }} placeholder="季節で変更など" /></Field>
                        </div>
                    </div>
                </>
            );
        }

        if (isPutter) {
            const putterModelSuggestionId = `mybag-model-suggestions-${club.id}`;
            return (
                <>
                    <datalist id={putterModelSuggestionId}>{buildModelSuggestions(club.brand, club.category, club.model).map((item) => <option key={item} value={item} />)}</datalist>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                        <Field label="ブランド"><input list="mybag-brand-suggestions" className={textInputClass} value={club.brand} onChange={(e) => applyPatch({ brand: e.target.value })} /></Field>
                        <Field label="モデル名"><input list={putterModelSuggestionId} className={textInputClass} value={club.model} onChange={(e) => applyPatch({ model: e.target.value })} /></Field>
                        <Field label="長さ"><input className={textInputClass} value={club.length || ''} onChange={(e) => applyPatch({ length: e.target.value })} placeholder="34インチ" /></Field>
                        <div className="col-span-2 md:col-span-1">
                            <Field label="メモ"><input className={textInputClass} value={club.memo || ''} onChange={(e) => applyPatch({ memo: e.target.value })} /></Field>
                        </div>
                        {!inferredHeadShape && (
                            <Field label="ヘッド形状">
                                <select className={textInputClass} value={club.headShape || ''} onChange={(e) => applyPatch({ headShape: e.target.value })}>
                                    <option value="">選択してください</option>
                                    {['ブレード', 'マレット', 'ネオマレット', 'L字', 'センターシャフト', 'その他', '不明'].map((shape) => <option key={shape} value={shape}>{shape}</option>)}
                                </select>
                            </Field>
                        )}
                        {inferredHeadShape && <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">推定ヘッド形状: {inferredHeadShape}</div>}
                    </div>
                </>
            );
        }

        return (
            <div className="space-y-2.5 md:space-y-4">
                {renderSuggestionInputs(club, applyPatch)}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                    <Field label="ロフト角">
                        <input className={textInputClass} value={club.loft || ''} onChange={(e) => applyPatch({ loft: normalizeLoftValue(e.target.value) })} placeholder={slot?.defaultLoft || '15°'} />
                    </Field>
                    <Field label="キャリー飛距離">
                        <input className={textInputClass} value={club.carryDistance || ''} onChange={(e) => applyPatch({ carryDistance: e.target.value })} placeholder="210" />
                    </Field>
                    <Field label="総距離">
                        <input className={textInputClass} value={club.distance || ''} onChange={(e) => applyPatch({ distance: e.target.value })} placeholder="220" />
                    </Field>
                    <div className="col-span-2 md:col-span-1">
                        <Field label="メモ">
                            <input className={textInputClass} value={club.memo || ''} onChange={(e) => applyPatch({ memo: e.target.value })} placeholder="候補クラブなど" />
                        </Field>
                    </div>
                </div>

                {(isDriver || isIron || isWedge) && (
                    <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 md:space-y-3 md:p-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">その他調整</div>
                        <div className="grid gap-2 md:grid-cols-3 md:gap-3">
                            {isDriver && (
                                <>
                                    <Field label="可変スリーブ設定"><input className={textInputClass} value={club.sleeveSetting || ''} onChange={(e) => applyPatch({ sleeveSetting: e.target.value })} placeholder="10.5°を-1°" /></Field>
                                    <Field label="長さ"><input className={textInputClass} value={club.length || ''} onChange={(e) => applyPatch({ length: e.target.value })} placeholder="45.25インチ" /></Field>
                                </>
                            )}
                            {isIron && <Field label="ライ角"><input className={textInputClass} value={club.lieAngle || ''} onChange={(e) => applyPatch({ lieAngle: e.target.value })} placeholder="標準 / 1°アップ" /></Field>}
                            {isWedge && (
                                <>
                                    <Field label="バウンス"><input className={textInputClass} value={club.bounce || ''} onChange={(e) => applyPatch({ bounce: e.target.value })} placeholder="10" /></Field>
                                    <Field label="グラインド"><input className={textInputClass} value={club.grind || ''} onChange={(e) => applyPatch({ grind: e.target.value })} placeholder="F / D / M" /></Field>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {(isLongClub || isWedge) && (
                    <div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{isWedge ? 'よく使う用途' : '主な用途'}</div>
                        <div className="flex flex-wrap gap-1 md:gap-2">
                            {(isWedge ? WEDGE_USE_OPTIONS : USE_OPTIONS).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => applyPatch({ mainUse: toggleArrayValue(club.mainUse, option) })}
                                    className={cn('rounded-full px-2 py-1 text-[10px] font-black ring-1 md:px-3 md:py-1.5 md:text-xs', club.mainUse?.includes(option) ? 'bg-[#176534] text-white ring-[#176534]' : 'bg-white text-slate-500 ring-slate-200')}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <div className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">主なミス・悩み</div>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                        {MISS_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => applyPatch({ missTendency: toggleArrayValue(club.missTendency, option) })}
                                className={cn('rounded-full px-2 py-1 text-[10px] font-black ring-1 md:px-3 md:py-1.5 md:text-xs', club.missTendency?.includes(option) ? 'bg-amber-600 text-white ring-amber-600' : 'bg-white text-slate-500 ring-slate-200')}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    {club.missTendency?.includes(OTHER_MISS_OPTION) && (
                        <div className="mt-2">
                            <Field label="その他の内容">
                                <textarea
                                    className={cn(textInputClass, 'min-h-[72px] resize-y py-2')}
                                    value={club.worry || ''}
                                    onChange={(e) => applyPatch({ worry: e.target.value })}
                                    placeholder="例: 左のミスを嫌って振れない、トップしやすい、雨の日に当たり負ける"
                                />
                            </Field>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const groupedTargets = setting.clubs.filter((club) => {
        const slot = ALL_SLOTS.find((candidate) => slotKey(candidate) === slotKeyForClub(club));
        return slot?.group === batchTarget;
    });
    const commonModelSuggestions = buildModelSuggestions(commonEdit.brand, batchTarget === 'ウェッジ' ? TargetCategory.WEDGE : batchTarget === 'アイアン' ? TargetCategory.IRON : batchTarget === 'フェアウェイウッド' ? TargetCategory.FAIRWAY : TargetCategory.UTILITY, commonEdit.model);
    const commonShaftSuggestions = buildModelAwareShaftSuggestions(commonEdit.brand, commonEdit.model, commonEdit.shaft);
    const commonFlexSuggestions = buildFlexSuggestions(commonEdit.shaft, commonEdit.flex);
    const commonWeightSuggestions = buildWeightSuggestions(batchTarget === 'ウェッジ' ? TargetCategory.WEDGE : batchTarget === 'アイアン' ? TargetCategory.IRON : batchTarget === 'フェアウェイウッド' ? TargetCategory.FAIRWAY : TargetCategory.UTILITY, commonEdit.shaftWeight);

    if (!showFlowEditor && clubs.length > 0) {
        return (
            <div className={cn('animate-fadeIn space-y-2.5 pb-24 md:space-y-4 md:pb-0', useDesktopTable && 'xl:space-y-0')}>
                {clubEditorNotice && (
                    <div
                        className={cn(
                            'rounded-lg px-3 py-2.5 text-sm font-bold ring-1 md:px-4 md:py-3',
                            clubEditorNotice.tone === 'success' && 'bg-emerald-50 text-emerald-800 ring-emerald-200',
                            clubEditorNotice.tone === 'warning' && 'bg-amber-50 text-amber-800 ring-amber-200',
                            clubEditorNotice.tone === 'error' && 'bg-rose-50 text-rose-800 ring-rose-200',
                        )}
                    >
                        <div>{clubEditorNotice.message}</div>
                        {clubEditorNotice.detail && <div className="mt-1 text-xs font-semibold">{clubEditorNotice.detail}</div>}
                    </div>
                )}

                <section className={cn('px-0 py-0 md:rounded-lg md:bg-white md:p-5 md:shadow-sm md:ring-1 md:ring-slate-200', useDesktopTable && 'md:p-4 xl:p-0 xl:shadow-none')}>
                    <div className={cn('mb-2 flex items-center justify-between gap-2 md:mb-4', useDesktopTable && 'xl:mb-5')}>
                        <div className={cn('min-w-0', useDesktopTable && 'xl:hidden')}>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#176534]">MY CLUBS</div>
                            <h2 className="mt-0.5 text-lg font-black tracking-tight text-trust-navy md:mt-1 md:text-2xl">マイクラブ</h2>
                            <div className="mt-1 flex items-center gap-3 text-[11px] font-bold text-slate-500 md:text-sm">
                                <span>{selectedClubCount}本登録</span>
                                <span>クラブ {nonBallClubs.length}本</span>
                                <span className="truncate">{purpose}</span>
                            </div>
                        </div>
                        <div className={cn('flex shrink-0 items-center gap-1.5 md:gap-2', useDesktopTable && 'xl:w-full xl:justify-center')}>
                            <div className="inline-flex rounded-lg bg-slate-50 p-0.5 text-[10px] font-black ring-1 ring-slate-200 md:text-xs">
                                <button
                                    type="button"
                                    onClick={() => setClubListDistanceView('total')}
                                    className={cn('rounded-md px-2 py-1 transition', clubListDistanceView === 'total' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400')}
                                >
                                    総距離
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClubListDistanceView('carry')}
                                    className={cn('rounded-md px-2 py-1 transition', clubListDistanceView === 'carry' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400')}
                                >
                                    キャリー
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => enterFlowEditor(2)}
                                className={cn('inline-flex min-h-[34px] items-center rounded-lg bg-[#176534] px-3 text-[11px] font-black text-white md:min-h-[40px] md:px-4 md:text-xs', useDesktopTable && 'xl:hidden')}
                            >
                                追加
                            </button>
                            <button
                                type="button"
                                onClick={() => enterFlowEditor(4)}
                                className={cn('inline-flex min-h-[34px] items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-black text-trust-navy md:min-h-[40px] md:px-4 md:text-xs', useDesktopTable && 'xl:hidden')}
                            >
                                編集
                            </button>
                        </div>
                    </div>

                    {useDesktopTable && (
                        <div className="hidden border-b border-slate-200 px-4 py-3 text-xs font-black text-slate-500 xl:grid xl:grid-cols-[260px_minmax(0,1fr)_120px_40px] xl:items-center xl:gap-4">
                            <div>クラブ</div>
                            <div>シャフト / 重量 / フレックス / ロフト</div>
                            <div className="text-right">{clubListDistanceView === 'carry' ? 'キャリー' : '総距離'}</div>
                            <div />
                        </div>
                    )}

                    <div className={cn('space-y-0 md:space-y-2', useDesktopTable && 'xl:space-y-0')}>
                        {clubs.map((club) => {
                            const title = [club.brand, club.model].filter(Boolean).join(' ') || '未入力';
                            const clubBrand = String(club.brand || '').trim() || '-';
                            const clubModel = String(club.model || '').trim() || '未入力';
                            const distanceDisplay = distanceBadgeText(club, clubListDistanceView);
                            const shaftModel = displayShaftModelText(club);
                            const shaftSpec = displayShaftSpecText(club);
                            const meta = [
                                displayShaftText(club),
                                club.loft || '',
                            ].filter(Boolean).join(' / ');

                            return (
                                <article key={club.id} className={cn('grid min-h-[58px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-200 py-2 last:border-b-0 md:min-h-[66px] md:rounded-lg md:border md:bg-white md:px-3 md:py-2 md:shadow-sm', useDesktopTable && 'xl:min-h-[62px] xl:grid-cols-[260px_minmax(0,1fr)_120px_40px] xl:gap-4 xl:rounded-none xl:border-x-0 xl:border-t-0 xl:bg-transparent xl:px-4 xl:shadow-none xl:last:border-b-0', pendingBagChangeIds.includes(club.id) ? 'border-cyan-300' : 'border-slate-200')}>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 text-sm font-black text-trust-navy md:text-base">
                                            <span className="inline-flex min-w-[42px] shrink-0 items-center justify-center rounded-lg bg-[#176534] px-2 py-2 text-sm font-black leading-none text-white shadow-sm md:min-w-[48px] md:text-base">{club.number || club.category}</span>
                                            <span className="truncate xl:hidden">{title}</span>
                                            {useDesktopTable && (
                                                <span className="hidden min-w-0 xl:block">
                                                    <span className="block truncate text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{clubBrand}</span>
                                                    <span className="mt-0.5 block truncate text-base font-black text-trust-navy">{clubModel}</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className={cn('mt-0.5 truncate text-[11px] font-bold text-slate-500 md:text-xs', useDesktopTable && 'xl:hidden')}>{meta || '-'}</div>
                                    </div>
                                    {useDesktopTable && (
                                        <div className="hidden min-w-0 xl:block">
                                            <div className="truncate text-base font-black text-slate-600">{shaftModel || '-'}</div>
                                            <div className="mt-0.5 truncate text-sm font-bold text-slate-500">{shaftSpec || '-'}</div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 xl:contents">
                                        <div className={cn('min-w-[62px] text-right text-2xl font-black leading-none text-[#176534] md:min-w-[78px] md:text-3xl', useDesktopTable && 'xl:min-w-0 xl:text-right xl:text-2xl')}>{distanceDisplay}</div>
                                        <button type="button" aria-label={`${club.number || club.category}を編集`} disabled={isClubEditorSaving} onClick={() => openClubEditor(club.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-trust-navy disabled:cursor-not-allowed disabled:opacity-60 md:h-9 md:w-9">
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <div className={cn('sticky bottom-[68px] z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:static md:mx-0 md:rounded-lg md:border md:bg-white md:p-4 md:shadow-sm md:ring-1 md:ring-slate-200 md:backdrop-blur-0', useDesktopTable && 'xl:hidden')}>
                    <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                        <div className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ring-1', saveStatusMeta.tone)}>
                            {saveStatusMeta.icon}
                            {saveStatusMeta.label}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            {(hasUnsavedChanges || saveStatus === 'error') && (
                                <button type="button" disabled={isClubEditorSaving} onClick={handleReloadFromCloud} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-60">
                                    <Loader2 size={14} /> クラウドから再読み込み
                                </button>
                            )}
                            <button type="button" disabled={isClubEditorSaving} onClick={handleSaveCurrentSetting} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-trust-navy px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                                <Save size={14} /> 変更を保存
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-2.5 pb-24 md:space-y-4 md:pb-0">
            <datalist id="mybag-brand-suggestions">{BRAND_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-model-suggestions">{MODEL_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-shaft-suggestions">{SHAFT_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-flex-suggestions">{FLEX_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-ball-suggestions">{BALL_MODEL_SUGGESTIONS.map((ballName) => <option key={ballName} value={ballName} />)}</datalist>
            <datalist id="mybag-ball-brand-suggestions">{BALL_BRAND_SUGGESTIONS.map((brandName) => <option key={brandName} value={brandName} />)}</datalist>
            <datalist id="mybag-common-model-suggestions">{commonModelSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-common-shaft-suggestions">{commonShaftSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-common-flex-suggestions">{commonFlexSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-common-shaft-weight-suggestions">{commonWeightSuggestions.map((item) => <option key={item} value={item} />)}</datalist>

            {intakeMode !== 'default' && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm font-bold text-cyan-800 md:rounded-lg md:p-4">
                    {intakeMode === 'missing-clubs' ? '診断精度を上げるため、まずバッグに入っている番手を選んでください。' : '使用ボールも登録すると、ボール診断とクラブ診断をつなげやすくなります。'}
                </div>
            )}

            <div className={cn('px-0 py-0 md:rounded-lg md:bg-white md:p-5 md:shadow-sm md:ring-1 md:ring-slate-200', useDesktopTable && step === 4 && 'xl:hidden')}>
                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="hidden md:block">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#176534]">MY CLUB SETTING FLOW</div>
                        <h2 className="mt-1.5 text-xl font-black tracking-tight text-trust-navy md:mt-2 md:text-2xl">クラブセッティング登録</h2>
                        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 md:mt-2">
                            まず番手を選び、同じシリーズをまとめて入力し、最後に番手別の距離や悩みを調整します。未入力があっても保存できます。
                        </p>
                        {clubs.length > 0 && (
                            <button
                                type="button"
                                onClick={closeFlowEditor}
                                className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-trust-navy"
                            >
                                一覧へ戻る
                            </button>
                        )}
                    </div>
                    <div className="md:hidden">
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#176534]">MY CLUB</div>
                                <h2 className="mt-0.5 text-lg font-black tracking-tight text-trust-navy">マイクラブ</h2>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                {clubs.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={closeFlowEditor}
                                        className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-black text-trust-navy"
                                    >
                                        一覧
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => navigateToStep(2)}
                                    className="inline-flex min-h-[36px] items-center rounded-lg bg-[#176534] px-3 text-[11px] font-black text-white"
                                >
                                    追加
                                </button>
                            </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[11px] font-bold text-slate-500">
                            <span>登録済み {selectedClubCount}本</span>
                            <span>クラブ {nonBallClubs.length}本</span>
                            <span className="truncate">{purpose}</span>
                        </div>
                    </div>
                    <div className="hidden grid-cols-3 gap-1.5 text-center md:grid md:gap-2">
                        <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200 md:rounded-lg md:px-3">
                            <div className="text-[10px] font-black text-slate-400">登録</div>
                            <div className="text-xl font-black text-trust-navy">{selectedClubCount}</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200 md:rounded-lg md:px-3">
                            <div className="text-[10px] font-black text-slate-400">クラブ</div>
                            <div className="text-xl font-black text-trust-navy">{nonBallClubs.length}</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200 md:rounded-lg md:px-3">
                            <div className="text-[10px] font-black text-slate-400">用途</div>
                            <div className="text-sm font-black text-trust-navy">{purpose}</div>
                        </div>
                    </div>
                </div>
                <div className="mt-3 md:mt-4">{renderStepNav()}</div>
            </div>

            {warningOverLimit && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-relaxed text-amber-800 md:rounded-lg md:p-4">
                    現在 {nonBallClubs.length}本選択中です。公式ラウンドでは14本までです。練習用・候補クラブとして登録する場合は、このまま保存できます。
                </div>
            )}

            {step === 1 && (
                <section className="space-y-4 px-0 py-0 md:rounded-lg md:bg-white md:p-5 md:shadow-sm md:ring-1 md:ring-slate-200">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="セッティング名">
                            <input
                                className={textInputClass}
                                value={setting.name || ''}
                                onChange={(e) => commitSetting((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder={DEFAULT_SETTING_NAME}
                            />
                        </Field>
                        <Field label="用途">
                            <select className={textInputClass} value={purpose} onChange={(e) => commitSetting((prev) => ({ ...prev, purpose: e.target.value }))}>
                                {PURPOSES.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </Field>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button type="button" onClick={() => navigateToStep(2)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white">
                            番手を選ぶ <ArrowRight size={16} />
                        </button>
                    </div>
                </section>
            )}

            {step === 2 && (
                <section className="space-y-3 px-0 py-0 md:space-y-4 md:rounded-lg md:bg-white md:p-5 md:shadow-sm md:ring-1 md:ring-slate-200">
                    <div className="mb-2 flex flex-col gap-1.5 md:mb-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-black text-trust-navy">持っているクラブの番手を選択</h3>
                            <p className="mt-1 hidden text-sm text-slate-600 md:block">詳細入力はあとで大丈夫です。まずバッグに入っている番手だけ選んでください。</p>
                        </div>
                        <ShareImageExporter targetId="my-bag-export-area" fileName="my-bag-pro-setting.png" buttonText="画像で保存" className="text-xs" />
                    </div>
                    <div className="space-y-4 md:space-y-5">
                        {SLOT_GROUPS.map((group) => (
                            <div key={group.title}>
                                <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{group.title}</div>
                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                    {group.slots.map((slot) => {
                                        const isSelected = selectedKeys.has(slotKey(slot)) || (slot.category === TargetCategory.BALL && Boolean(ballClub));
                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => toggleSlot(slot)}
                                                className={cn(
                                                    'min-h-[40px] rounded-lg px-3 text-xs font-black ring-1 transition',
                                                    isSelected ? 'bg-[#176534] text-white ring-[#176534]' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
                                                )}
                                            >
                                                {slot.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 flex justify-end">
                        <button type="button" onClick={() => navigateToStep(3)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white">
                            一括登録へ <ArrowRight size={16} />
                        </button>
                    </div>
                </section>
            )}

            {step === 3 && (
                <section className="space-y-3 md:space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-3 md:rounded-lg md:p-5 md:shadow-sm md:ring-1 md:ring-slate-200">
                        <h3 className="text-lg font-black text-trust-navy">カテゴリーごとに一括登録</h3>
                        <p className="mt-1 hidden text-sm text-slate-600 md:block">同じシリーズ・同じシャフトの番手に、共通項目をまとめて入れます。</p>
                        <div className="mt-3 grid gap-2 lg:mt-4 lg:grid-cols-[220px_1fr] lg:gap-3">
                            <Field label="対象カテゴリー">
                                <select className={textInputClass} value={batchTarget} onChange={(e) => setBatchTarget(e.target.value)}>
                                    {BATCH_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                                </select>
                            </Field>
                            <div className="rounded-xl bg-slate-50 p-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 md:rounded-lg md:p-3">
                                対象: {groupedTargets.length > 0 ? groupedTargets.map((club) => club.number).join(' / ') : 'このカテゴリーの番手が未選択です'}
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 md:mt-4 md:grid-cols-5 md:gap-3">
                            <Field label="ブランド"><input list="mybag-brand-suggestions" className={textInputClass} value={commonEdit.brand} onChange={(e) => setCommonEdit((prev) => ({ ...prev, brand: e.target.value }))} /></Field>
                            <Field label="モデル名"><input list="mybag-common-model-suggestions" className={textInputClass} value={commonEdit.model} onChange={(e) => setCommonEdit((prev) => ({ ...prev, model: e.target.value }))} /></Field>
                            <Field label="シャフト"><input list="mybag-common-shaft-suggestions" className={textInputClass} value={commonEdit.shaft} onChange={(e) => setCommonEdit((prev) => ({ ...prev, shaft: e.target.value }))} /></Field>
                            <Field label="フレックス"><input list="mybag-common-flex-suggestions" className={textInputClass} value={commonEdit.flex} onChange={(e) => setCommonEdit((prev) => ({ ...prev, flex: e.target.value }))} /></Field>
                            <Field label="シャフト重量"><input list="mybag-common-shaft-weight-suggestions" className={textInputClass} value={commonEdit.shaftWeight} onChange={(e) => setCommonEdit((prev) => ({ ...prev, shaftWeight: e.target.value }))} placeholder="85g" /></Field>
                        </div>
                        <button type="button" onClick={applyCommonToGroup} disabled={groupedTargets.length === 0} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-trust-navy px-5 text-sm font-black text-white disabled:opacity-50">
                            <Layers3 size={16} /> このカテゴリーに反映
                        </button>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3 md:rounded-lg md:p-5 md:shadow-sm md:ring-1 md:ring-slate-200">
                        <h3 className="text-lg font-black text-trust-navy">複製・一括編集</h3>
                        <div className="mt-3 grid gap-3 xl:mt-4 xl:grid-cols-2 xl:gap-4">
                            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 md:rounded-lg">
                                <div className="text-sm font-black text-trust-navy">複製</div>
                                <div className="mt-3 grid gap-2 md:grid-cols-2 md:gap-3">
                                    <Field label="コピー元">
                                        <select className={textInputClass} value={copySourceId} onChange={(e) => setCopySourceId(e.target.value)}>
                                            <option value="">選択</option>
                                            {clubs.filter((club) => club.category !== TargetCategory.BALL).map((club) => <option key={club.id} value={club.id}>{club.number} {club.brand} {club.model}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="コピー先">
                                        <select className={textInputClass} value={copyTargetSlotId} onChange={(e) => setCopyTargetSlotId(e.target.value)}>
                                            <option value="">選択</option>
                                            {ALL_SLOTS.filter((slot) => slot.category !== TargetCategory.BALL).map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
                                        </select>
                                    </Field>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5 md:gap-2">
                                    {[
                                        ['brand', 'ブランド'],
                                        ['model', 'モデル名'],
                                        ['shaft', 'シャフト'],
                                        ['flex', 'フレックス'],
                                        ['shaftWeight', '重量'],
                                        ['memo', 'メモ'],
                                    ].map(([key, label]) => (
                                        <button key={key} type="button" onClick={() => setCopyFields((prev) => toggleArrayValue(prev, key))} className={cn('rounded-full px-3 py-1.5 text-xs font-black ring-1', copyFields.includes(key) ? 'bg-[#176534] text-white ring-[#176534]' : 'bg-white text-slate-500 ring-slate-200')}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <button type="button" onClick={duplicateClub} disabled={!copySourceId || !copyTargetSlotId} className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-white px-4 text-xs font-black text-trust-navy ring-1 ring-slate-200 disabled:opacity-50">
                                    <Copy size={14} /> 複製する
                                </button>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 md:rounded-lg">
                                <div className="text-sm font-black text-trust-navy">一括編集</div>
                                <div className="mt-3 flex max-h-28 flex-wrap gap-1.5 overflow-auto md:gap-2">
                                    {clubs.filter((club) => club.category !== TargetCategory.BALL).map((club) => (
                                        <button key={club.id} type="button" onClick={() => setBatchEditIds((prev) => toggleArrayValue(prev, club.id))} className={cn('rounded-full px-3 py-1.5 text-xs font-black ring-1', batchEditIds.includes(club.id) ? 'bg-[#176534] text-white ring-[#176534]' : 'bg-white text-slate-500 ring-slate-200')}>
                                            {club.number}
                                        </button>
                                    ))}
                                </div>
                                <button type="button" onClick={applyBatchEdit} disabled={batchEditIds.length === 0} className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-white px-4 text-xs font-black text-trust-navy ring-1 ring-slate-200 disabled:opacity-50">
                                    <Layers3 size={14} /> 選択クラブへ共通項目を反映
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button type="button" onClick={() => navigateToStep(4)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white">
                                詳細調整へ <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {step === 4 && (
                <section className={cn('px-0 py-0 md:rounded-lg md:bg-white md:p-5 md:shadow-sm md:ring-1 md:ring-slate-200', useDesktopTable && 'md:p-4 xl:p-0 xl:shadow-none')}>
                    <div className={cn('mb-2 flex flex-col gap-1.5 md:mb-4 md:flex-row md:items-center md:justify-between', useDesktopTable && 'xl:mb-5')}>
                        <div className={cn(useDesktopTable && 'xl:hidden')}>
                            <h3 className="text-lg font-black text-trust-navy">番手ごとの詳細を調整</h3>
                            <p className="mt-1 hidden text-sm text-slate-600 md:block">作成済みクラブはあとから1本ずつ編集できます。ロフトが分からなくても保存できます。</p>
                        </div>
                        <div className={cn('flex flex-wrap items-center gap-2', useDesktopTable && 'xl:w-full xl:justify-center')}>
                            <div className="inline-flex rounded-lg bg-slate-50 p-0.5 text-[10px] font-black ring-1 ring-slate-200 md:text-xs">
                                <button
                                    type="button"
                                    onClick={() => setClubListDistanceView('total')}
                                    className={cn('rounded-md px-2 py-1 transition', clubListDistanceView === 'total' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400')}
                                >
                                    総距離
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClubListDistanceView('carry')}
                                    className={cn('rounded-md px-2 py-1 transition', clubListDistanceView === 'carry' ? 'bg-white text-trust-navy shadow-sm' : 'text-slate-400')}
                                >
                                    キャリー
                                </button>
                            </div>
                            <div className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ring-1', saveStatusMeta.tone)}>
                                {saveStatusMeta.icon}
                                {saveStatusMeta.label}
                            </div>
                        </div>
                    </div>
                    {clubEditorNotice && (
                        <div
                            className={cn(
                                'mb-3 rounded-lg px-3 py-2.5 text-sm font-bold ring-1 md:mb-4 md:px-4 md:py-3',
                                clubEditorNotice.tone === 'success' && 'bg-emerald-50 text-emerald-800 ring-emerald-200',
                                clubEditorNotice.tone === 'warning' && 'bg-amber-50 text-amber-800 ring-amber-200',
                                clubEditorNotice.tone === 'error' && 'bg-rose-50 text-rose-800 ring-rose-200',
                            )}
                        >
                            <div>{clubEditorNotice.message}</div>
                            {clubEditorNotice.detail && <div className="mt-1 text-xs font-semibold">{clubEditorNotice.detail}</div>}
                        </div>
                    )}
                    {useDesktopTable && (
                        <div className="hidden border-b border-slate-200 px-4 py-3 text-xs font-black text-slate-500 xl:grid xl:grid-cols-[260px_minmax(0,1fr)_120px_110px] xl:items-center xl:gap-4">
                            <div>クラブ</div>
                            <div>シャフト / 重量 / フレックス / ロフト</div>
                            <div className="text-right">{clubListDistanceView === 'carry' ? 'キャリー' : '総距離'}</div>
                            <div className="text-right">操作</div>
                        </div>
                    )}
                    <div id="my-bag-export-area" className={cn('space-y-0 md:space-y-3', useDesktopTable && 'xl:space-y-0')}>
                        {clubs.map((club) => {
                            const isExpanded = expandedClubId === club.id && editingClubId === club.id && Boolean(editingDraft);
                            const isBall = club.category === TargetCategory.BALL;
                            const editorDraft = isExpanded ? editingDraft : null;
                            const isEditingThisClub = editingClubId === club.id;
                            const isDirtyThisClub = isEditingThisClub && hasDirtyEditingDraft;
                            const draftClub = editorDraft?.club || club;
                            const displayClub = isBall
                                ? {
                                    ...draftClub,
                                    brand: editorDraft?.ballBrand || setting.ballBrand || draftClub.brand,
                                    model: editorDraft?.ballModel || setting.ball || draftClub.model,
                                    memo: editorDraft?.ballMemo || setting.ballMemo || draftClub.memo,
                                }
                                : draftClub;
                            const title = [displayClub.brand, displayClub.model].filter(Boolean).join(' ') || '未入力';
                            const clubBrand = String(displayClub.brand || '').trim() || '-';
                            const clubModel = String(displayClub.model || '').trim() || '未入力';
                            const distanceDisplay = distanceBadgeText(displayClub, clubListDistanceView);
                            const shaftDisplay = displayShaftText(displayClub);
                            const shaftModel = displayShaftModelText(displayClub);
                            const shaftSpec = displayShaftSpecText(displayClub);
                            const detailMeta = [
                                displayClub.loft || '',
                                displayClub.carryDistance ? `${displayClub.carryDistance}y carry` : '',
                                displayClub.distance ? `${displayClub.distance}y total` : '',
                            ].filter(Boolean).join(' / ');
                            return (
                                <article key={club.id} className={cn('border-b border-slate-200 py-1 last:border-b-0 md:rounded-lg md:border md:bg-white md:px-0 md:py-0 md:shadow-sm', useDesktopTable && 'xl:rounded-none xl:border-x-0 xl:border-t-0 xl:bg-transparent xl:shadow-none xl:last:border-b-0', pendingBagChangeIds.includes(club.id) ? 'border-cyan-300' : 'border-slate-200')}>
                                    <div className={cn('grid min-h-[48px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 px-0 py-1 md:min-h-[72px] md:flex md:items-center md:justify-between md:px-3 md:py-3', useDesktopTable && 'xl:min-h-[62px] xl:grid xl:grid-cols-[260px_minmax(0,1fr)_120px_110px] xl:gap-4 xl:px-4 xl:py-2.5')}>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-sm font-black text-trust-navy">
                                                <span className="inline-flex min-w-[38px] shrink-0 items-center justify-center rounded-md bg-trust-navy px-2 py-1 text-[11px] font-black leading-none text-white md:min-w-[44px] md:text-xs">{club.number || club.category}</span>
                                                <span className="truncate md:hidden">{title}</span>
                                                {useDesktopTable && (
                                                    <span className="hidden min-w-0 xl:block">
                                                        <span className="block truncate text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{clubBrand}</span>
                                                        <span className="mt-0.5 block truncate text-base font-black text-trust-navy">{clubModel}</span>
                                                    </span>
                                                )}
                                                {isEditingThisClub && (
                                                    <span className={cn(
                                                        'inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-black',
                                                        isDirtyThisClub ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600',
                                                    )}>
                                                        {isDirtyThisClub ? '編集中' : '展開中'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={cn('mt-0.5 hidden truncate text-sm font-bold text-slate-700 md:block xl:mt-0', useDesktopTable && 'xl:hidden')}>{title}</div>
                                            <div className={cn('mt-0.5 hidden grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-[11px] font-bold text-slate-500 md:grid md:block md:truncate md:text-xs', useDesktopTable && 'xl:hidden')}>
                                                <span className="truncate">{shaftDisplay || '-'}</span>
                                            </div>
                                            <div className="mt-0.5 truncate pr-2 text-[11px] font-bold text-slate-500 md:hidden">
                                                {[
                                                    shaftDisplay || '-',
                                                    displayClub.loft || '',
                                                ].filter(Boolean).join(' / ')}
                                            </div>
                                            <div className={cn('mt-0.5 hidden truncate pr-2 text-[11px] font-bold text-slate-500 md:mt-1 md:block md:pr-0 md:text-xs', useDesktopTable && 'xl:hidden')}>
                                                {[displayClub.loft, displayClub.mainUse || ''].filter(Boolean).join(' / ') || '-'}
                                            </div>
                                            <div className={cn('mt-1 hidden truncate text-xs font-bold text-slate-500 md:block', useDesktopTable && 'xl:hidden')}>
                                                {detailMeta || '-'}
                                            </div>
                                        </div>
                                        {useDesktopTable && (
                                            <div className="hidden min-w-0 xl:block">
                                                <div className="truncate text-base font-black text-slate-600">{shaftModel || '-'}</div>
                                                <div className="mt-0.5 truncate text-sm font-bold text-slate-500">{shaftSpec || '-'}</div>
                                            </div>
                                        )}
                                        <div className={cn('row-span-2 flex flex-wrap items-center justify-end gap-1 self-center md:row-auto md:flex-row md:flex-wrap md:items-center md:gap-2', useDesktopTable && 'xl:contents')}>
                                            <div className={cn('mr-0.5 min-w-[62px] text-right text-2xl font-black leading-none text-[#176534] md:min-w-[78px] md:text-3xl', useDesktopTable && 'xl:mr-0 xl:min-w-0 xl:text-2xl')}>{distanceDisplay}</div>
                                            <div className="flex flex-wrap justify-end gap-1 md:gap-2">
                                            <button type="button" disabled={isClubEditorSaving} onClick={() => openClubEditor(club.id)} className="inline-flex min-h-[30px] items-center rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-black text-trust-navy disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[36px] md:rounded-lg md:px-3 md:text-xs">
                                                {isExpanded ? '閉じる' : '編集'}
                                            </button>
                                            {!isBall && (
                                                <button type="button" disabled={isClubEditorSaving} onClick={() => duplicateClubFromCard(club)} className="inline-flex min-h-[30px] items-center rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-black text-trust-navy disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[36px] md:rounded-lg md:px-3 md:text-xs">
                                                    複製
                                                </button>
                                            )}
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded && editorDraft && (
                                        <div className="border-t border-slate-100 pt-2.5 md:p-3">
                                            {renderClubSpecificFields(editorDraft.club, updateEditingDraftClub, {
                                                ballBrand: editorDraft.ballBrand,
                                                ballModel: editorDraft.ballModel,
                                                ballColor: editorDraft.ballColor,
                                                ballMemo: editorDraft.ballMemo,
                                            }, updateEditingDraftBall)}
                                            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-200 md:mt-4 md:rounded-lg">
                                                未入力があっても保存できます。あとから追記しても大丈夫です。
                                            </div>
                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 md:mt-4">
                                                <button
                                                    type="button"
                                                    disabled={isClubEditorSaving}
                                                    onClick={() => {
                                                        handleRemoveClub(club);
                                                    }}
                                                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 md:rounded-lg"
                                                >
                                                    削除
                                                </button>
                                                <div className="flex flex-wrap justify-end gap-2">
                                                <button type="button" disabled={isClubEditorSaving} onClick={cancelClubEditor} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 md:rounded-lg">
                                                    キャンセル
                                                </button>
                                                <button type="button" onClick={saveEditedClub} disabled={isClubEditorSaving} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-trust-navy px-4 text-xs font-black text-white disabled:opacity-50 md:rounded-lg">
                                                    <Save size={14} />
                                                    反映して閉じる
                                                </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                        {clubs.length === 0 && (
                            <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400 md:rounded-lg md:p-8">
                                STEP 2で番手を選ぶと、ここに詳細フォームが表示されます。
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex justify-end md:mt-5">
                        <button type="button" disabled={isClubEditorSaving} onClick={() => navigateToStep(5)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                            確認へ <ArrowRight size={16} />
                        </button>
                    </div>
                </section>
            )}

            {step === 5 && (
                <section className="space-y-4">
                    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
                        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#176534]">CONFIRM</div>
                                <h3 className="mt-1 text-xl font-black text-trust-navy">{settingName}</h3>
                                <p className="mt-1 text-sm font-bold text-slate-500">用途: {purpose}</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button type="button" disabled={isClubEditorSaving} onClick={handleSaveCurrentSetting} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-trust-navy px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                                    {isManualSaveInFlight ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    保存する
                                </button>
                                <button type="button" disabled={isClubEditorSaving} onClick={handleOpenBallDiagnosis} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                                    診断へ <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                            {clubs.map((club) => (
                                <div key={club.id} className="grid gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 md:grid-cols-[80px_1fr_180px] md:gap-2 md:rounded-lg">
                                    <div className="font-black text-trust-navy">{club.number || club.category}</div>
                                    <div className="min-w-0">
                                        <div className="truncate font-black text-slate-800">{[club.brand, club.model].filter(Boolean).join(' ') || '未入力'}</div>
                                        <div className="truncate text-xs font-bold text-slate-500">{club.shaft || '-'}</div>
                                    </div>
                                    <div className="text-xs font-black text-slate-600">{[club.loft, club.carryDistance ? `${club.carryDistance}y carry` : '', club.distance ? `${club.distance}y total` : ''].filter(Boolean).join(' / ') || '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-[#176534]" />
                            <h3 className="text-lg font-black text-trust-navy">簡易診断</h3>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {diagnosis.map((item) => (
                                <div key={item.label} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                                    <div className="mt-1 text-lg font-black text-trust-navy">{item.value}</div>
                                    <div className="mt-1 text-xs leading-relaxed text-slate-500">{item.helper}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-bold leading-relaxed text-amber-800 ring-1 ring-amber-200">
                            診断精度を上げるには、ロフト・シャフト重量・キャリー飛距離・総距離を入力してください。
                        </div>
                    </div>
                </section>
            )}

            <div className="sticky bottom-[68px] z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:static md:mx-0 md:rounded-lg md:border md:bg-white md:p-4 md:shadow-sm md:ring-1 md:ring-slate-200 md:backdrop-blur-0">
                <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                    <div className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ring-1', saveStatusMeta.tone)}>
                        {saveStatusMeta.icon}
                        {saveStatusMeta.label}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        {(hasUnsavedChanges || saveStatus === 'error') && (
                            <button type="button" disabled={isClubEditorSaving} onClick={handleReloadFromCloud} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-60">
                                <Loader2 size={14} /> クラウドから再読み込み
                            </button>
                        )}
                        {lastSaveTargetClubCount > 0 && lastSavedClubCount > 0 && lastSaveTargetClubCount !== lastSavedClubCount && (
                            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                                保存対象 {lastSaveTargetClubCount}本 / クラウド確認 {lastSavedClubCount}本
                            </div>
                        )}
                        <button type="button" disabled={isClubEditorSaving} onClick={handleSaveCurrentSetting} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-trust-navy px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
                            <Save size={14} /> 変更を保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
