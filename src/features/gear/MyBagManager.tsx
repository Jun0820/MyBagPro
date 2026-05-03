import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, ChevronDown, Save, Loader2, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { type ClubSetting, type Club, TargetCategory } from '../../types/golf';
import { BrandModelInput } from '../../components/BrandModelInput';
import { DetailedShaftInput } from '../../components/DetailedShaftInput';
import { cn } from '../../lib/utils';
import { ShareImageExporter } from '../../components/ShareImageExporter';
import { BALL_MASTER_DATA } from '../../data/ballMasterData';

const MAX_BAG_CLUBS = 14;

// Helper for Category Colors
const getCategoryColor = (cat: string) => {
    switch (cat) {
        case TargetCategory.DRIVER: return "bg-golf-600";
        case TargetCategory.FAIRWAY: return "bg-emerald-600";
        case TargetCategory.UTILITY: return "bg-teal-600";
        case TargetCategory.IRON: return "bg-blue-600";
        case TargetCategory.WEDGE: return "bg-indigo-600";
        case TargetCategory.PUTTER: return "bg-slate-600";
        default: return "bg-slate-500";
    }
}

const getCategoryLabel = (cat: string) => {
    switch (cat) {
        case TargetCategory.DRIVER: return "1W";
        case TargetCategory.FAIRWAY: return "FW";
        case TargetCategory.UTILITY: return "UT";
        case TargetCategory.IRON: return "IR";
        case TargetCategory.WEDGE: return "WG";
        case TargetCategory.PUTTER: return "PT";
        case TargetCategory.TOTAL_SETTING: return "SET";
        default: return "CL";
    }
};

const generateClubId = () => {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const rand = Math.random() * 16 | 0;
        const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
        return value.toString(16);
    });
};

