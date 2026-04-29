import React, { useRef } from 'react';
import { User, Image, Instagram, Send, Globe, Check, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { UserSocialLinks } from '../../types/golf';

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
    snsLinks: UserSocialLinks;
    onUpdateSnsLinks: (links: UserSocialLinks) => void;
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
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    onManualSave?: () => void;
    onLogout?: () => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({
    userName, onUpdateUserName, snsLinks, onUpdateSnsLinks, 
    coverPhoto, onUpdateCoverPhoto, age, onUpdateAge, gender, onUpdateGender,
    headSpeed, onUpdateHeadSpeed, isPublic, onUpdateIsPublic,
    birthdate, onUpdateBirthdate, golfHistory, onUpdateGolfHistory,
    bestScore, onUpdateBestScore, averageScore, onUpdateAverageScore,
    saveStatus, onManualSave, onLogout
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const customLinks = snsLinks.customLinks || [];

    const updateCustomLink = (index: number, field: 'label' | 'url', value: string) => {
        const nextLinks = [...customLinks];
        const current = nextLinks[index] || { id: `link-${index + 1}`, label: '', url: '' };
        nextLinks[index] = { ...current, [field]: value };
        onUpdateSnsLinks({ ...snsLinks, customLinks: nextLinks });
    };

    const addCustomLink = () => {
        onUpdateSnsLinks({
            ...snsLinks,
            customLinks: [...customLinks, { id: `link-${Date.now()}`, label: '', url: '' }],
        });
    };

    const removeCustomLink = (index: number) => {
        onUpdateSnsLinks({
            ...snsLinks,
            customLinks: customLinks.filter((_, currentIndex) => currentIndex !== index),
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

    return (
        <div className="space-y-4 animate-fadeIn pb-8">
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
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">見せ方を選ぶ</div>
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
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">プロフィール名</label>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {/* Left Side: Basic Info */}
                        <div className="space-y-4">
                            <h4 className="font-black text-xs text-trust-navy uppercase tracking-[0.2em] border-b border-slate-100 pb-2">プロフィールの基本</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">性別</label>
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
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">年代</label>
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
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">ベストスコア</label>
                                    <input 
                                        type="number" 
                                        placeholder="78"
                                        value={bestScore || ''} 
                                        onChange={e => onUpdateBestScore(e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">平均スコア</label>
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
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">生年月日</label>
                                    <input 
                                        type="date" 
                                        value={birthdate || ''} 
                                        onChange={e => onUpdateBirthdate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">ゴルフ歴</label>
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
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">平均ヘッドスピード</label>
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
                        <div className="space-y-4">
                            <h4 className="font-black text-xs text-trust-navy uppercase tracking-[0.2em] border-b border-slate-100 pb-2">公開まわりと導線</h4>
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

                            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">自由URL</div>
                                        <div className="mt-1 text-xs font-medium text-slate-500">ブログ、YouTube、予約ページなど、見てほしい導線を追加できます。</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addCustomLink}
                                        className="rounded-full bg-trust-navy px-3 py-1.5 text-[11px] font-black text-white"
                                    >
                                        追加
                                    </button>
                                </div>

                                {customLinks.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs text-slate-400">
                                        まだ追加した導線はありません。
                                    </div>
                                )}

                                {customLinks.map((link, index) => (
                                    <div key={link.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                        <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
                                            <input
                                                type="text"
                                                value={link.label}
                                                onChange={(e) => updateCustomLink(index, 'label', e.target.value)}
                                                placeholder="例: YouTube"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500"
                                            />
                                            <input
                                                type="url"
                                                value={link.url}
                                                onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                                                placeholder="https://..."
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-trust-navy outline-none focus:border-golf-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeCustomLink(index)}
                                                className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 font-bold text-sm text-trust-navy">
                                        <Globe size={16} className={cn(isPublic ? "text-emerald-500" : "text-slate-400")} />
                                        <span>バッグの公開範囲</span>
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
                                    {isPublic ? '現在のバッグは公開中です。リンクから他の人にも見てもらえます。' : '現在のバッグは非公開です。自分だけが確認できます。'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8">
                    <h4 className="font-black text-xs text-trust-navy uppercase tracking-[0.2em] border-b border-slate-100 pb-3 mb-6">アカウント設定</h4>
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <button 
                                onClick={() => onManualSave?.()} 
                                className="w-full md:w-auto px-8 py-3 bg-trust-navy text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
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

                            <button 
                                onClick={() => onLogout?.()}
                                className="w-full md:w-auto px-8 py-3 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95 border border-red-100"
                            >
                                <span>ログアウト</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
