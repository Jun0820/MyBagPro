import { Zap } from 'lucide-react';
import type { ClubSetting, UserProfile } from '../../types/golf';
import { TargetCategory } from '../../types/golf';

interface BagShareCardProps {
    profile: UserProfile;
    bag: ClubSetting;
}

export const BagShareCard = ({ profile, bag }: BagShareCardProps) => {
    const sortedClubs = [...bag.clubs].sort((a, b) => {
        const distA = a.distance ? parseInt(String(a.distance).replace(/\D/g, ''), 10) : 0;
        const distB = b.distance ? parseInt(String(b.distance).replace(/\D/g, ''), 10) : 0;

        if (distA !== distB) {
            return distB - distA;
        }

        const order = [
            TargetCategory.DRIVER,
            TargetCategory.FAIRWAY,
            TargetCategory.UTILITY,
            TargetCategory.IRON,
            TargetCategory.WEDGE,
            TargetCategory.PUTTER
        ];
        const orderA = order.indexOf(a.category as TargetCategory);
        const orderB = order.indexOf(b.category as TargetCategory);

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        if (a.number && b.number) {
            return a.number.localeCompare(b.number);
        }

        return 0;
    });

    return (
        <div id="bag-share-card" className="w-[800px] h-[1200px] bg-slate-950 text-white p-12 flex flex-col items-stretch overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_transparent_70%)] opacity-50"></div>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-golf-500/5 blur-[120px] rounded-full"></div>
            
            {/* Header */}
            <div className="relative z-10 flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-4xl font-black font-eng tracking-[0.2em] text-golf-500 mb-2">MY BAG PRO</h1>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold tracking-widest text-slate-300 uppercase">AI Equipment Analysis</span>
                        <div className="h-px w-12 bg-white/20"></div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black font-eng text-white mb-1">{profile.headSpeed}<span className="text-sm font-bold text-slate-400 ml-1">m/s</span></div>
                    <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">HEAD SPEED</div>
                </div>
            </div>

            {/* Profile Bar */}
            <div className="relative z-10 grid grid-cols-4 gap-4 mb-12 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">CATEGORY</div>
                    <div className="text-sm font-bold truncate">{profile.targetCategory || 'GOLFER'}</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">SCORE</div>
                    <div className="text-sm font-bold">{profile.averageScore || '-'}</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">SKILL</div>
                    <div className="text-sm font-bold">{profile.skillLevel || '-'}</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">SWING</div>
                    <div className="text-sm font-bold truncate">{profile.swingTempo || '-'}</div>
                </div>
            </div>

            {/* Club List */}
            <div className="relative z-10 flex-1 space-y-3 overflow-hidden mask-fade-bottom">
                {sortedClubs.map((club, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/5 border-l-4 border-golf-500 p-4 rounded-r-xl">
                        <div className="w-12 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                            {club.category === TargetCategory.FAIRWAY ? 'FW' : 
                             club.category === TargetCategory.UTILITY ? 'UT' : 
                             club.category === TargetCategory.DRIVER ? '1W' : 
                             club.category?.slice(0, 2)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black tracking-tight">{club.model}</span>
                                <span className="text-xs text-slate-400 font-bold">{club.brand}</span>
                            </div>
                            <div className="flex gap-3 mt-1">
                                <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-slate-400 font-mono italic">
                                    {club.shaft || 'Stock Shaft'}
                                </span>
                                {club.loft && (
                                    <span className="text-[10px] font-bold text-golf-400">{club.loft}</span>
                                )}
                            </div>
                        </div>
                        {club.distance && (
                            <div className="text-right">
                                <div className="text-xl font-black text-white">{club.distance}</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase">YDS</div>
                            </div>
                        )}
                    </div>
                ))}
                {sortedClubs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                        NO CLUBS REGISTERED
                    </div>
                )}
            </div>

            {/* Footer / Branding */}
            <div className="relative z-10 mt-12 pt-12 border-t border-white/10 flex justify-between items-end">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-golf-500 rounded-xl flex items-center justify-center shadow-lg shadow-golf-500/30">
                        <Zap className="text-slate-900" fill="currentColor" />
                    </div>
                    <div>
                        <div className="text-xl font-black font-eng tracking-widest">MY BAG PRO</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Analysis Engine v2.0</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 mb-2">QR FOR YOUR OWN DIAGNOSIS</div>
                    <div className="inline-block p-2 bg-white rounded-lg">
                        <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-bold">QR CODE</div>
                    </div>
                </div>
            </div>
            
            {/* Aesthetic Borders */}
            <div className="absolute top-8 left-8 bottom-8 right-8 border border-white/5 pointer-events-none rounded-[2rem]"></div>
        </div>
    );
};
