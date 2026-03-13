import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface StepCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onBack?: () => void;
    isFirst?: boolean;
}

export const StepCard: React.FC<StepCardProps> = ({ title, subtitle, children, onBack, isFirst }) => {
    return (
        <div className="w-full max-w-3xl mx-auto animate-fadeIn">
            <div className="mb-6 md:mb-8 px-2 md:px-0">
                {!isFirst && onBack && (
                    <button
                        onClick={onBack}
                        className="mb-4 flex items-center gap-2 text-slate-400 hover:text-golf-700 text-sm transition-colors active:scale-95 origin-left"
                    >
                        <ArrowLeft size={16} />
                        戻る
                    </button>
                )}
                <h2 className="font-eng font-bold text-2xl md:text-4xl text-trust-navy mb-2 md:mb-3 leading-tight tracking-tight">{title}</h2>
                {subtitle && <p className="text-slate-500 text-sm md:text-base">{subtitle}</p>}
            </div>
            <div className="glass-premium rounded-[2rem] p-6 md:p-12 shadow-2xl shadow-golf-900/5 hover:shadow-golf-900/10 transition-shadow duration-500">
                {children}
            </div>
        </div>
    );
};
