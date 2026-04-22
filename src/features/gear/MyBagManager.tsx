import React, { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, Save, Loader2, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { type ClubSetting, type Club, TargetCategory } from '../../types/golf';
import { BrandModelInput } from '../../components/BrandModelInput';
import { DetailedShaftInput } from '../../components/DetailedShaftInput';
import { cn } from '../../lib/utils';
import { ShareImageExporter } from '../../components/ShareImageExporter';
import { BALL_MASTER_DATA } from '../../data/ballMasterData';

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

const ClubRow = ({ entry, onUpdate, onRemove, onDiagnose }: { entry: Club, onUpdate: (c: Club) => void, onRemove: () => void, onDiagnose: (c: Club) => void }) => {
    const isPutter = entry.category === TargetCategory.PUTTER;

    const parseShaft = (str: string) => {
        const parts = str.split(' ');
        const flex = parts.length > 1 ? parts[parts.length - 1] : '';
        const weightWithG = parts.length > 2 ? parts[parts.length - 2] : '';
        const weight = weightWithG.replace('g', '');
        const model = parts.slice(0, Math.max(1, parts.length - 2)).join(' ');
        return { model, weight, flex };
    };

    const [shaftState, setShaftState] = useState(parseShaft(entry.shaft));

    const handleShaftUpdate = (m: string, w: string, f: string) => {
        setShaftState({ model: m, weight: w, flex: f });
        onUpdate({ ...entry, shaft: `${m} ${w ? w + 'g' : ''} ${f}`.trim() });
    };

    const handleCategoryNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const parts = val.split(':');
        const newCat = parts[0] as TargetCategory;
        const newNum = parts[1] || '';
        onUpdate({ ...entry, category: newCat, number: newNum });
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
        <div className="bg-white p-2 md:p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex items-center justify-between gap-2 mb-2 border-b border-slate-50 pb-1.5">
                <div className="flex items-center gap-1.5 relative">
                    <div className={cn(getCategoryColor(entry.category), "flex items-center rounded overflow-hidden shadow-sm hover:opacity-90 transition-opacity")}>
                        <div className="px-1.5 py-0.5 pointer-events-none text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                            {getCategoryLabel(entry.category)}
                        </div>
                        <select
                            value={currentSelectValue}
                            onChange={handleCategoryNumberChange}
                            className="bg-transparent text-white font-black text-[10px] md:text-xs tracking-wider outline-none appearance-none pr-4 pl-1 min-w-[3rem] cursor-pointer"
                            style={{ WebkitAppearance: 'none' }}
                        >
                            <option value={`${entry.category}:${entry.number}`} className="text-slate-800">変更...</option>
                            {clubOptions.map(opt => (
                                <option key={`${opt.cat}:${opt.num}`} value={`${opt.cat}:${opt.num}`} className="text-slate-800">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={10} className="text-white absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
                    </div>
                </div>
                <button onClick={onRemove} className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all ml-auto focus:outline-none">
                    <Trash2 size={10} />
                </button>
            </div>
            
            <div className="space-y-3">
                {/* Brand & Model - Row 1 */}
                <BrandModelInput
                    brand={entry.brand}
                    model={entry.model}
                    category={
                        entry.category === TargetCategory.DRIVER ? 'DRIVER' :
                        entry.category === TargetCategory.FAIRWAY ? 'FAIRWAY' :
                        entry.category === TargetCategory.UTILITY ? 'UTILITY' :
                        entry.category === TargetCategory.IRON ? 'IRON' :
                        entry.category === TargetCategory.WEDGE ? 'WEDGE' : 'PUTTER'
                    }
                    onBrandChange={(val) => onUpdate({ ...entry, brand: val, model: '' })}
                    onModelChange={(val) => onUpdate({ ...entry, model: val })}
                    bgClass="bg-slate-50"
                    compact={true}
                />
                
                {/* Shaft & Specs - Row 2 */}
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1 min-w-0">
                        {!isPutter ? (
                            <DetailedShaftInput
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
                                onChange={(e) => onUpdate({ ...entry, shaft: e.target.value })}
                                placeholder="シャフト名"
                                className="w-full px-2 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-xs outline-none focus:border-golf-500"
                            />
                        )}
                    </div>
                    
                    <div className="flex gap-1.5 md:w-32 items-center">
                        {!isPutter ? (
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="ロフト"
                                    value={entry.loft}
                                    onChange={(e) => onUpdate({ ...entry, loft: e.target.value })}
                                    className="w-full px-1 py-1.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] text-center font-bold outline-none focus:border-golf-500"
                                />
                                <span className="absolute right-1 top-1/2 -translate-y-1/3 text-[7px] text-slate-400 font-black">°</span>
                            </div>
                        ) : (
                            <div className="flex-1 invisible md:block" />
                        )}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="飛距離"
                                value={entry.distance}
                                onChange={(e) => onUpdate({ ...entry, distance: e.target.value })}
                                className="w-full px-1 py-1.5 bg-golf-50/50 border border-golf-200 text-golf-800 font-bold rounded-lg text-[10px] text-center outline-none focus:border-golf-500"
                            />
                            <span className="absolute right-1 top-1/2 -translate-y-1/3 text-[7px] text-golf-400 font-black">Y</span>
                        </div>
                    </div>
                </div>

                {/* Individual Worry & Diagnosis Button */}
                <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                    <input
                        type="text"
                        value={entry.worry || ''}
                        onChange={(e) => onUpdate({ ...entry, worry: e.target.value })}
                        placeholder="悩み（捕まる、等）"
                        className="flex-1 px-2 py-1.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-[10px] outline-none focus:border-golf-500"
                    />
                    <button 
                        onClick={() => onDiagnose(entry)}
                        className="px-2 py-1.5 bg-golf-600 text-white rounded-lg text-[9px] font-bold hover:bg-golf-700 transition-colors whitespace-nowrap"
                    >
                        AI診断
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemoizedClubRow = React.memo(ClubRow);

interface MyBagManagerProps {
    setting: ClubSetting;
    onUpdate: (setting: ClubSetting) => void;
    onDiagnose?: (club: Club) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    onManualSave?: () => void;
    onSaveAndReturn?: () => void;
    onOpenBallDiagnosis?: () => void;
    onOpenCompare?: () => void;
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
    onDiagnose,
    saveStatus,
    onManualSave,
    onSaveAndReturn,
    onOpenBallDiagnosis,
    onOpenCompare,
    intakeMode = 'default',
}) => {
    const [addCategory, setAddCategory] = useState('');
    const [selectedLofts, setSelectedLofts] = useState<string[]>([]);
    const [batchPreset, setBatchPreset] = useState({
        brand: '',
        model: '',
        shaftModel: '',
        shaftWeight: '',
        shaftFlex: ''
    });

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
    const fairwayCount = setting.clubs.filter((club) => club.category === TargetCategory.FAIRWAY).length;
    const utilityCount = setting.clubs.filter((club) => club.category === TargetCategory.UTILITY).length;
    const wedgeCount = setting.clubs.filter((club) => club.category === TargetCategory.WEDGE).length;
    const putterCount = setting.clubs.filter((club) => club.category === TargetCategory.PUTTER).length;
    const clubsWithDistance = setting.clubs.filter((club) => String(club.distance || '').trim() !== '').length;
    const distanceCoveragePercent = setting.clubs.length > 0 ? Math.round((clubsWithDistance / setting.clubs.length) * 100) : 0;
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
            ? `ロングゲーム側は FW ${fairwayCount} 本 / UT ${utilityCount} 本で比較しやすい構成です。`
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
            : '飛距離はまだ未入力です。1W / 7I / ウェッジあたりから入れると比較しやすくなります。';
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
                onClick: () => onManualSave?.(),
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
                onClick: () => onManualSave?.(),
            }
            : {
                title: '比較ページで差を見る',
                description: 'バッグ全体の傾向が見えているので、次はプロや候補との違いを見る段階です。',
                onClick: () => onOpenCompare?.(),
            },
    ].filter(Boolean) as Array<{ title: string; description: string; onClick: () => void }>;
    const intakeBanner = (() => {
        if (intakeMode === 'missing-clubs') {
            return {
                title: '比較ページから戻ってきました',
                description: '不足している代表番手や未登録クラブを先に埋めると、比較と診断の精度がかなり上がります。',
                cta: missingEssentials[0] ? `${missingEssentials[0].title} を追加する` : 'My Bag を整える',
                onClick: () => {
                    if (missingEssentials[0]) {
                        handleQuickAddStarter(missingEssentials[0].category, missingEssentials[0].number);
                        return;
                    }
                    onManualSave?.();
                },
            };
        }

        if (intakeMode === 'ball-first') {
            return {
                title: 'まずはボール相性までそろえましょう',
                description: '比較で迷ったときは、使用ボールを入れるかボール診断に進むと次の一手が決まりやすくなります。',
                cta: hasBall ? 'ボール診断へ進む' : '使用ボールを保存する',
                onClick: () => {
                    if (hasBall) {
                        onOpenBallDiagnosis?.();
                        return;
                    }
                    onManualSave?.();
                },
            };
        }

        return null;
    })();

    const updateClub = useCallback((updated: Club) => {
        onUpdate({
            ...setting,
            clubs: setting.clubs.map(c => c.id === updated.id ? updated : c)
        });
    }, [onUpdate, setting]);

    const removeClub = useCallback((id: string) => {
        onUpdate({
            ...setting,
            clubs: setting.clubs.filter(c => c.id !== id)
        });
    }, [onUpdate, setting]);

    const handleAddClub = (category?: string, customModel?: string) => {
        const cat = category || addCategory;
        if (!cat) return;
        onUpdate({
            ...setting,
            clubs: [...setting.clubs, {
                id: Math.random().toString(36).substring(7),
                category: cat as TargetCategory,
                brand: '',
                model: customModel || '',
                shaft: '',
                flex: '',
                number: '',
                loft: '',
                distance: ''
            }]
        });
        setAddCategory('');
    };

    const handleQuickAddStarter = (category: TargetCategory, number: string) => {
        const existing = setting.clubs.find((club) => club.category === category && (club.number || '') === number);
        if (existing) return;

        onUpdate({
            ...setting,
            clubs: [
                ...setting.clubs,
                {
                    id: Math.random().toString(36).substring(7),
                    category,
                    brand: '',
                    model: '',
                    shaft: '',
                    flex: '',
                    number,
                    loft: '',
                    distance: '',
                },
            ],
        });
    };

    const toggleLoft = (val: string) => {
        setSelectedLofts(prev => 
            prev.includes(val) ? prev.filter(l => l !== val) : [...prev, val]
        );
    };

    const handleBatchAdd = (requestedCategory: TargetCategory) => {
        if (selectedLofts.length === 0) return;
        const shaftString = `${batchPreset.shaftModel} ${batchPreset.shaftWeight ? batchPreset.shaftWeight + 'g' : ''} ${batchPreset.shaftFlex}`.trim();

        const getCorrectCategory = (val: string): TargetCategory => {
            if (val === '1W') return TargetCategory.DRIVER;
            if (['3W', '4W', '5W', '7W', '9W'].includes(val)) return TargetCategory.FAIRWAY;
            if (['2U', '3U', '4U', '5U', '6U'].includes(val)) return TargetCategory.UTILITY;
            if (['3I', '4I', '5I', '6I', '7I', '8I', '9I', 'PW', 'AW'].includes(val)) return TargetCategory.IRON;
            if (['SW', 'LW'].includes(val) || val.includes('°')) return TargetCategory.WEDGE;
            return requestedCategory;
        };

        const isAppropriate = (val: string, req: TargetCategory) => {
            if (req === TargetCategory.FAIRWAY) return val.includes('W') || val.includes('U');
            if (req === TargetCategory.IRON) return val.includes('I') || ['PW', 'AW', 'SW', 'LW'].includes(val);
            if (req === TargetCategory.WEDGE) return val.includes('°') || ['PW', 'AW', 'SW', 'LW'].includes(val);
            return true;
        };

        const newClubs = selectedLofts
            .map(val => {
                const actualCategory = getCorrectCategory(val);
                if (!isAppropriate(val, requestedCategory)) return null;

                return {
                    id: Math.random().toString(36).substring(7),
                    category: actualCategory as TargetCategory,
                    brand: batchPreset.brand,
                    model: batchPreset.model || '',
                    shaft: shaftString,
                    flex: batchPreset.shaftFlex,
                    number: val,
                    loft: '',
                    distance: ''
                } as Club;
            })
            .filter((c): c is Club => c !== null);

        onUpdate({
            ...setting,
            clubs: [...setting.clubs, ...newClubs]
        });
        setSelectedLofts([]);
        // Batch add should also attempt a sync
        setTimeout(() => onManualSave?.(), 100);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {intakeBanner && (
                <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm md:p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">From Compare</div>
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
                            {intakeMode === 'missing-clubs' && onSaveAndReturn && (
                                <button
                                    onClick={onSaveAndReturn}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-cyan-700 transition-colors hover:bg-cyan-50"
                                >
                                    保存して比較に戻る
                                    <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">Quick Start</div>
                        <h3 className="text-xl font-black tracking-tight text-trust-navy">最初は3本だけでも大丈夫です</h3>
                        <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                            まずはドライバー、アイアン、パターのどれか1本から始めれば十分です。あとで少しずつ増やしていけます。
                        </p>
                    </div>
                    <div className="min-w-[180px] rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                            <span>スタート登録</span>
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

                <div className="mt-5 grid gap-3 md:grid-cols-3">
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
                                        {isDone ? '登録済み' : 'まず追加'}
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
                            Auto Analysis
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-trust-navy">登録した内容から、いまの傾向を自動で整理します</h3>
                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                                まずは代表番手とボールが入っていれば十分です。登録した直後に、次に見るべき診断や比較が分かるようにしています。
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 md:min-w-[240px]">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">現在の使用ボール</div>
                        <input
                            list="mybag-ball-suggestions"
                            value={setting.ball || ''}
                            onChange={(e) => onUpdate({ ...setting, ball: e.target.value })}
                            placeholder="例: Pro V1 / TP5 / Chrome Tour"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-trust-navy outline-none transition-all focus:border-golf-500"
                        />
                        <datalist id="mybag-ball-suggestions">
                            {BALL_MODEL_SUGGESTIONS.map((ballName) => (
                                <option key={ballName} value={ballName} />
                            ))}
                        </datalist>
                        <button
                            onClick={() => onManualSave?.()}
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
                        Recommended Next Actions
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
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
            </div>

            {/* クラブ一覧 & 編集部 */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-100 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-golf-500 rounded-full"></div>
                         <h3 className="font-bold text-lg text-trust-navy uppercase tracking-tight">CLUB MANAGEMENT</h3>
                         <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[10px] font-black text-slate-400">登録済み: {sortedClubs.length}本</div>
                    </div>
                    <ShareImageExporter 
                        targetId="my-bag-export-area" 
                        fileName="my-bag-pro-setting.png"
                        buttonText="セッティングを画像で保存"
                        className="text-xs"
                    />
                </div>
                
                <div id="my-bag-export-area" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 bg-white p-1 rounded-2xl">
                    {sortedClubs.map(entry => (
                        <MemoizedClubRow 
                            key={entry.id} 
                            entry={entry} 
                            onUpdate={updateClub} 
                            onRemove={() => removeClub(entry.id)} 
                            onDiagnose={(c) => onDiagnose?.(c)}
                        />
                    ))}
                    {sortedClubs.length === 0 && (
                        <div className="col-span-full text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300">
                             <Plus size={48} className="mx-auto mb-4 opacity-10" />
                             <p className="text-sm font-bold">まだクラブが登録されていません</p>
                             <p className="mt-2 text-xs font-medium text-slate-400">上のクイックスタートから 1W / 7I / パター のどれか1本を追加すると始めやすいです。</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100 max-w-4xl flex items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="flex-1 relative">
                            <select
                                value={addCategory}
                                onChange={e => setAddCategory(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-bold text-trust-navy outline-none appearance-none text-sm"
                            >
                                <option value="">個別追加する番手を選択...</option>
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
                            disabled={!addCategory}
                            className="h-12 px-8 bg-slate-100 text-trust-navy font-bold rounded-xl hover:bg-slate-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Plus size={20} /> 個別追加
                        </button>
                    </div>

                    <button 
                        onClick={() => onManualSave?.()} 
                        className="h-12 px-8 bg-trust-navy text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        {saveStatus === 'saving' ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>保存中...</span>
                            </>
                        ) : saveStatus === 'saved' ? (
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
            </div>

            {/* クラブ一括追加 */}
            <details className="group bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                <summary className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-3">
                        <Plus size={18} className="text-golf-600" />
                        <h3 className="font-bold text-sm text-trust-navy uppercase tracking-tight">BATCH ADD CLUBS</h3>
                    </div>
                    <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">共通ブランド・モデル名</div>
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
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">共通シャフトスペック</div>
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Woods / UT */}
                            <div className="space-y-3">
                                <div className="text-xs font-black text-emerald-600 tracking-widest uppercase ml-1 flex justify-between items-center">
                                    <span>WOODS & UTILITY</span>
                                    <button onClick={() => handleBatchAdd(TargetCategory.FAIRWAY)} className="text-white bg-emerald-600 px-3 py-1.5 rounded-full hover:bg-emerald-700 transition-all font-bold">追加</button>
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
                                <div className="text-xs font-black text-blue-600 tracking-widest uppercase ml-1 flex justify-between items-center">
                                    <span>IRONS</span>
                                    <button onClick={() => handleBatchAdd(TargetCategory.IRON)} className="text-white bg-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-700 transition-all font-bold">追加</button>
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
                                <div className="text-xs font-black text-indigo-600 tracking-widest uppercase ml-1 flex justify-between items-center">
                                    <span>WEDGES</span>
                                    <button onClick={() => handleBatchAdd(TargetCategory.WEDGE)} className="text-white bg-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-all font-bold">追加</button>
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
                    </div>
                </div>
            </details>
        </div>
    );
};
