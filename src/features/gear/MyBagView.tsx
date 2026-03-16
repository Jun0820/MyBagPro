import React from 'react';
import { Instagram, Send, User, Globe, Share2, Download, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';
import { type ClubSetting, TargetCategory } from '../../types/golf';
import { generateBagImage } from '../../lib/shareImageGenerator';

interface MyBagViewProps {
    setting: ClubSetting;
    headSpeed: number;
    userName: string;
    snsLinks: { instagram?: string; x?: string };
    coverPhoto?: string;
    isPublic: boolean;
    onUpdateIsPublic: (v: boolean) => void;
    userId?: string;
    bestScore?: number;
    averageScore?: number;
}

export const MyBagView: React.FC<MyBagViewProps> = ({
    setting, headSpeed, userName, snsLinks, coverPhoto, isPublic, onUpdateIsPublic, userId,
    bestScore, averageScore
}) => {
    const sortedClubs = [...setting.clubs].sort((a, b) => {
        const order = [
            TargetCategory.DRIVER,
            TargetCategory.FAIRWAY,
            TargetCategory.UTILITY,
            TargetCategory.IRON,
            TargetCategory.WEDGE,
            TargetCategory.PUTTER
        ];
        return order.indexOf(a.category as TargetCategory) - order.indexOf(b.category as TargetCategory);
    });

    const getCatShort = (cat: string) => {
        switch (cat) {
            case TargetCategory.DRIVER: return '1W';
            case TargetCategory.FAIRWAY: return 'FW';
            case TargetCategory.UTILITY: return 'UT';
            case TargetCategory.IRON: return 'IRN';
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

    const shareUrl = userId ? `${window.location.origin}${window.location.pathname}#/bag?id=${userId}` : '';

    const handleCopyUrl = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            alert('共有URLをコピーしました！');
        }
    };

    return (
        <div className="animate-fadeIn space-y-6 pb-12">
            {/* Header / Profile Card */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-slate-100">
                <div className="relative h-56 md:h-72 bg-trust-navy overflow-hidden">
                    {coverPhoto ? (
                        <img src={coverPhoto} className="w-full h-full object-cover opacity-60" alt="Cover" />
                    ) : (
                        <img 
                            src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop" 
                            className="w-full h-full object-cover opacity-20" 
                            alt="Default Cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-trust-navy via-transparent to-transparent"></div>
                    
                    <div className="absolute top-4 right-4 z-20">
                         <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border text-[10px] font-bold uppercase tracking-wider",
                            isPublic ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-slate-800/40 text-slate-400 border-white/10"
                        )}>
                            <Globe size={12} />
                            {isPublic ? 'PUBLIC ON' : 'PRIVATE'}
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 md:left-8 right-6 md:right-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white shadow-2xl border-4 border-white flex items-center justify-center overflow-hidden">
                                <User size={40} className="text-slate-200" />
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
                                    {userName || 'Anonymous'}<span className="text-golf-400">'</span>s BAG
                                </h2>
                                <div className="flex gap-3 mt-2">
                                    {snsLinks.instagram && <div className="text-white/80 text-xs font-bold flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg"><Instagram size={12} /> {snsLinks.instagram}</div>}
                                    {snsLinks.x && <div className="text-white/80 text-xs font-bold flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-lg"><Send size={12} /> {snsLinks.x}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions / Diagnosis Area */}
                <div className="p-4 md:p-6 bg-slate-900 flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => window.location.hash = '#/diagnosis/total_setting'}
                        className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-br from-golf-500 to-golf-700 text-white rounded-2xl shadow-xl shadow-golf-500/20 hover:scale-[1.02] transition-all font-black text-sm tracking-widest uppercase"
                    >
                        <Brain size={20} /> クラブセッティング診断を開始
                    </button>
                    <button 
                        onClick={() => window.location.hash = '#/ball-diagnosis'}
                        className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-br from-cyan-500 to-cyan-700 text-white rounded-2xl shadow-xl shadow-cyan-500/20 hover:scale-[1.02] transition-all font-black text-sm tracking-widest uppercase"
                    >
                        ⚪ ボール診断を開始
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
                    <div className="bg-white p-6 text-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 align-middle">Head Speed</div>
                        <div className="text-2xl font-eng font-black text-trust-navy leading-none">{headSpeed} <span className="text-[10px] text-slate-400 font-bold ml-1">M/S</span></div>
                    </div>
                    <div className="bg-white p-6 text-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Clubs Count</div>
                        <div className="text-2xl font-eng font-black text-trust-navy leading-none">{setting.clubs.length} <span className="text-[10px] text-slate-400 font-bold ml-1">PCS</span></div>
                    </div>
                    <div className="bg-white p-6 text-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Best Score</div>
                        <div className="text-2xl font-eng font-black text-golf-600 leading-none">{bestScore || '—'}</div>
                    </div>
                    <div className="bg-white p-6 text-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Average Score</div>
                        <div className="text-2xl font-eng font-black text-trust-navy leading-none">{averageScore || '—'}</div>
                    </div>
                </div>

                {/* Sharing Tools (Visible to owner) */}
                {userId && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex-1 w-full">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">Share this view</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleCopyUrl}
                                        disabled={!isPublic}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all",
                                            isPublic ? "bg-white border border-slate-200 text-trust-navy hover:bg-slate-100" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                                        )}
                                    >
                                        <Share2 size={14} /> URLを取得
                                    </button>
                                    <button 
                                         onClick={async () => {
                                            const dataUrl = await generateBagImage(sortedClubs, setting.ball, headSpeed, userName, coverPhoto);
                                            const link = document.createElement('a');
                                            link.download = `${userName}-bag.png`;
                                            link.href = dataUrl;
                                            link.click();
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-trust-navy text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all"
                                    >
                                        <Download size={14} /> 画像で保存
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 w-full sm:w-auto">
                                <div className="space-y-1 flex-1 sm:flex-none">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">Privacy</div>
                                    <div className="text-xs font-bold text-trust-navy">{isPublic ? '公開中' : '非公開'}</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={isPublic}
                                        onChange={(e) => onUpdateIsPublic(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Club List Table (View Mode) */}
                <div className="p-0 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-widest text-[11px] border-b border-slate-100">
                                <th className="py-4 px-6 text-left">Category</th>
                                <th className="py-4 px-6 text-left">Model / Spec</th>
                                <th className="py-4 px-6 text-right">Carry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedClubs.map((c, i) => (
                                <tr key={c.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", i % 2 === 1 && "bg-slate-50/20")}>
                                    <td className="py-5 px-6 whitespace-nowrap">
                                        <span className={cn("inline-block text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm uppercase", getCatBgColor(c.category))}>
                                            {c.number || getCatShort(c.category)}
                                        </span>
                                        {c.loft && (
                                            <span className="ml-2 text-[10px] font-bold text-slate-400">
                                                {c.loft}°
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="font-bold text-trust-navy text-lg md:text-xl tracking-tight leading-tight">
                                            {c.brand} {c.model}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium mt-1">
                                            {c.shaft || '—'}
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <div className="font-eng font-black text-2xl text-golf-600 leading-none">
                                            {c.distance || '—'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
