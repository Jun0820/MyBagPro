import React from 'react';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { useDiagnosis } from '../context/DiagnosisContext';

interface StepCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onBack?: () => void;
    isFirst?: boolean;
}

const progressLabels = ['基本情報', 'スイングデータ', 'クラブ情報', 'プレースタイル', '診断結果'];

const getProgressIndex = (step: number) => {
    if (step <= 1) return 1;
    if (step >= 6) return 5;
    return Math.min(5, step - 1);
};

export const StepCard: React.FC<StepCardProps> = ({ title, subtitle, children, onBack, isFirst }) => {
    const { step } = useDiagnosis();
    const progressIndex = getProgressIndex(step);

    return (
        <div className="mx-auto w-full max-w-[980px] animate-fadeIn">
            <div className="mb-4 border-b border-slate-200 pb-4 md:mb-5 md:pb-5">
                {!isFirst && onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="mb-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition hover:text-[#166534] hover:ring-[#166534]/30 md:text-sm"
                    >
                        <ArrowLeft size={14} />
                        戻る
                    </button>
                )}

                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">総合診断</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#151719] md:text-4xl md:leading-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
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

            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-[#fff7e5] px-3 py-2 text-sm text-[#9b621f] ring-1 ring-[#ead8a8]">
                    <Info size={16} className="mt-0.5 shrink-0 text-[#c18e2f]" />
                    <div className="font-black">この診断はβ版です。精度向上中です。</div>
                </div>

                {children}

                {!isFirst && (
                    <div className="mt-5 border-t border-slate-100 pt-3 text-xs font-black text-slate-500">
                        戻っても入力内容は保持されます。
                    </div>
                )}
            </div>
        </div>
    );
};
