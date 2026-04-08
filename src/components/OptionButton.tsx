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
                "w-full text-left p-4 md:p-5 rounded-[1.5rem] border flex items-center justify-between transition-all duration-200 active:scale-[0.98] group relative",
                selected
                    ? 'bg-golf-50 border-golf-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-golf-300 hover:bg-slate-50',
                className
            )}
        >
            <div className="flex items-center gap-4">
                {icon && (
                    <div className={cn(
                        "p-3 rounded-xl transition-colors duration-300",
                        selected ? "bg-golf-700 text-white" : "bg-slate-100 text-slate-400 group-hover:text-golf-600"
                    )}>
                        {icon}
                    </div>
                )}
                <div>
                    <div className={cn(
                        "font-black text-base md:text-lg transition-colors",
                        selected ? "text-trust-navy" : "text-slate-700 group-hover:text-trust-navy"
                    )}>
                        {label}
                    </div>
                    {subLabel && (
                        <div className="text-xs leading-6 text-slate-500 mt-1">
                            {subLabel}
                        </div>
                    )}
                </div>
            </div>
            <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                selected ? 'border-golf-700 bg-golf-700' : 'border-slate-200 group-hover:border-golf-300'
            )}>
                <div className={cn(
                    "w-2.5 h-2.5 bg-white rounded-full transition-transform duration-200",
                    selected ? "scale-100" : "scale-0"
                )} />
            </div>
        </button>
    );
};
