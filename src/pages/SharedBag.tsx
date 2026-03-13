import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { decodeBagData } from '../lib/urlData';
import { type ClubSetting, TargetCategory } from '../types/golf';
import { ArrowLeft, Instagram, Send, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export const SharedBag = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [data, setData] = useState<{
        name: string,
        sns: { instagram?: string, x?: string },
        setting: ClubSetting,
        headSpeed: number
    } | null>(null);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const d = query.get('d');
        if (d) {
            const decoded = decodeBagData(d);
            if (decoded) {
                setData(decoded);
            }
        }
    }, [location.search]);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                <div className="animate-spin mb-4">⛳️</div>
                <p>セッティングを読み込んでいます...</p>
            </div>
        );
    }

    const { name, sns, setting, headSpeed } = data;

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

    return (
        <div className="animate-fadeIn pb-20 max-w-4xl mx-auto">
            <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 text-slate-500 hover:text-trust-navy font-bold mb-8 transition-colors"
            >
                <ArrowLeft size={18} /> TOPへ戻る
            </button>

            <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-100">
                {/* Header Section */}
                <div className="relative bg-trust-navy text-white p-8 md:p-12 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop" 
                            className="w-full h-full object-cover opacity-20" 
                            alt="Golf Background"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-trust-navy via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-golf-400 font-bold tracking-widest text-[10px] uppercase mb-4">
                            <ShieldCheck size={14} /> Official My Bag Pro Profile
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 uppercase">
                            {name}<span className="text-golf-400">'</span>s SETTING
                        </h1>
                        
                        <div className="flex flex-wrap gap-4">
                            {sns.instagram && (
                                <a 
                                    href={`https://instagram.com/${sns.instagram.replace('@', '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/10 transition-all text-sm font-bold"
                                >
                                    <Instagram size={16} /> {sns.instagram}
                                </a>
                            )}
                            {sns.x && (
                                <a 
                                    href={`https://x.com/${sns.x.replace('@', '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/10 transition-all text-sm font-bold"
                                >
                                    <Send size={16} /> {sns.x}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 border-b border-slate-100">
                     <div className="bg-white p-6 text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Head Speed</div>
                        <div className="text-3xl font-eng font-black text-trust-navy leading-none">{headSpeed} <span className="text-xs text-slate-400 font-bold">m/s</span></div>
                    </div>
                    <div className="bg-white p-6 text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Clubs</div>
                        <div className="text-3xl font-eng font-black text-trust-navy leading-none">{setting.clubs.length} <span className="text-xs text-slate-400 font-bold">pcs</span></div>
                    </div>
                    <div className="bg-white p-6 text-center col-span-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Ball</div>
                        <div className="text-xl font-bold text-trust-navy leading-none truncate px-4">{setting.ball || '—'}</div>
                    </div>
                </div>

                {/* Club List Table */}
                <div className="p-0 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-100">
                                <th className="py-4 px-6 text-left">Category</th>
                                <th className="py-4 px-6 text-left">Model / Spec</th>
                                <th className="py-4 px-6 text-right">Carry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedClubs.map((c, i) => {
                                const catLabel = getCatShort(c.category);
                                const loftLabel = c.loft ? ` ${c.loft}` : '';
                                return (
                                    <tr key={i} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", i % 2 === 1 && "bg-slate-50/20")}>
                                        <td className="py-5 px-6 whitespace-nowrap">
                                            <span className={cn("inline-block text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm", getCatBgColor(c.category))}>
                                                {catLabel}{loftLabel}
                                            </span>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer CTA */}
                <div className="bg-slate-50 p-10 text-center">
                    <p className="text-slate-400 text-sm mb-6 font-medium">あなたも最新のAI診断で最適なギアを見つけませんか？</p>
                    <button 
                        onClick={() => navigate('/ball-diagnosis')} 
                        className="bg-trust-navy text-white px-8 py-4 rounded-full font-black tracking-tighter hover:bg-slate-800 transition-all hover:scale-105 shadow-xl shadow-trust-navy/20 flex items-center gap-3 mx-auto"
                    >
                        AIゴルフ診断をはじめる <ExternalLink size={20} />
                    </button>
                    <div className="mt-8">
                        <span className="font-eng font-black text-xl tracking-tighter text-slate-200">MY BAG PRO</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
