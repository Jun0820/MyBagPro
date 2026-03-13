import React from 'react';
import { cn } from '../lib/utils';

interface OptionButtonProps {
    label: string;
    subLabel?: string;
    selected: boolean;
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
}

export const OptionButton: React.FC<OptionButtonProps> = ({ label, subLabel, selected, onClick, icon, className }) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left p-4 md:p-6 rounded-2xl border flex items-center justify-between transition-all duration-300 active:scale-[0.98] group relative overflow-hidden",
                selected
                    ? 'bg-white/90 border-golf-400 shadow-[0_0_30px_rgba(74,222,128,0.2)] ring-1 ring-golf-400/50'
                    : 'bg-white/60 border-white/40 hover:bg-white/80 hover:border-golf-300/50 hover:shadow-lg hover:-translate-y-1 shadow-sm backdrop-blur-sm',
                className
            )}
        >
            <div className="flex items-center gap-4">
                {icon && (
                    <div className={cn(
                        "p-3 rounded-xl transition-colors duration-300 shadow-sm",
                        selected ? "bg-gradient-to-br from-golf-500 to-golf-600 text-white" : "bg-slate-50 text-slate-400 group-hover:text-golf-500"
                    )}>
                        {icon}
                    </div>
                )}
                <div>
                    <div className={cn(
                        "font-bold text-base md:text-lg transition-colors",
                        selected ? "text-trust-navy" : "text-slate-600 group-hover:text-trust-navy"
                    )}>
                        {label}
                    </div>
                    {subLabel && (
                        <div className="text-xs text-slate-400 mt-0.5">
                            {subLabel}
                        </div>
                    )}
                </div>
            </div>
            <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                selected ? 'border-golf-500 bg-golf-500 scale-110' : 'border-slate-200 group-hover:border-golf-300'
            )}>
                <div className={cn(
                    "w-2.5 h-2.5 bg-white rounded-full transition-transform duration-300",
                    selected ? "scale-100" : "scale-0"
                )} />
            </div>
        </button>
    );
};
