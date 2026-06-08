import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    Copy,
    Layers3,
    Loader2,
    Save,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { type Club, type ClubSetting, TargetCategory } from '../../types/golf';
import { cn } from '../../lib/utils';
import { ShareImageExporter } from '../../components/ShareImageExporter';
import { BALL_MASTER_DATA } from '../../data/ballMasterData';

const ROUND_LIMIT = 14;
const DEFAULT_SETTING_NAME = '現在のクラブセッティング';

const PURPOSES = ['メイン', 'サブ', '競技用', '練習用', '冬用', '試打・検討中', '過去のセッティング'];
const BRAND_SUGGESTIONS = ['PING', 'TaylorMade', 'Callaway', 'Titleist', 'Srixon', 'Dunlop', 'Mizuno', 'Yamaha', 'Bridgestone', 'PRGR', 'Cobra', 'PXG', 'ONOFF', 'Fourteen', 'Honma', 'XXIO', 'Cleveland', 'Epon', 'Miura', 'RomaRo', 'Bettinardi', 'Odyssey', 'Scotty Cameron', 'その他'];
const MODEL_SUGGESTIONS = ['G430', 'G425', 'G440', 'Qi10', 'Qi35', 'Qi4D', 'STEALTH', 'PARADYM', 'ELYTE', 'ZX5', 'ZX7', 'T-Series', 'Vokey SM10', 'Vokey SM11', 'RTX', 'JAWS', 'Spider', 'Phantom', 'Ai-ONE'];
const SHAFT_SUGGESTIONS = ['VENTUS', 'TENSEI', 'Tour AD', 'Speeder NX', 'Diamana', 'The ATTAS', 'LIN-Q', 'VANQUISH', 'Dynamic Gold', 'MODUS', 'NS PRO', 'KBS', 'Project X', 'MCI', 'PING TOUR', '純正シャフト', 'その他'];
const FLEX_SUGGESTIONS = ['L', 'A', 'R', 'SR', 'S', 'SX', 'X', 'TX', '5S', '5X', '6S', '6X', '7S', '7X', '8S', '8X', 'S200', 'S300', 'X100', 'R300', 'その他', '不明'];
const MISS_OPTIONS = ['左に行く', '右に行く', 'チーピン', 'スライス', '球が上がらない', '吹け上がる', '距離が合わない', 'ミスは特にない', 'その他'];
const USE_OPTIONS = ['ティーショット', 'セカンド', '狭いホール用', '風の日用', '距離の階段用', 'ロングアイアンの代わり', 'UTの代わり'];
const WEDGE_USE_OPTIONS = ['フルショット', '100y以内', 'アプローチ', 'バンカー', 'ラフ', 'ベアグラウンド', 'ロブショット', '転がし'];

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
    onManualSave?: (settingOverride?: ClubSetting) => void;
    onReloadFromCloud?: () => void;
    onOpenBallDiagnosis?: () => void;
    intakeMode?: 'default' | 'missing-clubs' | 'ball-first';
}

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

const Field = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <label className="block">
        <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
        {children}
    </label>
);

