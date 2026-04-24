import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';

interface StepCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onBack?: () => void;
    isFirst?: boolean;
}

export const StepCard: React.FC<StepCardProps> = ({ title, subtitle, children, onBack, isFirst }) => {
    return (
        <div className="mx-auto w-full max-w-6xl animate-fadeIn">
            <div className="mb-4 px-1 md:mb-7 md:px-0">
                {!isFirst && onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-500 transition hover:border-[#166534] hover:text-[#166534]"
                    >
                        <ArrowLeft size={16} />
                        戻る
                    </button>
                )}
                <div className="text-sm font-bold text-slate-500">総合診断</div>
                <h2 className="mb-2 mt-2 text-[1.9rem] font-black leading-[1.08] tracking-tight text-[#151719] md:text-[3rem]">
                    {title}
                </h2>
                {subtitle && (
                    <p className="max-w-3xl text-sm leading-6 text-slate-500 md:text-base md:leading-7">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
                <div className="rounded-[28px] border border-[#e5ece6] bg-white p-4 shadow-sm md:p-8">
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#ead8a8] bg-[#fff7e5] px-4 py-3 text-sm text-[#9b621f]">
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

                <aside className="space-y-4">
                    <div className="rounded-[28px] border border-[#e5ece6] bg-white p-5 shadow-sm">
                        <div className="text-lg font-black text-[#151719]">診断の概要</div>
                        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                            <div>
                                <div className="font-black text-slate-800">所要時間</div>
                                <div>約3〜7分</div>
                            </div>
                            <div>
                                <div className="font-black text-slate-800">診断内容</div>
                                <div>入力内容から、合うクラブ候補と改善ポイントを整理します。</div>
                            </div>
                            <div>
                                <div className="font-black text-slate-800">わかること</div>
                                <div>強み・弱み、候補クラブ、次に見直す優先カテゴリ。</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-[#e5ece6] bg-white p-5 shadow-sm">
                        <div className="text-lg font-black text-[#151719]">入力のヒント</div>
                        <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                            <div>分かる範囲の入力だけで大丈夫です。</div>
                            <div>あとからマイクラブ画面で編集できます。</div>
                            <div>計測データがなくても診断は進められます。</div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};