const ClubRow = ({
    entry,
    onUpdate,
    onRemove,
    isPending,
}: {
    entry: Club,
    onUpdate: (updater: Club | ((prev: Club) => Club)) => void,
    onRemove: () => void,
    isPending?: boolean
}) => {
    const isPutter = entry.category === TargetCategory.PUTTER;
    const [isExpanded, setIsExpanded] = useState(() => Boolean(isPending || !entry.brand || !entry.model));

    const parseShaft = (str: string) => {
        const parts = str.split(' ');
        const flex = parts.length > 1 ? parts[parts.length - 1] : '';
        const weightWithG = parts.length > 2 ? parts[parts.length - 2] : '';
        const weight = weightWithG.replace('g', '');
        const model = parts.slice(0, Math.max(1, parts.length - 2)).join(' ');
        return { model, weight, flex };
    };

    const [shaftState, setShaftState] = useState(parseShaft(entry.shaft));

    useEffect(() => {
        setShaftState(parseShaft(entry.shaft));
    }, [entry.shaft]);

    const handleShaftUpdate = (m: string, w: string, f: string) => {
        setShaftState({ model: m, weight: w, flex: f });
        onUpdate((prev) => ({ ...prev, shaft: `${m} ${w ? w + 'g' : ''} ${f}`.trim() }));
    };

    const handleCategoryNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const parts = val.split(':');
        const newCat = parts[0] as TargetCategory;
        const newNum = parts[1] || '';
        onUpdate((prev) => ({
            ...prev,
            category: newCat,
            number: newNum,
            distance: newCat === TargetCategory.PUTTER ? '' : prev.distance,
            carryDistance: newCat === TargetCategory.PUTTER ? '' : (prev.carryDistance || ''),
        }));
    };

    const clubOptions = [
        { label: '1W (ドライバー)', cat: TargetCategory.DRIVER, num: '1W' },
        { label: '3W', cat: TargetCategory.FAIRWAY, num: '3W' },
        { label: '4W', cat: TargetCategory.FAIRWAY, num: '4W' },
        { label: '5W', cat: TargetCategory.FAIRWAY, num: '5W' },
        { label: '7W', cat: TargetCategory.FAIRWAY, num: '7W' },
        { label: '9W', cat: TargetCategory.FAIRWAY, num: '9W' },
        { label: '2U', cat: TargetCategory.UTILITY, num: '2U' },
        { label: '3U', cat: TargetCategory.UTILITY, num: '3U' },
        { label: '4U', cat: TargetCategory.UTILITY, num: '4U' },
        { label: '5U', cat: TargetCategory.UTILITY, num: '5U' },
        { label: '6U', cat: TargetCategory.UTILITY, num: '6U' },
        { label: '3I', cat: TargetCategory.IRON, num: '3I' },
        { label: '4I', cat: TargetCategory.IRON, num: '4I' },
        { label: '5I', cat: TargetCategory.IRON, num: '5I' },
        { label: '6I', cat: TargetCategory.IRON, num: '6I' },
        { label: '7I', cat: TargetCategory.IRON, num: '7I' },
        { label: '8I', cat: TargetCategory.IRON, num: '8I' },
        { label: '9I', cat: TargetCategory.IRON, num: '9I' },
        { label: 'PW', cat: TargetCategory.WEDGE, num: 'PW' },
        { label: 'AW', cat: TargetCategory.WEDGE, num: 'AW' },
        { label: 'SW', cat: TargetCategory.WEDGE, num: 'SW' },
        { label: 'LW', cat: TargetCategory.WEDGE, num: 'LW' },
        { label: 'パター', cat: TargetCategory.PUTTER, num: 'PT' },
        { label: 'その他 ウッド', cat: TargetCategory.FAIRWAY, num: 'FW' },
        { label: 'その他 ユーティリティ', cat: TargetCategory.UTILITY, num: 'UT' },
        { label: 'その他 アイアン', cat: TargetCategory.IRON, num: 'IRN' },
        { label: 'その他 ウェッジ', cat: TargetCategory.WEDGE, num: 'WDG' },
    ];

    const currentSelectValue = `${entry.category}:${entry.number || (entry.category === TargetCategory.PUTTER ? 'PT' : '')}`;

    return (
        <div className={cn("group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all", isPending ? 'border-cyan-300 ring-1 ring-cyan-100' : 'border-slate-200')}>
            <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={cn(getCategoryColor(entry.category), "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white")}>
                        {entry.number || getCategoryLabel(entry.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black text-trust-navy">
                            {[entry.brand, entry.model].filter(Boolean).join(' ') || 'ヘッド未入力'}
                            <span className="ml-2 text-[11px] font-bold text-slate-400">
                                {!isPutter && entry.distance ? `${entry.distance}Y` : isPutter ? 'PT' : '飛距離未入力'}
                            </span>
                        </div>
                    </div>
                    <div className="shrink-0 text-right">
                        <div className="text-sm font-black text-[#176534]">
                            {!isPutter && entry.distance ? `${entry.distance}Y` : isPutter ? 'PT' : '未入力'}
                        </div>
                    </div>
                    {isPending && (
                        <div className="hidden shrink-0 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-700 sm:block">
                            未保存
                        </div>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        {isExpanded ? '閉じる' : '編集'}
                    </div>
                    <ChevronDown size={18} className={cn("text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-[180px]">
                            <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">番手</div>
                            <div className="relative">
                                <select
                                    value={currentSelectValue}
                                    onChange={handleCategoryNumberChange}
                                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-bold text-trust-navy outline-none"
                                >
                                    <option value={`${entry.category}:${entry.number}`}>番手を変更...</option>
                                    {clubOptions.map(opt => (
                                        <option key={`${opt.cat}:${opt.num}`} value={`${opt.cat}:${opt.num}`}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm(`${entry.brand || 'このクラブ'} を削除してもよろしいですか？`)) {
                                    onRemove();
                                }
                            }}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700 transition-colors hover:bg-rose-100"
                            title="削除"
                        >
                            <Trash2 size={14} />
                            このクラブを削除
                        </button>
                    </div>

                    <div className="space-y-4">
                        <BrandModelInput
                            key={`brand-${entry.id}-${entry.category}`}
                            brand={entry.brand}
                            model={entry.model}
                            category={
                                entry.category === TargetCategory.DRIVER ? 'DRIVER' :
                                entry.category === TargetCategory.FAIRWAY ? 'FAIRWAY' :
                                entry.category === TargetCategory.UTILITY ? 'UTILITY' :
                                entry.category === TargetCategory.IRON ? 'IRON' :
                                entry.category === TargetCategory.WEDGE ? 'WEDGE' : 'PUTTER'
                            }
                            onBrandChange={(val) => onUpdate((prev) => ({ ...prev, brand: val, model: '' }))}
                            onModelChange={(val) => onUpdate((prev) => ({ ...prev, model: val }))}
                            bgClass="bg-slate-50"
                            compact={true}
                        />

                        <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                            <div className="min-w-0">
                                <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">シャフト</div>
                                {!isPutter ? (
                                    <DetailedShaftInput
                                        key={`shaft-${entry.id}-${entry.category}`}
                                        model={shaftState.model}
                                        weight={shaftState.weight}
                                        flex={shaftState.flex}
                                        onModelChange={(m) => handleShaftUpdate(m, shaftState.weight, shaftState.flex)}
                                        onWeightChange={(w) => handleShaftUpdate(shaftState.model, w, shaftState.flex)}
                                        onFlexChange={(f) => handleShaftUpdate(shaftState.model, shaftState.weight, f)}
                                        compact={true}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={entry.shaft}
                                        onChange={(e) => onUpdate((prev) => ({ ...prev, shaft: e.target.value }))}
                                        placeholder="シャフト名"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none focus:border-golf-500"
                                    />
                                )}
                            </div>

                            {!isPutter && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">ロフト</div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="-"
                                                value={entry.loft}
                                                onChange={(e) => onUpdate((prev) => ({ ...prev, loft: e.target.value }))}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-bold text-slate-900 outline-none focus:border-golf-500"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">°</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">総距離</div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="-"
                                                value={entry.distance}
                                                onChange={(e) => onUpdate((prev) => ({ ...prev, distance: e.target.value }))}
                                                className="w-full rounded-xl border border-golf-200 bg-golf-50/50 px-3 py-3 text-center text-sm font-bold text-golf-800 outline-none focus:border-golf-500"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-golf-400">Y</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">キャリー</div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="-"
                                                value={entry.carryDistance || ''}
                                                onChange={(e) => onUpdate((prev) => ({ ...prev, carryDistance: e.target.value }))}
                                                className="w-full rounded-xl border border-cyan-200 bg-cyan-50/50 px-3 py-3 text-center text-sm font-bold text-cyan-800 outline-none focus:border-cyan-500"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-cyan-500">Y</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <details className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                            <summary className="cursor-pointer list-none text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                                気になる点をメモする
                            </summary>
                            <input
                                type="text"
                                value={entry.worry || ''}
                                onChange={(e) => onUpdate((prev) => ({ ...prev, worry: e.target.value }))}
                                placeholder="捕まりすぎる、上がりすぎる、など"
                                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-golf-500"
                            />
                        </details>
                    </div>
                </div>
            )}
        </div>
    );
};

const MemoizedClubRow = React.memo(ClubRow);

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
    saveDebugInfo?: {
        expectedCount: number;
        receivedCount: number;
        dedupedCount: number;
        verifiedCount: number;
    } | null;
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

export const MyBagManager: React.FC<MyBagManagerProps> = ({
    setting,
    onUpdate,
    saveStatus,
    isManualSaveInFlight = false,
    saveErrorDetail = null,
    hasUnsavedChanges = false,
    pendingBagChangeCount = 0,
    pendingBagChangeIds = [],
    lastCloudSavedAt = null,
    lastSaveTargetClubCount = 0,
    lastSavedClubCount = 0,
    saveDebugInfo = null,
    onManualSave,
    onReloadFromCloud,
    onOpenBallDiagnosis,
    intakeMode = 'default',
}) => {
    const latestSettingRef = useRef(setting);
    const [addCategory, setAddCategory] = useState('');
    const [selectedLofts, setSelectedLofts] = useState<string[]>([]);
    const [batchPreset, setBatchPreset] = useState({
        brand: '',
        model: '',
        shaftModel: '',
        shaftWeight: '',
        shaftFlex: ''
    });

    useEffect(() => {
        latestSettingRef.current = setting;
    }, [setting]);

    const commitSetting = useCallback((updater: ClubSetting | ((prev: ClubSetting) => ClubSetting)) => {
        const base = latestSettingRef.current;
        const next = typeof updater === 'function' ? updater(base) : updater;
        latestSettingRef.current = next;
        onUpdate(next);
        return next;
    }, [onUpdate]);

    const saveCurrentSetting = useCallback((override?: ClubSetting) => {
        const next = override || latestSettingRef.current;
        latestSettingRef.current = next;
        onManualSave?.(next);
    }, [onManualSave]);

    const sortedClubs = [...setting.clubs].sort((a, b) => {
        // 1. Parse distances (extract digits only)
        const distA = a.distance ? parseInt(String(a.distance).replace(/\D/g, ''), 10) : 0;
        const distB = b.distance ? parseInt(String(b.distance).replace(/\D/g, ''), 10) : 0;

        // 2. Sort by distance (descending) if both have valid distances, or if one has and the other doesn't
        if (distA !== distB) {
            return distB - distA;
        }

        // 3. Fallback: Sort by Category Order
        const order = [TargetCategory.DRIVER, TargetCategory.FAIRWAY, TargetCategory.UTILITY, TargetCategory.IRON, TargetCategory.WEDGE, TargetCategory.PUTTER];
        const orderA = order.indexOf(a.category as TargetCategory);
        const orderB = order.indexOf(b.category as TargetCategory);
        
        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // 4. Fallback: Sort by number (lexical, ensures 3W comes before 5W etc if distances are same)
        if (a.number && b.number) {
            return a.number.localeCompare(b.number);
        }

        return 0;
    });

    const registeredCategories = new Set(setting.clubs.map((club) => club.category));
    const starterSlots = [
        { title: 'ドライバー', category: TargetCategory.DRIVER, number: '1W', description: 'まずは1本。診断の精度が一番上がります。', color: 'bg-golf-600' },
        { title: 'アイアン', category: TargetCategory.IRON, number: '7I', description: '代表番手を1本入れるだけでも分析しやすくなります。', color: 'bg-blue-600' },
        { title: 'パター', category: TargetCategory.PUTTER, number: 'PT', description: '最後にスコアへ効きやすい番手です。', color: 'bg-slate-600' },
    ];
    const completedStarterCount = starterSlots.filter((slot) => registeredCategories.has(slot.category)).length;
    const starterPercent = Math.round((completedStarterCount / starterSlots.length) * 100);
    const missingEssentials = starterSlots.filter((slot) => !registeredCategories.has(slot.category));
    const hasBall = Boolean(setting.ball?.trim());
    const remainingClubSlots = Math.max(0, MAX_BAG_CLUBS - setting.clubs.length);
    const isBagAtCapacity = setting.clubs.length >= MAX_BAG_CLUBS;
    const fairwayCount = setting.clubs.filter((club) => club.category === TargetCategory.FAIRWAY).length;
    const utilityCount = setting.clubs.filter((club) => club.category === TargetCategory.UTILITY).length;
    const wedgeCount = setting.clubs.filter((club) => club.category === TargetCategory.WEDGE).length;
    const putterCount = setting.clubs.filter((club) => club.category === TargetCategory.PUTTER).length;
    const distanceEligibleClubs = setting.clubs.filter((club) => club.category !== TargetCategory.PUTTER);
    const clubsWithDistance = distanceEligibleClubs.filter((club) => String(club.distance || '').trim() !== '').length;
    const distanceCoveragePercent = distanceEligibleClubs.length > 0 ? Math.round((clubsWithDistance / distanceEligibleClubs.length) * 100) : 0;
    const bagCoverageTone =
        setting.clubs.length >= 10
            ? `クラブは ${setting.clubs.length} 本登録済みです。かなり全体像が見える状態です。`
            : setting.clubs.length >= 5
            ? `クラブは ${setting.clubs.length} 本登録済みです。代表番手はかなり見えています。`
            : setting.clubs.length > 0
            ? `クラブは ${setting.clubs.length} 本登録済みです。あと数本で分析の精度が上がります。`
            : 'まだクラブが未登録です。まずは1Wか7Iからで十分です。';
    const linkageTone = hasBall
        ? `使用ボールは「${setting.ball}」です。クラブとのつながりまで見ながら診断できます。`
        : '使用ボールが未登録です。ボールまで入ると、診断と自動分析の精度がさらに上がります。';
    const structureTone =
        missingEssentials.length === 0
            ? 'ドライバー・アイアン・パターがそろっているので、いまのバッグ傾向をかなり見やすい状態です。'
            : `不足している代表番手は ${missingEssentials.map((slot) => slot.title).join(' / ')} です。ここを埋めると提案が安定します。`;
    const compositionTone =
        fairwayCount + utilityCount >= 3
            ? `ロングゲーム側は FW ${fairwayCount} 本 / UT ${utilityCount} 本で流れを見やすい構成です。`
            : `ロングゲーム側は FW ${fairwayCount} 本 / UT ${utilityCount} 本です。FWやUTを1本足すとつながりを見やすくなります。`;
    const scoringTone =
        wedgeCount >= 3 && putterCount >= 1
            ? `ショートゲーム側は WEDGE ${wedgeCount} 本 + パターでかなり整っています。`
            : `ショートゲーム側は WEDGE ${wedgeCount} 本 / パター ${putterCount} 本です。ウェッジやパターが入るとスコア改善の提案が具体的になります。`;
    const distanceTone =
        distanceCoveragePercent >= 70
            ? `飛距離の入力は ${distanceCoveragePercent}% 入っています。番手間の差分までかなり見やすいです。`
            : distanceCoveragePercent > 0
            ? `飛距離の入力は ${distanceCoveragePercent}% です。代表番手の飛距離を増やすと分析がさらに具体化します。`
            : '飛距離はまだ未入力です。1W / 7I / ウェッジあたりから入れると診断しやすくなります。';
    const analysisHighlights = [
        {
            label: '構成',
            value: `${setting.clubs.length}本登録`,
            note: bagCoverageTone,
        },
        {
            label: '代表番手',
            value: `${completedStarterCount}/${starterSlots.length}`,
            note: structureTone,
        },
        {
            label: '飛距離入力',
            value: `${distanceCoveragePercent}%`,
            note: distanceTone,
        },
    ];
    const recommendedActions = [
        missingEssentials[0]
            ? {
                title: `${missingEssentials[0].title} を先に追加`,
                description: '不足している代表番手を埋めると、自動分析と診断結果が安定します。',
                onClick: () => handleQuickAddStarter(missingEssentials[0].category, missingEssentials[0].number),
            }
            : null,
        !hasBall
            ? {
                title: '使用ボールを登録する',
                description: 'ボールまで入ると、クラブとの相性や診断導線が一気につながります。',
                onClick: () => saveCurrentSetting(),
            }
            : {
                title: 'ボール診断で相性を確認',
                description: 'いまのバッグと使用ボールが本当に合っているか、すぐ見直せます。',
                onClick: () => onOpenBallDiagnosis?.(),
            },
        distanceCoveragePercent < 70
            ? {
                title: '飛距離を追加して精度を上げる',
                description: '1W / 7I / ウェッジの飛距離が入ると、番手ごとの差分提案が具体化します。',
                onClick: () => saveCurrentSetting(),
            }
            : {
                title: 'ボール診断で相性を確認',
                description: 'バッグ全体が見えてきたら、次はボール相性を整えると次の見直しが決めやすくなります。',
                onClick: () => onOpenBallDiagnosis?.(),
            },
    ].filter(Boolean) as Array<{ title: string; description: string; onClick: () => void }>;
    const intakeBanner = (() => {
        if (intakeMode === 'missing-clubs') {
            return {
                title: 'まずは足りない番手を埋めましょう',
                description: '不足している代表番手や未登録クラブを先に埋めると、診断の精度がかなり上がります。',
                cta: missingEssentials[0] ? `${missingEssentials[0].title} を追加する` : 'My Bag を整える',
                onClick: () => {
                    if (missingEssentials[0]) {
                        handleQuickAddStarter(missingEssentials[0].category, missingEssentials[0].number);
                        return;
                    }
                    saveCurrentSetting();
                },
            };
        }

        if (intakeMode === 'ball-first') {
            return {
                title: 'まずはボール相性までそろえましょう',
                description: '使用ボールを入れるかボール診断に進むと、次の一手がかなり決まりやすくなります。',
                cta: hasBall ? 'ボール診断へ進む' : '使用ボールを保存する',
                onClick: () => {
                    if (hasBall) {
                        onOpenBallDiagnosis?.();
                        return;
                    }
                    saveCurrentSetting();
                },
            };
        }

        return null;
    })();
    const saveStatusMeta = (() => {
        if (isManualSaveInFlight) {
            return {
                label: 'SAVING NOW',
                title: 'いま変更を保存しています',
                description: '押した内容をクラウドへ反映しています。通常は数秒で完了します。',
                tone: 'border-amber-200 bg-amber-50 text-amber-800',
                icon: <Loader2 size={14} className="animate-spin" />,
            };
        }

        if (saveStatus === 'error') {
            return {
                label: 'SAVE CHECK',
                title: '保存をもう一度確認してください',
                description: saveErrorDetail || '入力内容は画面に残っています。下の保存ボタンからもう一度送れます。',
                tone: 'border-rose-200 bg-rose-50 text-rose-800',
                icon: <Save size={14} />,
            };
        }

        if (hasUnsavedChanges) {
            const lastSavedLabel = lastCloudSavedAt
                ? `前回のクラウド保存: ${new Date(lastCloudSavedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
                : 'まだクラウド保存が完了していません。';
            const pendingLabel = pendingBagChangeCount > 0 ? `未保存の変更: ${pendingBagChangeCount}件。` : '';
            return {
                label: 'PENDING CHANGES',
                title: 'まだクラウドへ反映していない変更があります',
                description: `${pendingLabel} ${lastSavedLabel} 区切りの良いところで保存すると他の端末でも再開しやすくなります。`.trim(),
                tone: 'border-cyan-200 bg-cyan-50 text-cyan-800',
                icon: <Save size={14} />,
            };
        }

        switch (saveStatus) {
            case 'saved':
                return {
                    label: 'SAVED',
                    title: '最新の内容を保存しました',
                    description: 'このままページを移動しても、今の入力内容から再開しやすい状態です。',
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
                    icon: <CheckCircle2 size={14} />,
                };
            default:
                return {
                    label: 'AUTO SAVE',
                    title: '入力しながら下書きとして整えていけます',
                    description: '途中でも構いません。まずは代表番手だけ入れて、あとから少しずつ増やせます。',
                    tone: 'border-slate-200 bg-slate-50 text-slate-700',
                    icon: <Save size={14} />,
                };
        }
    })();

    const updateClub = useCallback((clubId: string, updater: Club | ((prev: Club) => Club)) => {
        commitSetting((prev) => ({
            ...prev,
            clubs: prev.clubs.map((club) => {
                if (club.id !== clubId) return club;
                return typeof updater === 'function' ? updater(club) : updater;
            })
        }));
    }, [commitSetting]);

    const removeClub = useCallback((id: string) => {
        commitSetting((prev) => ({
            ...prev,
            clubs: prev.clubs.filter(c => c.id !== id)
        }));
    }, [commitSetting]);

    const handleAddClub = (category?: string, customModel?: string) => {
        const cat = category || addCategory;
        if (!cat) return;
        if (latestSettingRef.current.clubs.length >= MAX_BAG_CLUBS) return;
        commitSetting((prev) => ({
            ...prev,
            clubs: [...prev.clubs, {
                id: generateClubId(),
                category: cat as TargetCategory,
                brand: '',
                model: customModel || '',
                shaft: '',
                flex: '',
                number: '',
                loft: '',
                distance: '',
                carryDistance: ''
            }]
        }));
        setAddCategory('');
    };

    const handleQuickAddStarter = (category: TargetCategory, number: string) => {
        const existing = latestSettingRef.current.clubs.find((club) => club.category === category && (club.number || '') === number);
        if (existing) return;
        if (latestSettingRef.current.clubs.length >= MAX_BAG_CLUBS) return;

        commitSetting((prev) => ({
            ...prev,
            clubs: [
                ...prev.clubs,
                {
                    id: generateClubId(),
                    category,
                    brand: '',
                    model: '',
                    shaft: '',
                    flex: '',
                    number,
                    loft: '',
                    distance: '',
                    carryDistance: '',
                },
            ],
        }));
    };

    const toggleLoft = (val: string) => {
        setSelectedLofts(prev => 
            prev.includes(val) ? prev.filter(l => l !== val) : [...prev, val]
        );
    };

    const handleBatchAdd = () => {
        if (selectedLofts.length === 0) return;
        const shaftString = `${batchPreset.shaftModel} ${batchPreset.shaftWeight ? batchPreset.shaftWeight + 'g' : ''} ${batchPreset.shaftFlex}`.trim();

        const getCorrectCategory = (val: string): TargetCategory => {
            if (val === '1W') return TargetCategory.DRIVER;
            if (['3W', '4W', '5W', '7W', '9W'].includes(val)) return TargetCategory.FAIRWAY;
            if (['2U', '3U', '4U', '5U', '6U'].includes(val)) return TargetCategory.UTILITY;
            if (['3I', '4I', '5I', '6I', '7I', '8I', '9I', 'PW', 'AW'].includes(val)) return TargetCategory.IRON;
            if (['SW', 'LW'].includes(val) || val.includes('°')) return TargetCategory.WEDGE;
            return TargetCategory.IRON;
        };

        const newClubs = selectedLofts
            .map(val => {
                const actualCategory = getCorrectCategory(val);

                return {
                    id: generateClubId(),
                    category: actualCategory as TargetCategory,
                    brand: batchPreset.brand,
                    model: batchPreset.model || '',
                    shaft: shaftString,
                    flex: batchPreset.shaftFlex,
                    number: val,
                    loft: '',
                    distance: '',
                    carryDistance: ''
                } as Club;
            })
            .filter((c): c is Club => c !== null);

        const allowedNewClubs = newClubs.slice(0, remainingClubSlots);
        if (allowedNewClubs.length === 0) return;

        const nextSetting = {
            ...latestSettingRef.current,
            clubs: [...latestSettingRef.current.clubs, ...allowedNewClubs]
        };
        commitSetting(nextSetting);
        setSelectedLofts([]);
        saveCurrentSetting(nextSetting);
    };

    return (
        <div className="space-y-4 animate-fadeIn">
            {intakeBanner && (
                <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm md:p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">CHECK YOUR BAG</div>
                            <h3 className="mt-2 text-lg font-black tracking-tight text-trust-navy">{intakeBanner.title}</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{intakeBanner.description}</p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={intakeBanner.onClick}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-cyan-700"
                            >
                                {intakeBanner.cta}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">STEP 1</div>
                                <h3 className="mt-1 text-lg font-black tracking-tight text-trust-navy">最初に代表番手を入れる</h3>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">登録本数</div>
                                <div className="mt-1 text-2xl font-black text-trust-navy">{sortedClubs.length}<span className="text-sm text-slate-400">/{MAX_BAG_CLUBS}</span></div>
                                <div className="mt-1 text-xs font-bold text-slate-500">目標は14本</div>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {starterSlots.map((slot) => {
                                const isDone = registeredCategories.has(slot.category);
                                return (
                                    <button
                                        key={slot.title}
                                        onClick={() => handleQuickAddStarter(slot.category, slot.number)}
                                        disabled={isDone || isBagAtCapacity}
                                        className={cn(
                                            'rounded-2xl border p-4 text-left transition-all',
                                            isDone ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white hover:bg-slate-50',
                                            (isDone || isBagAtCapacity) && 'cursor-default'
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={cn('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white', slot.color)}>
                                                {slot.number}
                                            </div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                {isDone ? '登録済み' : '追加'}
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm font-black text-trust-navy">{slot.title}</div>
                                        <div className="mt-1 text-xs leading-relaxed text-slate-500">{slot.number} を追加</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                            <Sparkles size={12} />
                            STEP 3
                        </div>
                        <h3 className="mt-2 text-base font-black tracking-tight text-trust-navy">最後に保存する</h3>
                        <div className="mt-3 space-y-3">
                            <button
                                onClick={() => saveCurrentSetting()}
                                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-trust-navy px-4 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800"
                            >
                                <Save size={14} />
                                いまの内容を保存
                            </button>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">使用ボール</div>
                                <input
                                    list="mybag-ball-suggestions"
                                    value={setting.ball || ''}
                                    onChange={(e) => commitSetting((prev) => ({ ...prev, ball: e.target.value }))}
                                    placeholder="例: Pro V1 / TP5"
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-trust-navy outline-none transition-all focus:border-golf-500"
                                />
                                <datalist id="mybag-ball-suggestions">
                                    {BALL_MODEL_SUGGESTIONS.map((ballName) => (
                                        <option key={ballName} value={ballName} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {false && (
            <>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">START HERE</div>
                        <h3 className="text-xl font-black tracking-tight text-trust-navy">最初は3本だけでも大丈夫です</h3>
                        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                            まずはドライバー、アイアン、パターのどれか1本から始めれば十分です。あとで少しずつ増やしていけます。
                        </p>
                    </div>
                    <div className="min-w-[180px] rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <span>まずはここから</span>
                            <span>{starterPercent}%</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-golf-500 to-emerald-500 transition-all"
                                style={{ width: `${starterPercent}%` }}
                            />
                        </div>
                        <div className="mt-2 text-xs font-medium text-slate-500">
                            {completedStarterCount} / {starterSlots.length} クリア
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {starterSlots.map((slot) => {
                        const isDone = registeredCategories.has(slot.category);
                        return (
                            <button
                                key={slot.title}
                                onClick={() => handleQuickAddStarter(slot.category, slot.number)}
                                disabled={isDone}
                                className={cn(
                                    'rounded-2xl border p-4 text-left transition-all',
                                    isDone
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className={cn('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white', slot.color)}>
                                        {slot.number}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        {isDone ? '登録済み' : '先に追加'}
                                    </div>
                                </div>
                                <div className="mt-3 text-base font-black text-trust-navy">{slot.title}</div>
                                <div className="mt-1 text-xs leading-relaxed text-slate-500">{slot.description}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-golf-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">
                            <Sparkles size={12} />
                            AUTO ANALYSIS
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-trust-navy">登録した内容から、次に見るべき方向を整理します</h3>
                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                                まずは代表番手とボールが入っていれば十分です。登録した直後に、何を残し、何を見直すべきかが分かるようにしています。
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 md:min-w-[240px]">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">現在の使用ボール</div>
                        <input
                            list="mybag-ball-suggestions"
                            value={setting.ball || ''}
                            onChange={(e) => commitSetting((prev) => ({ ...prev, ball: e.target.value }))}
                            placeholder="例: Pro V1 / TP5 / Chrome Tour"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-trust-navy outline-none transition-all focus:border-golf-500"
                        />
                        <datalist id="mybag-ball-suggestions">
                            {BALL_MODEL_SUGGESTIONS.map((ballName) => (
                                <option key={ballName} value={ballName} />
                            ))}
                        </datalist>
                        <button
                            onClick={() => saveCurrentSetting()}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100"
                        >
                            <Save size={14} />
                            ボールも含めて保存
                        </button>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {analysisHighlights.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                                    <div className="mt-2 text-2xl font-black text-trust-navy">{item.value}</div>
                                </div>
                                <div className="rounded-full bg-white p-2 text-golf-600 shadow-sm">
                                    <Sparkles size={14} />
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.note}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {[compositionTone, scoringTone, linkageTone].map((point) => (
                        <div key={point} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-sm leading-relaxed text-slate-600">{point}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <ArrowRight size={12} />
                        NEXT STEP
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {recommendedActions.map((action) => (
                            <button
                                key={action.title}
                                onClick={action.onClick}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-trust-navy transition-colors hover:bg-slate-50"
                            >
                                <div className="text-base font-black">{action.title}</div>
                                <div className="mt-1 text-xs leading-relaxed text-slate-500">{action.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cn(
                    "mt-5 rounded-2xl border px-4 py-3 text-sm font-bold",
                    isBagAtCapacity
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                )}>
                    {isBagAtCapacity
                        ? `クラブは最大 ${MAX_BAG_CLUBS} 本まで登録できます。いまは上限に達しています。`
                        : `クラブは最大 ${MAX_BAG_CLUBS} 本まで登録できます。あと ${remainingClubSlots} 本追加できます。`}
                </div>
            </div>
            </>
            )}

            {/* クラブ一覧 & 編集部 */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <div className="mb-4 flex flex-col justify-between gap-4 border-b border-slate-100 pb-3 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-golf-500 rounded-full"></div>
                         <div>
                             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">STEP 2 / 登録済みクラブを直す</div>
                             <h3 className="font-bold text-lg text-trust-navy uppercase tracking-tight">CLUB MANAGEMENT</h3>
                         </div>
                         <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-black text-slate-400">いまの登録: {sortedClubs.length}/{MAX_BAG_CLUBS}本</div>
                    </div>
                    <ShareImageExporter 
                        targetId="my-bag-export-area" 
                        fileName="my-bag-pro-setting.png"
                        buttonText="セッティングを画像で保存"
                        className="text-xs"
                    />
                </div>

                <div className={cn('mb-4 rounded-2xl border px-4 py-3', saveStatusMeta.tone)}>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-white/80 p-2 shadow-sm">
                            {saveStatusMeta.icon}
                        </div>
                        <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{saveStatusMeta.label}</div>
                            <div className="mt-1 text-sm font-black">{saveStatusMeta.title}</div>
                            <div className="mt-1 text-xs leading-relaxed opacity-80">{saveStatusMeta.description}</div>
                            <div className="mt-2 text-[11px] font-bold opacity-70">
                                保存対象 {lastSaveTargetClubCount}本 / クラウド確認 {lastSavedClubCount}本
                            </div>
                            {saveDebugInfo && (
                                <div className="mt-1 text-[11px] font-bold opacity-70">
                                    API受付 {saveDebugInfo.receivedCount}本 / 重複整理後 {saveDebugInfo.dedupedCount}本 / 検証 {saveDebugInfo.verifiedCount}本
                                </div>
                            )}
                            <div className="mt-1 text-[11px] font-bold opacity-70">
                                残り追加可能 {remainingClubSlots}本
                            </div>
                        </div>
                    </div>
                    {(hasUnsavedChanges || saveStatus === 'error') && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={() => saveCurrentSetting()}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-current/20 bg-white/80 px-4 py-2 text-xs font-black transition-colors hover:bg-white"
                            >
                                <Save size={14} />
                                もう一度保存
                            </button>
                            <button
                                onClick={() => onReloadFromCloud?.()}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-current/20 bg-white/50 px-4 py-2 text-xs font-black transition-colors hover:bg-white/80"
                            >
                                <Loader2 size={14} className={saveStatus === 'saving' && !isManualSaveInFlight ? 'animate-spin' : ''} />
                                クラウドから再読み込み
                            </button>
                        </div>
                    )}
                </div>
                
                <div id="my-bag-export-area" className="mb-4 space-y-3 rounded-2xl bg-white p-1">
                    {sortedClubs.map(entry => (
                        <MemoizedClubRow 
                            key={`${entry.id}-${entry.category}-${entry.number || ''}`} 
                            entry={entry} 
                            onUpdate={(updater) => updateClub(entry.id, updater)} 
                            onRemove={() => removeClub(entry.id)} 
                            isPending={pendingBagChangeIds.includes(entry.id)}
                        />
                    ))}
                    {sortedClubs.length === 0 && (
                        <div className="col-span-full text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300">
                             <Plus size={48} className="mx-auto mb-4 opacity-10" />
                             <p className="text-sm font-bold">まだクラブが入っていません</p>
                             <p className="mt-2 text-xs font-medium text-slate-400">まずは 1W / 7I / パター のどれか1本を追加すると始めやすいです。</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-8 flex max-w-4xl flex-col gap-4 border-t border-slate-100 pt-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <div className="flex-1 relative">
                            <select
                                value={addCategory}
                                onChange={e => setAddCategory(e.target.value)}
                                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-bold text-trust-navy outline-none"
                            >
                                <option value="">追加したい番手を選択...</option>
                                {Object.values(TargetCategory).filter(c => c !== TargetCategory.BALL).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                        <button
                            onClick={() => handleAddClub()}
                            disabled={!addCategory || isBagAtCapacity}
                            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-8 font-bold text-trust-navy transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50 sm:w-auto"
                        >
                            <Plus size={20} /> この番手を追加
                        </button>
                    </div>

                    <button 
                        onClick={() => saveCurrentSetting()} 
                        className="flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-trust-navy px-8 font-bold text-white shadow-lg transition-all hover:bg-slate-800 active:scale-95 lg:w-auto"
                    >
                        {isManualSaveInFlight ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>保存中...</span>
                            </>
                        ) : !hasUnsavedChanges && saveStatus === 'saved' ? (
                            <>
                                <CheckCircle2 size={18} className="text-emerald-400" />
                                <span>保存完了</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>変更を保存</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
                    入力後に <span className="font-black text-trust-navy">変更を保存</span> を押すと、他の端末や再ログイン後でもそのまま再開しやすくなります。
                </div>
            </div>

            {/* クラブ一括追加 */}
            <details className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
                <summary className="flex cursor-pointer list-none items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-4 select-none [&::-webkit-details-marker]:hidden md:px-6">
                    <div className="flex items-center gap-3">
                        <Plus size={18} className="text-golf-600" />
                        <h3 className="font-bold text-sm text-trust-navy uppercase tracking-tight">まとめて追加</h3>
                    </div>
                    <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="space-y-6 p-4 md:p-6">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                        同じシリーズをまとめて入れるときだけ使います。共通のヘッドとシャフトを決めて、必要な番手だけ選んで追加します。
                        </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { label: 'アイアン 5I-PW', values: ['5I', '6I', '7I', '8I', '9I', 'PW'] },
                            { label: 'ウェッジ 50-54-58', values: ['50°', '54°', '58°'] },
                            { label: 'FW 3W / 5W', values: ['3W', '5W'] },
                        ].map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => setSelectedLofts(preset.values)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50"
                            >
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Preset</div>
                                <div className="mt-1 text-sm font-black text-trust-navy">{preset.label}</div>
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">共通ヘッド</div>
                            <BrandModelInput
                                brand={batchPreset.brand}
                                model={batchPreset.model}
                                category="ALL"
                                onBrandChange={(b) => setBatchPreset({ ...batchPreset, brand: b })}
                                onModelChange={(m) => setBatchPreset({ ...batchPreset, model: m })}
                                bgClass="bg-slate-50 border-slate-100"
                                placeholderModel="モデル名 (例: Qi10 / P790)"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">共通シャフト</div>
                            <DetailedShaftInput
                                model={batchPreset.shaftModel}
                                weight={batchPreset.shaftWeight}
                                flex={batchPreset.shaftFlex}
                                onModelChange={(m) => setBatchPreset({ ...batchPreset, shaftModel: m })}
                                onWeightChange={(w) => setBatchPreset({ ...batchPreset, shaftWeight: w })}
                                onFlexChange={(f) => setBatchPreset({ ...batchPreset, shaftFlex: f })}
                            />
                        </div>
                    </div>
                                
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                        {/* Selectable Lofts UI */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Woods / UT */}
                            <div className="space-y-3">
                                <div className="ml-1 text-xs font-black uppercase tracking-widest text-emerald-600">
                                    WOODS & UTILITY
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    {['1W', '3W', '4W', '5W', '7W', '9W', '2U', '3U', '4U', '5U', '6U'].map(loft => (
                                        <button 
                                            key={loft}
                                            onClick={() => toggleLoft(loft)}
                                            className={cn( "px-3 py-2 rounded-xl font-bold text-[11px] transition-all border", selectedLofts.includes(loft) ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-105" : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300" )}
                                        >{loft}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Irons */}
                            <div className="space-y-3">
                                <div className="ml-1 text-xs font-black uppercase tracking-widest text-blue-600">
                                    IRONS
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    {['3I', '4I', '5I', '6I', '7I', '8I', '9I', 'PW', 'AW', 'SW', 'LW'].map(loft => (
                                        <button 
                                            key={loft}
                                            onClick={() => toggleLoft(loft)}
                                            className={cn( "px-3 py-2 rounded-xl font-bold text-[11px] transition-all border", selectedLofts.includes(loft) ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" : "bg-white text-slate-500 border-slate-200 hover:border-blue-300" )}
                                        >{loft}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Wedges */}
                            <div className="space-y-3">
                                <div className="ml-1 text-xs font-black uppercase tracking-widest text-indigo-600">
                                    WEDGES
                                </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    {['46°', '48°', '50°', '52°', '54°', '56°', '58°', '60°'].map(loft => (
                                        <button 
                                            key={loft}
                                            onClick={() => toggleLoft(loft)}
                                            className={cn( "px-3 py-2 rounded-xl font-bold text-[11px] transition-all border", selectedLofts.includes(loft) ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300" )}
                                        >{loft}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-bold text-slate-500">
                                選択中 {selectedLofts.length} 本
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLofts([])}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                >
                                    選択をクリア
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchAdd()}
                                    disabled={selectedLofts.length === 0 || isBagAtCapacity}
                                    className="inline-flex h-11 items-center justify-center rounded-xl bg-trust-navy px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                                >
                                    選択した番手を追加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
};
