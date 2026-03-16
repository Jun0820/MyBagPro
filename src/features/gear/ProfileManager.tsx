import React, { useRef } from 'react';
import { User, Image, Instagram, Send, Globe, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const BACKGROUND_TEMPLATES = [
    { id: 'default', name: 'Classic Green', url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070' },
    { id: 'links', name: 'Elite Links', url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070' },
    { id: 'sunset', name: 'Sunset Play', url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=2070' },
    { id: 'grass', name: 'Lush Field', url: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=2070' },
    { id: 'club', name: 'Premium Club', url: 'https://images.unsplash.com/photo-1537243916050-de57e84126fa?q=80&w=2070' },
    { id: 'mist', name: 'Morning Mist', url: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=2070' },
    { id: 'dark', name: 'Midnight', url: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=2070' },
    { id: 'sand', name: 'Bunker', url: 'https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=2070' },
    { id: 'abstract', name: 'Minimalist', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2070' },
];

interface ProfileManagerProps {
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
    headSpeed: number;
    onUpdateHeadSpeed: (speed: number) => void;
    isPublic: boolean;
    onUpdateIsPublic: (isPublic: boolean) => void;
    birthdate?: string;
    onUpdateBirthdate: (date: string) => void;
    golfHistory: any | null;
    onUpdateGolfHistory: (history: string) => void;
    bestScore?: number;
    onUpdateBestScore: (score: number | undefined) => void;
    averageScore?: number;
    onUpdateAverageScore: (score: number | undefined) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
    userName, onUpdateUserName, snsLinks, onUpdateSnsLinks, 
    coverPhoto, onUpdateCoverPhoto, age, onUpdateAge, gender, onUpdateGender,
    headSpeed, onUpdateHeadSpeed, isPublic, onUpdateIsPublic,
    birthdate, onUpdateBirthdate, golfHistory, onUpdateGolfHistory,
    bestScore, onUpdateBestScore, averageScore, onUpdateAverageScore
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            onUpdateCoverPhoto(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Header / Avatar Section */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-slate-100">
                <div className="relative h-48 md:h-56 bg-trust-navy overflow-hidden">
                    {coverPhoto ? (
                         <img src={coverPhoto} className="w-full h-full object-cover opacity-40 blur-[1px]" alt="Cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-trust-navy opacity-50"></div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center gap-4">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-6 py-2.5 text-white hover:bg-white/20 transition-all active:scale-95 group flex items-center gap-2"
                        >
                            <Image size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold">写真をアップロード</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                    </div>
                </div>

                {/* Template Selector */}
                <div className="px-6 md:px-10 py-4 bg-slate-50 border-b border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">背景テンプレートを選択</div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {BACKGROUND_TEMPLATES.map(tmpl => (
                            <button
                                key={tmpl.id}
                                onClick={() => onUpdateCoverPhoto(tmpl.url)}
                                className={cn(
                                    "relative min-w-[100px] h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                                    coverPhoto === tmpl.url ? "border-golf-500 ring-2 ring-golf-500/20 scale-95" : "border-transparent hover:border-slate-300"
                                )}
                            >
                                <img src={tmpl.url} className="w-full h-full object-cover opacity-80" alt={tmpl.name} />
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                    {coverPhoto === tmpl.url && <div className="bg-golf-500 rounded-full p-1 shadow-lg text-white"><Check size={12} strokeWidth={4} /></div>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 md:px-10 pb-10 -mt-10 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6 md:items-end">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] bg-white shadow-2xl border-4 border-white flex items-center justify-center overflow-hidden">
                            {coverPhoto ? (
                                <img src={coverPhoto} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <User size={48} className="text-slate-200" />
                            )}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Profile Name</label>
                                <input 
                                    type="text" 
                                    value={userName} 
                                    onChange={e => onUpdateUserName(e.target.value)}
                                    placeholder="名前を設定..." 
                                    className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xl font-bold text-trust-navy outline-none focus:border-golf-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
                        {/* Left Side: Basic Info */}
                        <div className="space-y-6">
                            <h4 className="font-black text-xs text-trust-navy uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Basic Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Gender</label>
                                    <select 
                                        value={gender || ''} 
                                        onChange={e => onUpdateGender(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500 appearance-none"
                                    >
                                        <option value="">未選択</option>
                                        <option value="男性">男性</option>
                                        <option value="女性">女性</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Age</label>
                                    <select 
                                        value={age || ''} 
                                        onChange={e => onUpdateAge(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500 appearance-none"
                                    >
                                        <option value="">未選択</option>
                                        {['10代', '20代', '30代', '40代', '50代', '60代', '70代以上'].map(a => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Best Score</label>
                                    <input 
                                        type="number" 
                                        placeholder="78"
                                        value={bestScore || ''} 
                                        onChange={e => onUpdateBestScore(e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Average Score</label>
                                    <input 
                                        type="number" 
                                        placeholder="92"
                                        value={averageScore || ''} 
                                        onChange={e => onUpdateAverageScore(e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Birthdate</label>
                                    <input 
                                        type="date" 
                                        value={birthdate || ''} 
                                        onChange={e => onUpdateBirthdate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Golf History</label>
                                    <select 
                                        value={golfHistory || ''} 
                                        onChange={e => onUpdateGolfHistory(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500 appearance-none"
                                    >
                                        <option value="">未選択</option>
                                        <option value="1年未満">1年未満</option>
                                        <option value="1〜3年">1〜3年</option>
                                        <option value="3〜5年">3〜5年</option>
                                        <option value="5〜10年">5〜10年</option>
                                        <option value="10年以上">10年以上</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Head Speed (Avg)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="30" 
                                        max="60" 
                                        step="1"
                                        value={headSpeed}
                                        onChange={e => onUpdateHeadSpeed(parseInt(e.target.value))}
                                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-golf-500"
                                    />
                                    <div className="w-16 h-10 bg-golf-50 border border-golf-100 rounded-xl flex items-center justify-center font-eng font-black text-golf-600">
                                        {headSpeed}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: SNS & Privacy */}
                        <div className="space-y-6">
                            <h4 className="font-black text-xs text-trust-navy uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Connections & Privacy</h4>
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Instagram size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={snsLinks.instagram || ''} 
                                        onChange={e => onUpdateSnsLinks({ ...snsLinks, instagram: e.target.value })}
                                        placeholder="Instagram ID (@...)" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-purple-400"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <Send size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={snsLinks.x || ''} 
                                        onChange={e => onUpdateSnsLinks({ ...snsLinks, x: e.target.value })}
                                        placeholder="X / Twitter ID (@...)" 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-cyan-400"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-trust-navy">
                                        <Globe size={16} className={cn(isPublic ? "text-emerald-500" : "text-slate-400")} />
                                        <span>バッグの公開設定</span>
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
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    {isPublic ? '現在あなたのバッグは誰でも閲覧可能な状態です。' : 'バッグはあなただけに表示されています。URLを知っていても閲覧できません。'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
