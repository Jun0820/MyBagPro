import React from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, Clock3, FileText, Info, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { TargetCategory } from '../types/golf';

interface StepCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onBack?: () => void;
    isFirst?: boolean;
}

const diagnosisMenus = [
    { label: '総合診断', href: '/diagnosis', category: TargetCategory.TOTAL_SETTING },
    { label: 'ドライバー診断', href: '/diagnosis/driver', category: TargetCategory.DRIVER },
    { label: 'アイアン診断', href: '/diagnosis/iron', category: TargetCategory.IRON },
    { label: 'ウェッジ診断', href: '/diagnosis/wedge', category: TargetCategory.WEDGE },
    { label: 'パター診断', href: '/diagnosis/putter', category: TargetCategory.PUTTER },
];

const progressLabels = ['基本情報', 'スイングデータ', 'クラブ情報', 'プレースタイル', '診断結果'];

const getProgressIndex = (step: number) => {
    if (step <= 1) return 1;
    if (step >= 6) return 5;
    return Math.min(5, step - 1);
};

export const StepCard: React.FC<StepCardProps> = ({ title, subtitle, children, onBack, isFirst }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { step, profile } = useDiagnosis();
    const navigate = useNavigate();
    const progressIndex = getProgressIndex(step);

    return (
        <div className="mx-auto w-full max-w-[1380px] animate-fadeIn">
            <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_260px]">
                <aside className="hidden xl:block">
                    <div className="sticky top-24 rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">診断メニュー</div>
                        <div className="mt-3 space-y-1.5">
                            {diagnosisMenus.map((item) => {
                                const active = profile.targetCategory === item.category || (item.category === TargetCategory.TOTAL_SETTING && !profile.targetCategory);
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => navigate(item.href)}
                                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                                            active ? 'bg-[#edf6ef] text-[#166534]' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                                            active ? 'bg-[#166534] text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {item.label === '総合診断' ? '⛳' : '✓'}
                                        </span>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">マイページメニュー</div>
                            <div className="mt-3 space-y-1.5">
                                {[
                                    ['ダッシュボード', '/mypage'],
                                    ['マイクラブ', '/mypage?tab=clubs'],
                                    ['診断履歴', '/mypage'],
                                    ['セッティング比較', '/compare'],
                                    ['お気に入り', '/mypage'],
                                ].map(([label, href]) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => navigate(href)}
                                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-slate-600 transition hover:bg-slate-50"
                                    >
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-400">
                                            •
                                        </span>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 rounded-[24px] bg-[#153d2b] p-4 text-white shadow-sm">
                            <div className="text-sm font-black">もっと詳しく分析しませんか？</div>
                            <p className="mt-2 text-xs leading-6 text-white/75">
                                プレミアムプランにアップグレードすると、より高度な分析と比較機能をご利用いただけます。
                            </p>
                            <button className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#c8a96a] px-4 py-3 text-sm font-black text-[#153d2b]">
                                プランをアップグレード
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="min-w-0">
                    <div className="mb-4 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200 md:mb-5 md:rounded-[28px] md:p-6">
                        {!isFirst && onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="mb-4 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200/80 transition hover:text-[#166534] hover:ring-[#166534]/30 md:px-4 md:py-2.5 md:text-sm"
                            >
                                <ArrowLeft size={14} />
                                戻る
                            </button>
                        )}

                        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">総合診断</div>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#151719] md:text-[3.25rem] md:leading-[1.05]">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
                                {subtitle}
                            </p>
                        )}

                        <div className="mt-5">
                            <div className="grid grid-cols-5 items-center gap-1 md:gap-3">
                                {progressLabels.map((label, index) => {
                                    const current = index + 1 === progressIndex;
                                    const completed = index + 1 < progressIndex;
                                    return (
                                        <div key={label} className="flex flex-col items-center gap-1 md:gap-2">
                                            <div className="flex w-full items-center gap-1 md:gap-2">
                                                <div
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black md:h-10 md:w-10 md:text-sm ${
                                                        current || completed
                                                            ? 'border-[#166534] bg-[#166534] text-white'
                                                            : 'border-slate-200 bg-white text-slate-400'
                                                    }`}
                                                >
                                                    {completed ? <CheckCircle2 size={14} /> : index + 1}
                                                </div>
                                                {index < progressLabels.length - 1 && (
                                                    <div className={`h-[2px] flex-1 rounded-full ${completed ? 'bg-[#166534]' : 'bg-slate-200'}`} />
                                                )}
                                            </div>
                                            <div className="text-center text-[9px] font-black text-slate-500 md:text-xs">{label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200 md:rounded-[28px] md:p-8">
                        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-[#fff7e5] px-4 py-3 text-sm text-[#9b621f] ring-1 ring-[#ead8a8]">
                            <Info size={16} className="mt-0.5 shrink-0 text-[#c18e2f]" />
                            <div className="font-black">この診断はβ版です。精度向上中です。</div>
                        </div>

                        {children}

                        {!isFirst && (
                            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
                                戻っても入力内容は保持されます。
                            </div>
                        )}
                    </div>

                    <div className="mt-4 xl:hidden">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#151719] ring-1 ring-slate-200/80"
                        >
                            診断の概要
                            <ChevronDown size={16} className={`transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSidebarOpen && (
                            <div className="mt-2 space-y-2">
                                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                                    <div className="flex items-center gap-2 text-sm font-black text-trust-navy">
                                        <Clock3 size={16} />
                                        所要時間
                                    </div>
                                    <p className="mt-2 text-xs leading-6 text-slate-600">約5〜7分。分かる範囲だけでも診断できます。</p>
                                </div>
                                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                                    <div className="flex items-center gap-2 text-sm font-black text-trust-navy">
                                        <FileText size={16} />
                                        わかること
                                    </div>
                                    <ul className="mt-2 space-y-1.5 text-xs leading-6 text-slate-600">
                                        <li>・あなたの強み・弱み</li>
                                        <li>・最適なクラブ候補</li>
                                        <li>・改善ポイント</li>
                                        <li>・次に見直すカテゴリ</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="hidden xl:block">
                    <div className="sticky top-24 space-y-4">
                        <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                            <div className="text-lg font-black text-[#151719]">診断の概要</div>
                            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                                <div className="flex gap-3">
                                    <Clock3 size={18} className="mt-1 text-slate-400" />
                                    <div>
                                        <div className="font-black text-slate-800">所要時間</div>
                                        <div>約5〜7分</div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <FileText size={18} className="mt-1 text-slate-400" />
                                    <div>
                                        <div className="font-black text-slate-800">診断内容</div>
                                        <div>5ステップで最適なセッティングを整理します。</div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <ShieldCheck size={18} className="mt-1 text-slate-400" />
                                    <div>
                                        <div className="font-black text-slate-800">わかること</div>
                                        <div>強み・弱み、改善ポイント、おすすめクラブ。</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
                            <div className="flex items-center justify-between">
                                <div className="text-lg font-black text-[#151719]">入力の進捗</div>
                                <div className="text-sm font-black text-slate-500">{Math.round((progressIndex / progressLabels.length) * 100)}%</div>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-[#166534] transition-all"
                                    style={{ width: `${(progressIndex / progressLabels.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="rounded-[28px] bg-[#f7fbf8] p-5 shadow-sm ring-1 ring-slate-200">
                            <div className="text-sm font-black text-[#151719]">入力のヒント</div>
                            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                                <li>・分かる範囲での入力で大丈夫です</li>
                                <li>・あとからマイクラブ画面で編集できます</li>
                                <li>・正確な診断ほど、入力データが活きます</li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
