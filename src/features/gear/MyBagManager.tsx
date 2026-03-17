import React, { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { type ClubSetting, type Club, TargetCategory } from '../../types/golf';
import { BrandModelInput } from '../../components/BrandModelInput';
import { DetailedShaftInput } from '../../components/DetailedShaftInput';
import { cn } from '../../lib/utils';
import { ShareImageExporter } from '../../components/ShareImageExporter';

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

    return (
        <div className="bg-white p-2 md:p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex items-center justify-between gap-2 mb-2 border-b border-slate-50 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <span className={cn(getCategoryColor(entry.category), "text-white text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider")}>
                        {getCategoryLabel(entry.category)}
                    </span>
                    {entry.number && (
                        <span className="text-trust-navy font-black text-[10px] md:text-xs bg-slate-100 px-1.5 rounded">{entry.number}</span>
                    )}
                </div>
                <button onClick={onRemove} className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all ml-auto">
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
}

export const MyBagManager: React.FC<MyBagManagerProps> = ({ setting, onUpdate, onDiagnose, saveStatus, onManualSave }) => {
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
        const order = [TargetCategory.DRIVER, TargetCategory.FAIRWAY, TargetCategory.UTILITY, TargetCategory.IRON, TargetCategory.WEDGE, TargetCategory.PUTTER];
        return order.indexOf(a.category as TargetCategory) - order.indexOf(b.category as TargetCategory);
    });

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
