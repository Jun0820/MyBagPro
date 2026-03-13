import React, { useState, useRef } from 'react';
import { ArrowLeft, Download, Plus, Save, Trash2, ChevronDown, Share2, Image, Type, Film, Sparkles, ShoppingCart, Layers, Check, Cloud, User } from 'lucide-react';
import { generateBagImage, generateClubTelop } from '../../lib/shareImageGenerator';
import { encodeBagData } from '../../lib/urlData';
import { type ClubSetting, type Club, TargetCategory } from '../../types/golf';
import { BrandModelInput } from '../../components/BrandModelInput';
import { DetailedShaftInput } from '../../components/DetailedShaftInput';
import { cn } from '../../lib/utils';

interface MyGearProps {
    setting: ClubSetting;
    headSpeed: number;
    onUpdate: (setting: ClubSetting) => void;
    onUpdateHeadSpeed: (speed: number) => void;
    onClose: () => void;
    userLoggedIn: boolean;
    onLogout: () => void;
    userName: string;
    onUpdateUserName: (name: string) => void;
    snsLinks: { instagram?: string; x?: string };
    onUpdateSnsLinks: (links: { instagram?: string; x?: string }) => void;
    coverPhoto?: string;
    onUpdateCoverPhoto: (dataUrl: string) => void;
    age: string | null;
    onUpdateAge: (age: string) => void;
    gender: string | null;
    onUpdateGender: (gender: string) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

const ClubRow = ({ entry, onUpdate, onRemove }: { entry: Club, onUpdate: (c: Club) => void, onRemove: () => void }) => {
    const isIron = entry.category === TargetCategory.IRON;
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

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case TargetCategory.DRIVER: return "1W";
            case TargetCategory.FAIRWAY: return "FW";
            case TargetCategory.UTILITY: return "UT";
            case TargetCategory.IRON: return "IRON";
            case TargetCategory.WEDGE: return "WEDGE";
            case TargetCategory.PUTTER: return "PT";
            default: return "CLUB";
        }
    };

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

    return (
        <div className="bg-white p-2 md:p-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1">
                <div className="flex items-center gap-1.5">
                    <span className={cn(getCategoryColor(entry.category), "text-white text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider")}>
                        {getCategoryLabel(entry.category)}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tight">{entry.category}</span>
                </div>
                <button onClick={onRemove} className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 size={10} />
                </button>
            </div>
            <div className="space-y-1.5">
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
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5">
                    {!isPutter && (
                        <div className="md:col-span-8">
                            <DetailedShaftInput
                                model={shaftState.model}
                                weight={shaftState.weight}
                                flex={shaftState.flex}
                                onModelChange={(m) => handleShaftUpdate(m, shaftState.weight, shaftState.flex)}
                                onWeightChange={(w) => handleShaftUpdate(shaftState.model, w, shaftState.flex)}
                                onFlexChange={(f) => handleShaftUpdate(shaftState.model, shaftState.weight, f)}
                                compact={true}
                            />
                        </div>
                    )}
                    {isPutter && (
                        <div className="md:col-span-8">
                            <input
                                type="text"
                                value={entry.shaft}
                                onChange={(e) => onUpdate({ ...entry, shaft: e.target.value })}
                                placeholder="シャフト名"
                                className="w-full px-2 py-1.5 bg-slate-50 text-slate-900 border border-slate-200 rounded text-[10px] outline-none focus:border-golf-500"
                            />
                        </div>
                    )}
                    <div className="md:col-span-4 grid grid-cols-2 gap-1.5">
                        {!isPutter ? (
                            <>
                                <div className="relative">
                                    {!isIron && (
                                        <datalist id={`lofts-${entry.id}`}>
                                            {entry.category === TargetCategory.DRIVER && (
                                                <><option value="8.0°"/><option value="9.0°"/><option value="9.5°"/><option value="10.5°"/><option value="11.5°"/><option value="12.0°"/></>
                                            )}
                                            {entry.category === TargetCategory.FAIRWAY && (
                                                <><option value="13.5°"/><option value="15°(3W)"/><option value="16.5°(4W)"/><option value="18°(5W)"/><option value="21°(7W)"/></>
                                            )}
                                            {entry.category === TargetCategory.UTILITY && (
                                                <><option value="19°(3U)"/><option value="22°(4U)"/><option value="25°(5U)"/><option value="28°(6U)"/></>
                                            )}
                                            {entry.category === TargetCategory.WEDGE && (
                                                <><option value="46°"/><option value="48°"/><option value="50°"/><option value="52°"/><option value="54°"/><option value="56°"/><option value="58°"/><option value="60°"/></>
                                            )}
                                        </datalist>
                                    )}
                                    <input
                                        type="text"
                                        list={!isIron ? `lofts-${entry.id}` : undefined}
                                        placeholder={isIron ? "番手" : "ロフト"}
                                        value={entry.loft}
                                        onChange={(e) => onUpdate({ ...entry, loft: e.target.value })}
                                        className="w-full px-1 py-1.5 bg-slate-50 text-slate-900 border border-slate-200 rounded text-[10px] text-center font-bold outline-none focus:border-golf-500"
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="距離"
                                    value={entry.distance}
                                    onChange={(e) => onUpdate({ ...entry, distance: e.target.value })}
                                    className="w-full px-1.5 py-1.5 bg-golf-50/50 border border-golf-200 text-golf-800 font-bold rounded text-[11px] text-center outline-none focus:border-golf-500"
                                />
                            </>
                        ) : (
                            <div className="col-span-2 text-[9px] text-slate-400 font-bold flex items-center justify-center bg-slate-50 border border-slate-200 rounded italic">
                                Putter: No loft/dist
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MyGear: React.FC<MyGearProps> = ({ 
    setting, headSpeed, onUpdate, onUpdateHeadSpeed, onClose, userLoggedIn, onLogout,
    userName, onUpdateUserName, snsLinks, onUpdateSnsLinks, coverPhoto, onUpdateCoverPhoto,
    age, onUpdateAge, gender, onUpdateGender, saveStatus
}) => {
    const tableRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [addCategory, setAddCategory] = useState('');
    const [saved, setSaved] = useState(false);

    // Batch Preset State
    const [batchPreset, setBatchPreset] = useState({
        brand: '',
        model: '',
        shaftModel: '',
        shaftWeight: '',
        shaftFlex: ''
    });

    const handleAddClub = (category?: string, customModel?: string) => {
        const cat = category || addCategory;
        if (!cat) return;
        onUpdate({
            ...setting,
            clubs: [...setting.clubs, {
                id: Math.random().toString(36),
                category: cat,
                brand: '',
                model: customModel || '',
                shaft: '',
                loft: '',
                distance: ''
            }]
        });
        setAddCategory('');
    };

    const handleBatchAdd = (category: TargetCategory, lofts: string[]) => {
        const shaftString = `${batchPreset.shaftModel} ${batchPreset.shaftWeight ? batchPreset.shaftWeight + 'g' : ''} ${batchPreset.shaftFlex}`.trim();

        const newClubs = lofts.map(loft => ({
            id: Math.random().toString(36).substring(7),
            category: category,
            brand: batchPreset.brand,
            model: batchPreset.model || '',
            shaft: shaftString,
            loft: loft,
            distance: ''
        }));

        onUpdate({
            ...setting,
            clubs: [...setting.clubs, ...newClubs]
        });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            onUpdateCoverPhoto(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const updateClub = (updated: Club) => {
        onUpdate({
            ...setting,
            clubs: setting.clubs.map(c => c.id === updated.id ? updated : c)
        });
    };

    const removeClub = (id: string) => {
        onUpdate({
            ...setting,
            clubs: setting.clubs.filter(c => c.id !== id)
        });
    };


    const categoryOrder = [
        TargetCategory.DRIVER,
        TargetCategory.FAIRWAY,
        TargetCategory.UTILITY,
        TargetCategory.IRON,
        TargetCategory.WEDGE,
        TargetCategory.PUTTER
    ];

    const sortedClubs = [...setting.clubs].sort((a, b) =>
        categoryOrder.indexOf(a.category as TargetCategory) - categoryOrder.indexOf(b.category as TargetCategory)
    );

    const completeness = Math.min(100, Math.round(((setting.clubs.filter(c => c.brand && c.model).length * 10) + (setting.ball ? 10 : 0)) / ((setting.clubs.length * 10) + 10) * 100)) || 0;

    const parseShaftForDisplay = (shaft: string) => {
        const parts = shaft.trim().split(' ');
        if (parts.length >= 3) {
            const flex = parts[parts.length - 1];
            const weight = parts[parts.length - 2];
            const model = parts.slice(0, parts.length - 2).join(' ');
            return { model, weight, flex };
        } else if (parts.length === 2) {
            return { model: parts[0], weight: '', flex: parts[1] };
        }
        return { model: shaft, weight: '', flex: '' };
    };

    const getCatShort = (cat: string) => {
        switch (cat) {
            case TargetCategory.DRIVER: return '1W';
            case TargetCategory.FAIRWAY: return 'FW';
            case TargetCategory.UTILITY: return 'UT';
            case TargetCategory.IRON: return 'IRON';
            case TargetCategory.WEDGE: return 'WDG';
            case TargetCategory.PUTTER: return 'PT';
            default: return '—';
        }
    };

    const getCatBgColor = (cat: string) => {
        switch (cat) {
            case TargetCategory.DRIVER: return 'bg-emerald-500';
            case TargetCategory.FAIRWAY: return 'bg-emerald-600';
            case TargetCategory.UTILITY: return 'bg-teal-500';
            case TargetCategory.IRON: return 'bg-blue-500';
            case TargetCategory.WEDGE: return 'bg-indigo-500';
            case TargetCategory.PUTTER: return 'bg-slate-500';
            default: return 'bg-slate-400';
        }
    };

    // Richer SNS share text with full specs
    const buildShareText = () => {
        let lines: string[] = ['🏌️ My Bag Pro｜マイセッティング', ''];
        sortedClubs.forEach(c => {
            if (!c.brand && !c.model) return;
            const cat = getCatShort(c.category);
            const head = `${c.brand} ${c.model}`.trim();
            const s = parseShaftForDisplay(c.shaft);
            const shaftInfo = s.model ? ` / ${s.model}${s.weight ? ' ' + s.weight : ''}${s.flex ? ' ' + s.flex : ''}` : '';
            const dist = c.distance ? ` (${c.distance})` : '';
            const loft = c.loft ? ` ${c.loft}` : '';
            lines.push(`${cat}${loft}: ${head}${shaftInfo}${dist}`);
        });
        if (setting.ball) lines.push(`⚪ Ball: ${setting.ball}`);
        if (headSpeed) lines.push(`⚡ HS: ${headSpeed} m/s`);
        lines.push('', '▶ あなたもMy Bagを作ろう！');
        return lines.join('\n');
    };

    return (
        <div className="animate-slideIn pb-20 relative">
            <div className="mb-4 md:mb-6 flex items-center justify-between px-2">
                <button 
                    onClick={onClose} 
                    className="flex items-center gap-2 text-white/90 hover:text-white font-bold mix-blend-difference text-sm md:text-base bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm z-50 transition-all active:scale-95"
                >
                    <ArrowLeft size={18} /> SAVE & BACK
                </button>

                <div className="flex items-center gap-3 z-50">
                    {/* Persistence Indicator */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-[10px] font-black tracking-widest text-white/70">
                        {saveStatus === 'saving' ? (
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        ) : saveStatus === 'saved' ? (
                            <Check size={12} className="text-emerald-400" />
                        ) : (
                            <Cloud size={12} className="text-slate-400" />
                        )}
                        <span className="uppercase">
                            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Local'}
                        </span>
                    </div>

                    {/* Login Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/10">
                        <User size={12} className={userLoggedIn ? "text-emerald-400" : "text-slate-400"} />
                        <span className="text-[10px] font-black text-white/90 tracking-wider">
                            {userLoggedIn ? (userName || 'Member') : 'GUEST'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl min-h-[80vh]">
                <div className="bg-trust-navy text-white p-4 md:p-6 relative overflow-hidden">
                    {/* Profile Header */}
                    <div className="absolute inset-0 z-0">
                        {coverPhoto ? (
                             <img src={coverPhoto} className="w-full h-full object-cover opacity-30 blur-sm" alt="Cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-trust-navy opacity-50"></div>
                        )}
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-between">
                        <div className="flex-1 w-full space-y-3">
                            <div>
                                <label className="block text-[8px] font-bold text-golf-400 uppercase tracking-widest mb-1 ml-1">PROFILE NAME</label>
                                <input 
                                    type="text" 
                                    value={userName} 
                                    onChange={e => onUpdateUserName(e.target.value)}
                                    placeholder="名前を入力" 
                                    className="bg-white/10 border border-white/20 text-white font-black text-xl md:text-2xl px-3 py-1.5 rounded-lg w-full max-w-md outline-none focus:border-golf-400 placeholder:text-white/20"
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="flex-1 min-w-[100px]">
                                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Gender</label>
                                    <select 
                                        value={gender || ''} 
                                        onChange={e => onUpdateGender(e.target.value)}
                                        className="bg-white/5 border border-white/10 text-white px-2 py-1.5 rounded-lg w-full outline-none focus:border-golf-400 text-xs appearance-none"
                                    >
                                        <option value="" className="text-slate-900">未選択</option>
                                        <option value="男性" className="text-slate-900">男性</option>
                                        <option value="女性" className="text-slate-900">女性</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[120px]">
                                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Age Group</label>
                                    <select 
                                        value={age || ''} 
                                        onChange={e => onUpdateAge(e.target.value)}
                                        className="bg-white/5 border border-white/10 text-white px-2 py-1.5 rounded-lg w-full outline-none focus:border-golf-400 text-xs appearance-none"
                                    >
                                        <option value="" className="text-slate-900">未選択</option>
                                        {['10代', '20代', '30代', '40代', '50代', '60代', '70代以上'].map(a => (
                                            <option key={a} value={a} className="text-slate-900">{a}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Instagram</label>
                                    <input 
                                        type="text" 
                                        value={snsLinks.instagram || ''} 
                                        onChange={e => onUpdateSnsLinks({ ...snsLinks, instagram: e.target.value })}
                                        placeholder="@username" 
                                        className="bg-white/5 border border-white/10 text-white px-2 py-1.5 rounded-lg w-full outline-none focus:border-purple-400 text-xs"
                                    />
                                </div>
                                <div className="flex-1 min-w-[140px]">
                                    <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">X / Twitter</label>
                                    <input 
                                        type="text" 
                                        value={snsLinks.x || ''} 
                                        onChange={e => onUpdateSnsLinks({ ...snsLinks, x: e.target.value })}
                                        placeholder="@username" 
                                        className="bg-white/5 border border-white/10 text-white px-2 py-1.5 rounded-lg w-full outline-none focus:border-cyan-400 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 border border-dashed border-white/30 flex flex-col items-center justify-center gap-1 hover:bg-white/20 hover:border-white/50 transition-all group overflow-hidden"
                            >
                                {coverPhoto ? (
                                    <img src={coverPhoto} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <>
                                        <Image size={16} className="text-white/40 group-hover:text-white group-hover:scale-110 transition-transform" />
                                        <span className="text-[8px] text-white/40 font-bold uppercase">背景写真</span>
                                    </>
                                )}
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                        </div>
                    </div>
                </div>

                <div ref={tableRef} className="bg-white">
                    <div className="bg-trust-navy px-4 py-3 flex items-center justify-between border-t border-white/5">
                        <div className="text-white font-eng font-black text-lg tracking-tighter uppercase">BAG LIST</div>
                        <div className="flex items-center gap-3 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                            <div className="text-right">
                                <div className="text-[8px] font-bold text-golf-400 uppercase tracking-widest text-left">PROGRESS</div>
                                <div className="text-lg font-eng font-bold leading-none">{completeness}<span className="text-[10px] text-slate-500">%</span></div>
                            </div>
                        </div>
                    </div>

                    {/* ===== SETTING OVERVIEW TABLE — ぱっと見でわかる一覧 ===== */}
                    {sortedClubs.length > 0 && (
                        <div className="bg-white border-b border-slate-200">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-[11px]">
                                            <th className="py-3 px-3 md:px-4 text-left">番手</th>
                                            <th className="py-3 px-2 md:px-4 text-left">ヘッド</th>
                                            <th className="py-3 px-2 md:px-4 text-left hidden md:table-cell">シャフト</th>
                                            <th className="py-3 px-2 text-center">重さ</th>
                                            <th className="py-3 px-2 text-center">硬さ</th>
                                            <th className="py-3 px-2 md:px-4 text-center text-golf-600">キャリー</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {sortedClubs.map((c, i) => {
                                        const s = parseShaftForDisplay(c.shaft);
                                        const head = `${c.brand} ${c.model}`.trim() || '—';
                                        const catLabel = getCatShort(c.category);
                                        const loftLabel = c.loft ? ` ${c.loft}` : '';
                                        return (
                                            <tr key={c.id} className={cn("border-b border-slate-100 hover:bg-slate-50/70 transition-colors", i % 2 === 1 && "bg-slate-50/30")}>
                                                <td className="py-2.5 px-3 md:px-4 whitespace-nowrap">
                                                    <span className={cn("inline-block text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded", getCatBgColor(c.category))}>
                                                        {catLabel}{loftLabel}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-2 md:px-4 font-bold text-brand-dark whitespace-nowrap max-w-[120px] md:max-w-none truncate">{head}</td>
                                                <td className="py-2.5 px-2 md:px-4 text-slate-600 whitespace-nowrap hidden md:table-cell">{s.model || '—'}</td>
                                                <td className="py-2.5 px-2 text-center text-slate-600 font-mono">{s.weight || '—'}</td>
                                                <td className="py-2.5 px-2 text-center">
                                                    {s.flex ? (
                                                        <span className={cn("inline-block text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                            s.flex === 'X' || s.flex === 'TX' ? 'bg-red-100 text-red-600' :
                                                            s.flex === 'S' ? 'bg-blue-100 text-blue-600' :
                                                            s.flex === 'SR' ? 'bg-cyan-100 text-cyan-600' :
                                                            s.flex === 'R' ? 'bg-green-100 text-green-600' :
                                                            s.flex === 'A' || s.flex === 'L' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-slate-100 text-slate-600'
                                                        )}>
                                                            {s.flex}
                                                        </span>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="py-2.5 px-2 md:px-4 text-center font-bold text-golf-700">{c.distance || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Ball row */}
                                    {setting.ball && (
                                        <tr className="border-b border-slate-100 bg-amber-50/30">
                                            <td className="py-2.5 px-3 md:px-4">
                                                <span className="inline-block bg-amber-400 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded">⚪</span>
                                            </td>
                                            <td className="py-2.5 px-2 md:px-4 font-bold text-brand-dark" colSpan={5}>{setting.ball}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* HS badge */}
                        {headSpeed > 0 && (
                            <div className="px-4 py-2 flex items-center gap-2 border-t border-slate-100 bg-slate-50/50">
                                <span className="text-xs font-bold text-golf-600">⚡ HEAD SPEED</span>
                                <span className="font-eng font-black text-golf-700">{headSpeed}</span>
                                <span className="text-[10px] text-slate-400">m/s</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== SHARE PANEL — 3テンプレート ===== */}
                {sortedClubs.length > 0 && (
                    <div className="bg-gradient-to-b from-slate-50 to-white p-5 md:p-8 border-b border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <Share2 size={20} className="text-trust-navy" />
                            <h3 className="font-bold text-trust-navy text-lg">SNSでシェア</h3>
                            <span className="text-[10px] bg-golf-100 text-golf-700 px-2 py-0.5 rounded-full font-bold">3テンプレート</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* ① テキスト投稿 */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#1DA1F2]/10 flex items-center justify-center">
                                        <Type size={18} className="text-[#1DA1F2]" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-trust-navy">テキスト投稿</div>
                                        <div className="text-[10px] text-slate-400">X / Instagram</div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">セッティングをテキストで投稿。サイトリンク＋ハッシュタグ付き。</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const shareText = buildShareText();
                                            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent('https://mybagpro.jp')}&hashtags=${encodeURIComponent('MyBagPro,ゴルフ')}`;
                                            window.open(url, '_blank', 'width=550,height=420');
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#1DA1F2] text-white rounded-xl font-bold text-xs hover:bg-[#1a8cd8] transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                        Xに投稿
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const shareText = buildShareText();
                                            try {
                                                await navigator.clipboard.writeText(`${shareText}\nhttps://mybagpro.jp\n#MyBagPro #ゴルフ`);
                                                alert('コピーしました！Instagramに貼り付けてください 📱');
                                            } catch { alert('コピーに失敗しました'); }
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] text-white rounded-xl font-bold text-xs hover:opacity-90 transition-opacity"
                                    >
                                        IGコピー
                                    </button>
                                </div>
                            </div>

                            {/* ② 番手表まるごと画像 */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-brand-dark/10 flex items-center justify-center">
                                        <Image size={18} className="text-trust-navy" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-trust-navy">番手表画像</div>
                                        <div className="text-[10px] text-slate-400">1080×1350 / ダーク</div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">全クラブのスペック一覧をロゴ付きダーク画像で出力。動画のサムネやSNS投稿に。</p>
                                <button
                                    onClick={async () => {
                                        try {
                                            const dataUrl = await generateBagImage(sortedClubs, setting.ball, headSpeed);
                                            const link = document.createElement('a');
                                            link.download = 'my-bag-setting.png';
                                            link.href = dataUrl;
                                            link.click();
                                        } catch (e) {
                                            console.error(e);
                                            alert('画像生成に失敗しました');
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-trust-navy text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
                                >
                                    <Download size={14} /> 番手表画像をダウンロード
                                </button>
                            </div>

                            {/* ③ 番手別テロップ画像 */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-golf-500/10 flex items-center justify-center">
                                        <Film size={18} className="text-golf-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-trust-navy">テロップ画像</div>
                                        <div className="text-[10px] text-slate-400">1920×200 / 動画編集用</div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">番手ごとのスペックをテロップ風画像で出力。スイング動画に重ねて使えます。</p>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto mb-3">
                                    {sortedClubs.filter(c => c.brand || c.model).map(c => {
                                        const catLabel = getCatShort(c.category);
                                        const loft = c.loft ? ` ${c.loft}` : '';
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    const dataUrl = generateClubTelop(c);
                                                    const link = document.createElement('a');
                                                    link.download = `telop-${catLabel}${c.loft || ''}.png`;
                                                    link.href = dataUrl;
                                                    link.click();
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-xs"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={cn("text-white text-[9px] font-black px-1.5 py-0.5 rounded", getCatBgColor(c.category))}>{catLabel}{loft}</span>
                                                    <span className="font-bold text-trust-navy truncate max-w-[140px]">{c.brand} {c.model}</span>
                                                </span>
                                                <Download size={12} className="text-slate-400 shrink-0" />
                                            </button>
                                        );
                                    })}
                                </div>
                                {sortedClubs.filter(c => c.brand || c.model).length > 1 && (
                                    <button
                                        onClick={() => {
                                            sortedClubs.filter(c => c.brand || c.model).forEach((c, i) => {
                                                setTimeout(() => {
                                                    const catLabel = getCatShort(c.category);
                                                    const dataUrl = generateClubTelop(c);
                                                    const link = document.createElement('a');
                                                    link.download = `telop-${catLabel}${c.loft || ''}.png`;
                                                    link.href = dataUrl;
                                                    link.click();
                                                }, i * 300);
                                            });
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-golf-600 text-white rounded-xl font-bold text-xs hover:bg-golf-700 transition-colors"
                                    >
                                        <Download size={14} /> 全テロップを一括ダウンロード
                                    </button>
                                )}
                            </div>
                        </div>
                        </div>
                    )}
                </div>

                <div className="p-4 md:p-6 bg-slate-50">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* クラブ一覧 & 編集部 */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 md:p-4">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-golf-500 rounded-full"></div>
                                    <h3 className="font-bold text-sm text-trust-navy uppercase tracking-tight">CLUB MANAGEMENT</h3>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">登録済み: {sortedClubs.length}本</div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                                {sortedClubs.map(entry => (
                                    <ClubRow key={entry.id} entry={entry} onUpdate={updateClub} onRemove={() => removeClub(entry.id)} />
                                ))}
                                {sortedClubs.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-300">
                                        <p className="text-xs font-bold">登録クラブがありません</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-4 pt-3 border-t border-slate-100">
                                <div className="md:col-span-8 relative">
                                    <select
                                        value={addCategory}
                                        onChange={e => setAddCategory(e.target.value)}
                                        className="w-full h-10 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-lg font-bold text-trust-navy outline-none appearance-none text-xs"
                                    >
                                        <option value="">個別追加する番手</option>
                                        {Object.values(TargetCategory).filter(c => c !== TargetCategory.BALL).map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddClub()}
                                    disabled={!addCategory}
                                    className="md:col-span-4 h-10 bg-slate-900 text-white font-bold rounded-lg hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-xs"
                                >
                                    <Plus size={16} /> 追加する
                                </button>
                            </div>
                        </div>

                        {/* クラブ一括追加 - 事前入力 */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                                <Plus size={14} className="text-golf-600" />
                                <h3 className="font-bold text-xs text-trust-navy">番手一括追加（スペック事前入力）</h3>
                            </div>
                            <div className="p-3 md:p-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">共通ブランド・モデル名</div>
                                        <BrandModelInput
                                            brand={batchPreset.brand}
                                            model={batchPreset.model}
                                            category="ALL"
                                            onBrandChange={(b) => setBatchPreset({ ...batchPreset, brand: b })}
                                            onModelChange={(m) => setBatchPreset({ ...batchPreset, model: m })}
                                            bgClass="bg-slate-50 border-slate-100"
                                            placeholderModel="モデル名 (例: Qi10 / P790)"
                                            compact={true}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">共通シャフトスペック</div>
                                        <DetailedShaftInput
                                            model={batchPreset.shaftModel}
                                            weight={batchPreset.shaftWeight}
                                            flex={batchPreset.shaftFlex}
                                            onModelChange={(m) => setBatchPreset({ ...batchPreset, shaftModel: m })}
                                            onWeightChange={(w) => setBatchPreset({ ...batchPreset, shaftWeight: w })}
                                            onFlexChange={(f) => setBatchPreset({ ...batchPreset, shaftFlex: f })}
                                            compact={true}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-4 pt-2">
                                    {/* Woods Section */}
                                    <div className="space-y-2">
                                        <div className="text-[8px] font-black text-emerald-600 tracking-widest uppercase ml-1">Woods & UT</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                onClick={() => handleBatchAdd(TargetCategory.DRIVER, ['1W'])}
                                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition-all flex items-center gap-1"
                                            >
                                                1W (Dr)
                                            </button>
                                            <button 
                                                onClick={() => handleBatchAdd(TargetCategory.FAIRWAY, ['3W', '5W'])}
                                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition-all flex items-center gap-1"
                                            >
                                                3W・5W
                                            </button>
                                            <button 
                                                onClick={() => handleBatchAdd(TargetCategory.UTILITY, ['4U', '5U'])}
                                                className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-[10px] hover:bg-teal-700 transition-all flex items-center gap-1"
                                            >
                                                4U・5U
                                            </button>
                                        </div>
                                    </div>

                                    {/* Irons Section */}
                                    <div className="space-y-2">
                                        <div className="text-[8px] font-black text-blue-600 tracking-widest uppercase ml-1">Irons</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                onClick={() => handleBatchAdd(TargetCategory.IRON, ['5I', '6I', '7I', '8I', '9I', 'PW'])}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] hover:bg-blue-700 transition-all"
                                            >
                                                5-PW (6本)
                                            </button>
                                            <button 
                                                onClick={() => handleBatchAdd(TargetCategory.IRON, ['6I', '7I', '8I', '9I', 'PW', 'AW'])}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] hover:bg-blue-700 transition-all"
                                            >
                                                6-AW (6本)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Wedges Section */}
                                    <div className="space-y-2">
                                        <div className="text-[8px] font-black text-indigo-600 tracking-widest uppercase ml-1">Wedges</div>
                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                onClick={() => handleBatchAdd(TargetCategory.WEDGE, ['50°', '54°', '58°'])}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[10px] hover:bg-indigo-700 transition-all"
                                            >
                                                50・54・58
                                            </button>
                                            <button 
                                                onClick={() => handleBatchAdd(TargetCategory.WEDGE, ['52°', '58°'])}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[10px] hover:bg-indigo-700 transition-all"
                                            >
                                                52・58
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[8px] text-slate-400 text-center italic">※事前入力した内容が全ての番手に反映されます。</p>
                            </div>
                        </div>
                        {/* SHARE SECTION - Moved up and styled */}
                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-4 md:p-5 text-center mt-2 shadow-inner">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Share2 size={14} className="text-trust-navy" />
                                <h3 className="font-eng font-black text-sm tracking-tight text-trust-navy uppercase">SHARE MY BAG</h3>
                            </div>
                            <p className="text-slate-500 text-[9px] mb-4">セッティングをSNSで共有・動画編集に活用</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 max-w-2xl mx-auto">
                                <button
                                    onClick={async () => {
                                        try {
                                            const dataUrl = await generateBagImage(sortedClubs, setting.ball, headSpeed, userName, coverPhoto);
                                            const link = document.createElement('a');
                                            link.download = `${userName}-bag.png`;
                                            link.href = dataUrl;
                                            link.click();
                                        } catch (e) { alert('生成に失敗しました'); }
                                    }}
                                    className="flex items-center justify-between gap-3 p-3 bg-gradient-to-br from-slate-800 to-trust-navy text-white rounded-xl hover:shadow-md transition-all group border border-white/5"
                                >
                                    <div className="text-left">
                                        <div className="text-[7px] font-bold text-golf-400 uppercase mb-0.5">INSTAGRAM</div>
                                        <div className="text-[10px] font-bold">フィード投稿用</div>
                                    </div>
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Download size={14} />
                                    </div>
                                </button>

                                <button
                                    onClick={async () => {
                                        try {
                                            const dataUrl = await generateBagImage(sortedClubs, '', 0, userName, undefined, { transparent: true });
                                            const link = document.createElement('a');
                                            link.download = `${userName}-overlay.png`;
                                            link.href = dataUrl;
                                            link.click();
                                        } catch (e) { alert('生成に失敗しました'); }
                                    }}
                                    className="flex items-center justify-between gap-3 p-3 bg-gradient-to-br from-emerald-600 to-golf-700 text-white rounded-xl hover:shadow-md transition-all group border border-white/5"
                                >
                                    <div className="text-left">
                                        <div className="text-[7px] font-bold text-emerald-100 uppercase mb-0.5">REELS / VIDEO</div>
                                        <div className="text-[10px] font-bold">動画オーバーレイ用</div>
                                    </div>
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Layers size={14} />
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        const encoded = encodeBagData(userName, snsLinks, setting, headSpeed);
                                        const shareText = buildShareText();
                                        const shareUrl = `${window.location.origin}${window.location.pathname}#/bag?d=${encoded}`;
                                        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                                        window.open(twitterUrl, '_blank', 'width=550,height=420');
                                    }}
                                    className="flex items-center justify-between gap-3 p-3 bg-[#1DA1F2] text-white rounded-xl hover:shadow-md transition-all group border border-white/5"
                                >
                                    <div className="text-left">
                                        <div className="text-[7px] font-bold text-white/70 uppercase mb-0.5">X (TWITTER)</div>
                                        <div className="text-[10px] font-bold">Xでシェアする</div>
                                    </div>
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        const exportData = {
                                            userName,
                                            age,
                                            gender,
                                            snsLinks,
                                            headSpeed,
                                            setting,
                                            exportedAt: new Date().toISOString(),
                                            app: "MyBagPro",
                                            role: "Operator-Only"
                                        };
                                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.download = `operator-export-${userName || 'user'}-${new Date().getTime()}.json`;
                                        link.href = url;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="flex items-center justify-between gap-3 p-3 bg-slate-900 text-white/50 rounded-xl hover:text-white transition-all group border border-white/5 grayscale hover:grayscale-0"
                                >
                                    <div className="text-left">
                                        <div className="text-[7px] font-bold text-white/30 uppercase mb-0.5">ADMIN ONLY</div>
                                        <div className="text-[10px] font-bold italic">運営用データ出力(JSON)</div>
                                    </div>
                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                        <Download size={14} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {/* ボールセクション */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 text-[10px]">⚪️</div>
                                    <div className="flex-1">
                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">BALL</div>
                                        <BrandModelInput
                                            brand={setting.ball.split(' ')[0] || ''}
                                            model={setting.ball.includes(' ') ? setting.ball.substring(setting.ball.indexOf(' ') + 1) : ''}
                                            category="BALL"
                                            onBrandChange={b => onUpdate({ ...setting, ball: b })}
                                            onModelChange={m => {
                                                const currentBrand = setting.ball.split(' ')[0] || '';
                                                onUpdate({ ...setting, ball: `${currentBrand} ${m}`.trim() });
                                            }}
                                            bgClass="bg-transparent border-slate-100"
                                            placeholderModel="ボール名"
                                            compact={true}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-50">
                                    <button
                                        onClick={() => window.location.href = '/ball-diagnosis'}
                                        className="flex-1 py-1 px-2 bg-brand-accent/5 hover:bg-brand-accent/10 text-brand-dark rounded text-[9px] font-bold transition-all flex items-center justify-center gap-1 border border-brand-accent/10"
                                    >
                                        <Sparkles size={10} className="text-brand-accent" /> AI診断
                                    </button>
                                    {setting.ball && setting.ball.length > 2 && (
                                        <a
                                            href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(setting.ball + " ゴルフボール")}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="flex-1 py-1 px-2 bg-[#FF9900]/10 hover:bg-[#FF9900]/20 text-[#CC7A00] rounded text-[9px] font-bold transition-all flex items-center justify-center gap-1 border border-[#FF9900]/20"
                                        >
                                            <ShoppingCart size={10} /> Amazon
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* ヘッドスピードセクション */}
                            <div className="bg-gradient-to-br from-golf-50/50 to-emerald-50/50 p-3 rounded-xl border border-golf-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-golf-600 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm">⚡️</div>
                                    <div>
                                        <div className="text-[8px] font-bold text-golf-600 uppercase tracking-wider leading-none">HEAD SPEED</div>
                                        <div className="text-[9px] text-slate-500">平均 {headSpeed}m/s</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range" min="30" max="55" value={headSpeed}
                                        onChange={e => onUpdateHeadSpeed(parseInt(e.target.value))}
                                        className="flex-1 h-1.5 bg-golf-200 rounded-full appearance-none cursor-pointer accent-golf-600"
                                    />
                                    <div className="bg-white px-2 py-0.5 rounded border border-golf-200 text-center min-w-[50px]">
                                        <span className="text-sm font-black text-golf-700">{headSpeed}</span>
                                        <span className="text-[8px] text-slate-400 ml-0.5">m/s</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4 pb-10">
                            <button
                                onClick={() => {
                                    setSaved(true);
                                    setTimeout(() => { setSaved(false); onClose(); }, 800);
                                }}
                                className={`w-full md:w-auto flex items-center justify-center gap-2 px-12 py-3 font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all ${
                                    saved ? 'bg-golf-600 text-white' : 'bg-trust-navy text-white hover:bg-slate-800 shadow-slate-900/20'
                                }`}
                            >
                                <Save size={16} />
                                <span className="text-xs">{saved ? '保存しました' : 'セッティングを確定して戻る'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {userLoggedIn && (
                <div className="fixed bottom-6 left-6 z-50">
                    <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-400 rounded-full text-xs font-bold hover:bg-red-100 transition-colors">
                        ログアウト
                    </button>
                </div>
            )}
        </div>
    );
};
