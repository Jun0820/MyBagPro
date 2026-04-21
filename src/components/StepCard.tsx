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
        <div className="w-full max-w-5xl mx-auto animate-fadeIn">
            <div className="mb-6 md:mb-8 px-1 md:px-0">
                {!isFirst && onBack && (
                    <button
                        onClick={onBack}
                        className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500 transition-colors active:scale-95 origin-left hover:border-golf-300 hover:text-golf-700"
                    >
                        <ArrowLeft size={16} />
                        戻る
                    </button>
                )}
                <h2 className="text-3xl md:text-5xl font-black text-trust-navy mb-3 leading-tight tracking-tight">{title}</h2>
                {subtitle && <p className="max-w-2xl text-slate-500 text-sm md:text-base leading-7">{subtitle}</p>}
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="font-bold">
                        この診断はβ版です。精度向上中です。
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
};