const textInputClass = 'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-trust-navy outline-none transition focus:border-[#176534] focus:ring-2 focus:ring-[#176534]/10';

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
}) => {
    const latestSettingRef = useRef(setting);
    const [step, setStep] = useState<Step>(1);
    const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
    const [batchTarget, setBatchTarget] = useState(BATCH_GROUPS[0]);
    const [batchEditIds, setBatchEditIds] = useState<string[]>([]);
    const [copySourceId, setCopySourceId] = useState('');
    const [copyTargetSlotId, setCopyTargetSlotId] = useState('');
    const [copyFields, setCopyFields] = useState(['brand', 'model', 'shaft', 'flex', 'shaftWeight', 'memo']);
    const [commonEdit, setCommonEdit] = useState<CommonEditState>({
        brand: '',
        model: '',
        shaft: '',
        flex: '',
        shaftWeight: '',
    });

    useEffect(() => {
        latestSettingRef.current = setting;
    }, [setting]);

    const clubs = useMemo(() => [...setting.clubs].sort((a, b) => sortClub(a) - sortClub(b)), [setting.clubs]);
    const selectedKeys = useMemo(() => new Set(setting.clubs.map(slotKeyForClub)), [setting.clubs]);
    const settingName = setting.name?.trim() || DEFAULT_SETTING_NAME;
    const purpose = setting.purpose || 'メイン';
    const selectedClubCount = setting.clubs.length;
    const nonBallClubs = setting.clubs.filter((club) => club.category !== TargetCategory.BALL);
    const ballClub = setting.clubs.find((club) => club.category === TargetCategory.BALL);
    const warningOverLimit = nonBallClubs.length > ROUND_LIMIT;

    const commitSetting = useCallback((updater: ClubSetting | ((prev: ClubSetting) => ClubSetting)) => {
        const base = latestSettingRef.current;
        const next = typeof updater === 'function' ? updater(base) : updater;
        latestSettingRef.current = next;
        onUpdate(next);
        return next;
    }, [onUpdate]);

    const saveCurrentSetting = useCallback((override?: ClubSetting) => {
        const next = {
            ...(override || latestSettingRef.current),
            name: (override || latestSettingRef.current).name?.trim() || DEFAULT_SETTING_NAME,
        };
        latestSettingRef.current = next;
        onManualSave?.(next);
    }, [onManualSave]);

    const updateClub = (clubId: string, patch: Partial<Club>) => {
        commitSetting((prev) => ({
            ...prev,
            clubs: prev.clubs.map((club) => club.id === clubId ? { ...club, ...patch } : club),
        }));
    };

    const removeClub = (clubId: string) => {
        commitSetting((prev) => ({
            ...prev,
            clubs: prev.clubs.filter((club) => club.id !== clubId),
        }));
        if (expandedClubId === clubId) setExpandedClubId(null);
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
        if (isManualSaveInFlight || saveStatus === 'saving') return { label: '保存中', tone: 'border-amber-200 bg-amber-50 text-amber-800', icon: <Loader2 size={14} className="animate-spin" /> };
        if (saveStatus === 'error') return { label: saveErrorDetail || '保存エラー。もう一度保存してください。', tone: 'border-rose-200 bg-rose-50 text-rose-800', icon: <AlertTriangle size={14} /> };
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

    const renderStepNav = () => (
        <div className="grid gap-2 md:grid-cols-5">
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
                    onClick={() => setStep(stepNumber as Step)}
                    className={cn(
                        'min-h-[44px] rounded-lg px-3 py-2 text-left text-xs font-black transition ring-1',
                        step === stepNumber ? 'bg-[#176534] text-white ring-[#176534]' : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50',
                    )}
                >
                    <span className="block text-[10px] opacity-70">STEP {stepNumber}</span>
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );

    const renderSuggestionInputs = (club: Club) => {
        const shaftParts = parseShaftParts(club);
        return (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Field label="ブランド">
                    <input list="mybag-brand-suggestions" className={textInputClass} value={club.brand} onChange={(e) => updateClub(club.id, { brand: e.target.value })} placeholder="PING / Titleist" />
                </Field>
                <Field label="モデル名">
                    <input list="mybag-model-suggestions" className={textInputClass} value={club.model} onChange={(e) => updateClub(club.id, { model: e.target.value })} placeholder="G430 / Qi35" />
                </Field>
                <Field label="シャフト">
                    <input list="mybag-shaft-suggestions" className={textInputClass} value={shaftParts.model} onChange={(e) => updateClub(club.id, { shaft: buildShaft(e.target.value, shaftParts.weight, shaftParts.flex) })} placeholder="VENTUS / MODUS" />
                </Field>
                <Field label="フレックス">
                    <input list="mybag-flex-suggestions" className={textInputClass} value={club.flex || shaftParts.flex} onChange={(e) => updateClub(club.id, { flex: e.target.value, shaft: buildShaft(shaftParts.model, shaftParts.weight, e.target.value) })} placeholder="S / X / S200" />
                </Field>
                <Field label="シャフト重量">
                    <input className={textInputClass} value={club.shaftWeight || shaftParts.weight} onChange={(e) => updateClub(club.id, { shaftWeight: e.target.value, shaft: buildShaft(shaftParts.model, e.target.value, shaftParts.flex) })} placeholder="65g / 80g台" />
                </Field>
            </div>
        );
    };

    const renderClubSpecificFields = (club: Club) => {
        const slot = ALL_SLOTS.find((candidate) => slotKey(candidate) === slotKeyForClub(club));
        const isDriver = club.category === TargetCategory.DRIVER;
        const isLongClub = club.category === TargetCategory.FAIRWAY || club.category === TargetCategory.UTILITY;
        const isIron = club.category === TargetCategory.IRON;
        const isWedge = club.category === TargetCategory.WEDGE;
        const isPutter = club.category === TargetCategory.PUTTER;
        const inferredHeadShape = isPutter ? inferPutterHeadShape(club.model) : '';

        if (club.category === TargetCategory.BALL) {
            return (
                <div className="grid gap-3 md:grid-cols-4">
                    <Field label="ブランド"><input className={textInputClass} value={setting.ballBrand || club.brand} onChange={(e) => commitSetting((prev) => ({ ...prev, ballBrand: e.target.value, clubs: prev.clubs.map((item) => item.id === club.id ? { ...item, brand: e.target.value } : item) }))} placeholder="Titleist" /></Field>
                    <Field label="モデル名"><input list="mybag-ball-suggestions" className={textInputClass} value={setting.ball || club.model} onChange={(e) => commitSetting((prev) => ({ ...prev, ball: e.target.value, clubs: prev.clubs.map((item) => item.id === club.id ? { ...item, model: e.target.value } : item) }))} placeholder="Pro V1x" /></Field>
                    <Field label="カラー"><input className={textInputClass} value={setting.ballColor || ''} onChange={(e) => commitSetting((prev) => ({ ...prev, ballColor: e.target.value }))} placeholder="ホワイト" /></Field>
                    <Field label="メモ"><input className={textInputClass} value={setting.ballMemo || club.memo || ''} onChange={(e) => commitSetting((prev) => ({ ...prev, ballMemo: e.target.value, clubs: prev.clubs.map((item) => item.id === club.id ? { ...item, memo: e.target.value } : item) }))} placeholder="季節で変更など" /></Field>
                </div>
            );
        }

        if (isPutter) {
            return (
                <div className="grid gap-3 md:grid-cols-4">
                    <Field label="ブランド"><input list="mybag-brand-suggestions" className={textInputClass} value={club.brand} onChange={(e) => updateClub(club.id, { brand: e.target.value })} /></Field>
                    <Field label="モデル名"><input list="mybag-model-suggestions" className={textInputClass} value={club.model} onChange={(e) => updateClub(club.id, { model: e.target.value })} /></Field>
                    <Field label="長さ"><input className={textInputClass} value={club.length || ''} onChange={(e) => updateClub(club.id, { length: e.target.value })} placeholder="34インチ" /></Field>
                    <Field label="メモ"><input className={textInputClass} value={club.memo || ''} onChange={(e) => updateClub(club.id, { memo: e.target.value })} /></Field>
                    {!inferredHeadShape && (
                        <Field label="ヘッド形状">
                            <select className={textInputClass} value={club.headShape || ''} onChange={(e) => updateClub(club.id, { headShape: e.target.value })}>
                                <option value="">選択してください</option>
                                {['ブレード', 'マレット', 'ネオマレット', 'L字', 'センターシャフト', 'その他', '不明'].map((shape) => <option key={shape} value={shape}>{shape}</option>)}
                            </select>
                        </Field>
                    )}
                    {inferredHeadShape && <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">推定ヘッド形状: {inferredHeadShape}</div>}
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {renderSuggestionInputs(club)}
                <div className="grid gap-3 md:grid-cols-4">
                    <Field label="番手・ロフト">
                        <input className={textInputClass} value={club.loft || ''} onChange={(e) => updateClub(club.id, { loft: e.target.value })} placeholder={slot?.defaultLoft || '15°'} />
                    </Field>
                    <Field label="キャリー飛距離">
                        <input className={textInputClass} value={club.carryDistance || ''} onChange={(e) => updateClub(club.id, { carryDistance: e.target.value })} placeholder="210" />
                    </Field>
                    <Field label="総距離">
                        <input className={textInputClass} value={club.distance || ''} onChange={(e) => updateClub(club.id, { distance: e.target.value })} placeholder="220" />
                    </Field>
                    <Field label="メモ">
                        <input className={textInputClass} value={club.memo || club.worry || ''} onChange={(e) => updateClub(club.id, { memo: e.target.value, worry: e.target.value })} placeholder="候補クラブなど" />
                    </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    {isDriver && (
                        <>
                            <Field label="可変スリーブ設定"><input className={textInputClass} value={club.sleeveSetting || ''} onChange={(e) => updateClub(club.id, { sleeveSetting: e.target.value })} placeholder="10.5°を-1°" /></Field>
                            <Field label="長さ"><input className={textInputClass} value={club.length || ''} onChange={(e) => updateClub(club.id, { length: e.target.value })} placeholder="45.25インチ" /></Field>
                        </>
                    )}
                    {isIron && <Field label="ライ角"><input className={textInputClass} value={club.lieAngle || ''} onChange={(e) => updateClub(club.id, { lieAngle: e.target.value })} placeholder="標準 / 1°アップ" /></Field>}
                    {isWedge && (
                        <>
                            <Field label="バウンス"><input className={textInputClass} value={club.bounce || ''} onChange={(e) => updateClub(club.id, { bounce: e.target.value })} placeholder="10" /></Field>
                            <Field label="グラインド"><input className={textInputClass} value={club.grind || ''} onChange={(e) => updateClub(club.id, { grind: e.target.value })} placeholder="F / D / M" /></Field>
                        </>
                    )}
                </div>

                {(isLongClub || isWedge) && (
                    <div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{isWedge ? 'よく使う用途' : '主な用途'}</div>
                        <div className="flex flex-wrap gap-2">
                            {(isWedge ? WEDGE_USE_OPTIONS : USE_OPTIONS).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => updateClub(club.id, { mainUse: toggleArrayValue(club.mainUse, option) })}
                                    className={cn('rounded-full px-3 py-1.5 text-xs font-black ring-1', club.mainUse?.includes(option) ? 'bg-[#176534] text-white ring-[#176534]' : 'bg-white text-slate-500 ring-slate-200')}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">主なミス・悩み</div>
                    <div className="flex flex-wrap gap-2">
                        {MISS_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => updateClub(club.id, { missTendency: toggleArrayValue(club.missTendency, option) })}
                                className={cn('rounded-full px-3 py-1.5 text-xs font-black ring-1', club.missTendency?.includes(option) ? 'bg-amber-600 text-white ring-amber-600' : 'bg-white text-slate-500 ring-slate-200')}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const groupedTargets = setting.clubs.filter((club) => {
        const slot = ALL_SLOTS.find((candidate) => slotKey(candidate) === slotKeyForClub(club));
        return slot?.group === batchTarget;
    });

    return (
        <div className="animate-fadeIn space-y-4">
            <datalist id="mybag-brand-suggestions">{BRAND_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-model-suggestions">{MODEL_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-shaft-suggestions">{SHAFT_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-flex-suggestions">{FLEX_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist>
            <datalist id="mybag-ball-suggestions">{BALL_MODEL_SUGGESTIONS.map((ballName) => <option key={ballName} value={ballName} />)}</datalist>

            {intakeMode !== 'default' && (
                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-800">
                    {intakeMode === 'missing-clubs' ? '診断精度を上げるため、まずバッグに入っている番手を選んでください。' : '使用ボールも登録すると、ボール診断とクラブ診断をつなげやすくなります。'}
                </div>
            )}

            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#176534]">MY CLUB SETTING FLOW</div>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-trust-navy">クラブセッティング登録</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                            まず番手を選び、同じシリーズをまとめて入力し、最後に番手別の距離や悩みを調整します。未入力があっても保存できます。
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                            <div className="text-[10px] font-black text-slate-400">登録</div>
                            <div className="text-xl font-black text-trust-navy">{selectedClubCount}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                            <div className="text-[10px] font-black text-slate-400">クラブ</div>
                            <div className="text-xl font-black text-trust-navy">{nonBallClubs.length}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                            <div className="text-[10px] font-black text-slate-400">用途</div>
                            <div className="text-sm font-black text-trust-navy">{purpose}</div>
                        </div>
                    </div>
                </div>
                <div className="mt-4">{renderStepNav()}</div>
            </div>

            {warningOverLimit && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-relaxed text-amber-800">
                    現在 {nonBallClubs.length}本選択中です。公式ラウンドでは14本までです。練習用・候補クラブとして登録する場合は、このまま保存できます。
                </div>
            )}

            {step === 1 && (
                <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
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
                        <button type="button" onClick={() => setStep(2)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white">
                            番手を選ぶ <ArrowRight size={16} />
                        </button>
                    </div>
                </section>
            )}

            {step === 2 && (
                <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-black text-trust-navy">持っているクラブの番手を選択</h3>
                            <p className="mt-1 text-sm text-slate-600">詳細入力はあとで大丈夫です。まずバッグに入っている番手だけ選んでください。</p>
                        </div>
                        <ShareImageExporter targetId="my-bag-export-area" fileName="my-bag-pro-setting.png" buttonText="画像で保存" className="text-xs" />
                    </div>
                    <div className="space-y-5">
                        {SLOT_GROUPS.map((group) => (
                            <div key={group.title}>
                                <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{group.title}</div>
                                <div className="flex flex-wrap gap-2">
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
                        <button type="button" onClick={() => setStep(3)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white">
                            一括登録へ <ArrowRight size={16} />
                        </button>
                    </div>
                </section>
            )}

            {step === 3 && (
                <section className="space-y-4">
                    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
                        <h3 className="text-lg font-black text-trust-navy">カテゴリーごとに一括登録</h3>
                        <p className="mt-1 text-sm text-slate-600">同じシリーズ・同じシャフトの番手に、共通項目をまとめて入れます。</p>
                        <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr]">
                            <Field label="対象カテゴリー">
                                <select className={textInputClass} value={batchTarget} onChange={(e) => setBatchTarget(e.target.value)}>
                                    {BATCH_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                                </select>
                            </Field>
                            <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
                                対象: {groupedTargets.length > 0 ? groupedTargets.map((club) => club.number).join(' / ') : 'このカテゴリーの番手が未選択です'}
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-5">
                            <Field label="ブランド"><input list="mybag-brand-suggestions" className={textInputClass} value={commonEdit.brand} onChange={(e) => setCommonEdit((prev) => ({ ...prev, brand: e.target.value }))} /></Field>
                            <Field label="モデル名"><input list="mybag-model-suggestions" className={textInputClass} value={commonEdit.model} onChange={(e) => setCommonEdit((prev) => ({ ...prev, model: e.target.value }))} /></Field>
                            <Field label="シャフト"><input list="mybag-shaft-suggestions" className={textInputClass} value={commonEdit.shaft} onChange={(e) => setCommonEdit((prev) => ({ ...prev, shaft: e.target.value }))} /></Field>
                            <Field label="フレックス"><input list="mybag-flex-suggestions" className={textInputClass} value={commonEdit.flex} onChange={(e) => setCommonEdit((prev) => ({ ...prev, flex: e.target.value }))} /></Field>
                            <Field label="シャフト重量"><input className={textInputClass} value={commonEdit.shaftWeight} onChange={(e) => setCommonEdit((prev) => ({ ...prev, shaftWeight: e.target.value }))} placeholder="85g" /></Field>
                        </div>
                        <button type="button" onClick={applyCommonToGroup} disabled={groupedTargets.length === 0} className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-trust-navy px-5 text-sm font-black text-white disabled:opacity-50">
                            <Layers3 size={16} /> このカテゴリーに反映
                        </button>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
                        <h3 className="text-lg font-black text-trust-navy">複製・一括編集</h3>
                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                                <div className="text-sm font-black text-trust-navy">複製</div>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                                <div className="mt-3 flex flex-wrap gap-2">
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

                            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                                <div className="text-sm font-black text-trust-navy">一括編集</div>
                                <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-auto">
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
                            <button type="button" onClick={() => setStep(4)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white">
                                詳細調整へ <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {step === 4 && (
                <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
                    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-lg font-black text-trust-navy">番手ごとの詳細を調整</h3>
                            <p className="mt-1 text-sm text-slate-600">ロフトが分からなくても保存できます。診断精度を上げたい番手から入力してください。</p>
                        </div>
                        <div className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ring-1', saveStatusMeta.tone)}>
                            {saveStatusMeta.icon}
                            {saveStatusMeta.label}
                        </div>
                    </div>
                    <div id="my-bag-export-area" className="space-y-3">
                        {clubs.map((club) => {
                            const isExpanded = expandedClubId === club.id;
                            return (
                                <article key={club.id} className={cn('rounded-lg border bg-white shadow-sm', pendingBagChangeIds.includes(club.id) ? 'border-cyan-300' : 'border-slate-200')}>
                                    <button type="button" onClick={() => setExpandedClubId(isExpanded ? null : club.id)} className="flex min-h-[56px] w-full items-center justify-between gap-3 px-3 text-left">
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-trust-navy">{club.number || club.category} <span className="font-bold text-slate-400">{club.category}</span></div>
                                            <div className="truncate text-xs font-bold text-slate-500">{[club.brand, club.model].filter(Boolean).join(' ') || '未入力'} / {club.distance ? `${club.distance}y` : '距離未入力'}</div>
                                        </div>
                                        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition', isExpanded && 'rotate-180')} />
                                    </button>
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 p-3">
                                            {renderClubSpecificFields(club)}
                                            <div className="mt-4 flex justify-end gap-2">
                                                <button type="button" onClick={() => removeClub(club.id)} className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700">
                                                    <Trash2 size={14} /> 削除
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                        {clubs.length === 0 && (
                            <div className="rounded-lg border-2 border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">
                                STEP 2で番手を選ぶと、ここに詳細フォームが表示されます。
                            </div>
                        )}
                    </div>
                    <div className="mt-5 flex justify-end">
                        <button type="button" onClick={() => setStep(5)} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white">
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
                                <button type="button" onClick={() => saveCurrentSetting()} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-trust-navy px-5 text-sm font-black text-white">
                                    {isManualSaveInFlight ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    保存する
                                </button>
                                <button type="button" onClick={() => onOpenBallDiagnosis?.()} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#176534] px-5 text-sm font-black text-white">
                                    診断へ <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {clubs.map((club) => (
                                <div key={club.id} className="grid gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 md:grid-cols-[80px_1fr_180px]">
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

            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ring-1', saveStatusMeta.tone)}>
                        {saveStatusMeta.icon}
                        {saveStatusMeta.label}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        {(hasUnsavedChanges || saveStatus === 'error') && (
                            <button type="button" onClick={() => onReloadFromCloud?.()} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600">
                                <Loader2 size={14} /> クラウドから再読み込み
                            </button>
                        )}
                        {lastSaveTargetClubCount > 0 && lastSavedClubCount > 0 && lastSaveTargetClubCount !== lastSavedClubCount && (
                            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                                保存対象 {lastSaveTargetClubCount}本 / クラウド確認 {lastSavedClubCount}本
                            </div>
                        )}
                        <button type="button" onClick={() => saveCurrentSetting()} className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-trust-navy px-4 text-xs font-black text-white">
                            <Save size={14} /> 変更を保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
