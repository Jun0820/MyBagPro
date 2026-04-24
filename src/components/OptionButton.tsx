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
                "w-full text-left rounded-[22px] border px-4 py-4 md:px-5 md:py-5 flex items-center justify-between transition-all duration-200 active:scale-[0.98] group relative",
                selected
                    ? 'bg-[#eef7f0] border-[#2d8a56] shadow-[0_16px_32px_-26px_rgba(23,101,52,0.45)]'
                    : 'bg-white border-[#dde6de] hover:border-[#8fb89a] hover:bg-[#fafcfb]',
                className
            )}
        >
            <div className="flex items-center gap-3 md:gap-4">
                {icon && (
                    <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                        selected ? "bg-[#176534] text-white" : "bg-[#f3f5f3] text-slate-400 group-hover:text-[#176534]"
                    )}>
                        {icon}
                    </div>
                )}
                <div className="min-w-0">
                    <div className={cn(
                        "font-black text-[15px] leading-6 md:text-lg transition-colors",
                        selected ? "text-[#111827]" : "text-slate-800 group-hover:text-[#111827]"
                    )}>
                        {label}
                    </div>
                    {subLabel && (
                        <div className="mt-1 text-xs leading-5 text-slate-500 md:text-sm md:leading-6">
                            {subLabel}
                        </div>
                    )}
                </div>
            </div>
            <div className={cn(
                "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0",
                selected ? 'border-[#176534] bg-[#176534]' : 'border-[#d4ddd4] group-hover:border-[#8fb89a]'
            )}>
                <div className={cn(
                    "w-2.5 h-2.5 bg-white rounded-full transition-transform duration-200",
                    selected ? "scale-100" : "scale-0"
                )} />
            </div>
        </button>
    );
};
