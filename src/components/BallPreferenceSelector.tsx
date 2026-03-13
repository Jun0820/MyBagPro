import { BallPerformanceGoal, IdealTrajectory, type UserProfile } from '../types/golf';
import type { BallPreferences } from '../types/golf_ball';

interface Props {
    preferences: BallPreferences | undefined;
    userProfile: UserProfile;
    onChange: (prefs: BallPreferences) => void;
    onProfileChange: (key: keyof UserProfile, value: any) => void;
}

export const BallPreferenceSelector: React.FC<Props> = ({ preferences, userProfile, onChange, onProfileChange }) => {
    const current = preferences || { preferredFeel: 'SOFT', priority: 'BALANCE' };

    const update = (key: keyof BallPreferences, value: any) => {
        onChange({ ...current, [key]: value });
    };

    const toggleGoal = (goal: BallPerformanceGoal) => {
        const goals = userProfile.ballPerformanceGoals || [];
        const newGoals = goals.includes(goal)
            ? goals.filter(g => g !== goal)
            : [...goals, goal];
        onProfileChange('ballPerformanceGoals', newGoals);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* 打感の好み */}
            <div>
                <label className="block font-bold text-trust-navy mb-3 text-lg md:text-xl">PREFERRED FEEL (打感)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { val: 'VERY_SOFT', label: '超ソフト', desc: '潰れる感覚' },
                        { val: 'SOFT', label: 'ソフト', desc: 'マイルド' },
                        { val: 'FIRM', label: 'しっかり', desc: '手応えあり' },
                        { val: 'VERY_FIRM', label: '硬め', desc: '弾く感覚' }
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => update('preferredFeel', opt.val)}
                            className={`p-4 rounded-2xl border transition-all text-left duration-200 active:scale-95 ${current.preferredFeel === opt.val
                                ? 'border-golf-500 bg-golf-50 shadow-md ring-2 ring-golf-100'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-golf-300 hover:shadow-sm'}`}
                        >
                            <div className={`font-bold text-sm md:text-base ${current.preferredFeel === opt.val ? 'text-golf-800' : 'text-slate-700'}`}>{opt.label}</div>
                            <div className="text-[10px] md:text-xs opacity-70 mt-1">{opt.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 優先順位 */}
            <div>
                <label className="block font-bold text-trust-navy mb-3 text-lg md:text-xl">TOP PRIORITY (最重視)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { val: 'DISTANCE', label: '飛距離重視', icon: '🚀', desc: 'とにかく遠くへ飛ばしたい' },
                        { val: 'SPIN', label: 'スピン重視', icon: '🎯', desc: 'グリーンでビタッと止めたい' },
                        { val: 'BALANCE', label: 'バランス型', icon: '⚖️', desc: '飛びとスピンを両立したい' }
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => update('priority', opt.val)}
                            className={`p-4 md:p-5 rounded-2xl border transition-all flex items-center gap-4 duration-200 active:scale-[0.98] ${current.priority === opt.val
                                ? 'border-golf-500 bg-golf-50 shadow-lg ring-2 ring-golf-100'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-golf-300 hover:shadow-md'}`}
                        >
                            <span className="text-2xl md:text-3xl">{opt.icon}</span>
                            <div>
                                <div className={`font-bold text-base md:text-lg ${current.priority === opt.val ? 'text-golf-800' : 'text-slate-700'}`}>{opt.label}</div>
                                <div className="text-xs opacity-70">{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Performance Goals (複数選択) */}
            <div>
                <label className="block font-bold text-trust-navy mb-3 text-lg md:text-xl">PERFORMANCE GOALS (課題・目標)</label>
                <div className="grid grid-cols-2 gap-3">
                    {Object.values(BallPerformanceGoal).map((goal) => (
                        <button
                            key={goal}
                            onClick={() => toggleGoal(goal)}
                            className={`p-4 rounded-xl border transition-all text-sm md:text-base font-bold text-left duration-200 active:scale-[0.98] ${userProfile.ballPerformanceGoals?.includes(goal)
                                ? 'border-golf-500 bg-golf-50 text-golf-800 shadow-sm relative overflow-hidden'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                        >
                            <span className="relative z-10">{goal}</span>
                            {userProfile.ballPerformanceGoals?.includes(goal) && (
                                <div className="absolute top-0 right-0 w-8 h-8 bg-golf-500/10 rounded-bl-3xl" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trajectory */}
            <div>
                <label className="block font-bold text-trust-navy mb-3 text-lg md:text-xl">IDEAL TRAJECTORY (理想の弾道)</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { val: IdealTrajectory.HIGH_DRAW, label: '高弾道' },
                        { val: IdealTrajectory.STRAIGHT, label: '中弾道' },
                        { val: IdealTrajectory.LOW_FADE, label: '低弾道' }
                    ].map((t) => (
                        <button
                            key={t.label}
                            onClick={() => onProfileChange('idealTrajectory', t.val)}
                            className={`py-3 md:py-4 rounded-xl border transition-all font-bold text-sm md:text-base duration-200 active:scale-95 ${userProfile.idealTrajectory === t.val
                                ? 'border-golf-500 bg-golf-50 text-golf-800 shadow-md ring-2 ring-golf-100'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* アライメント / カラー (簡易版) */}
            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 md:gap-8 bg-white/50 p-4 rounded-2xl">
                <label className="flex items-center gap-3 cursor-pointer text-slate-600 font-bold text-sm md:text-base p-2 hover:bg-white rounded-lg transition-colors">
                    <input
                        type="checkbox"
                        checked={current.colorPreference || false}
                        onChange={e => update('colorPreference', e.target.checked)}
                        className="w-5 h-5 accent-golf-600 rounded bg-slate-100 border-slate-300"
                    />
                    カラーボール希望
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-slate-600 font-bold text-sm md:text-base p-2 hover:bg-white rounded-lg transition-colors">
                    <input
                        type="checkbox"
                        checked={current.alignmentLine || false}
                        onChange={e => update('alignmentLine', e.target.checked)}
                        className="w-5 h-5 accent-golf-600 rounded bg-slate-100 border-slate-300"
                    />
                    アライメントライン付
                </label>
            </div>
        </div>
    );
};
