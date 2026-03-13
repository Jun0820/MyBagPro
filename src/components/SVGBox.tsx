import React from 'react';
import { cn } from '../lib/utils';

interface SVGBoxProps {
    children: React.ReactNode;
    active: boolean;
    label: string;
    onClick: () => void;
}

export const SVGBox: React.FC<SVGBoxProps> = ({ children, active, label, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 aspect-square w-full",
                active
                    ? 'bg-golf-50 border-golf-500 scale-105 shadow-md'
                    : 'bg-white border-slate-200 hover:border-golf-300 hover:bg-slate-50'
            )}
        >
            <div className={cn(
                "w-12 h-12 md:w-16 md:h-16 mb-3 flex items-center justify-center transition-colors",
                active ? 'text-golf-600' : 'text-slate-400'
            )}>
                {children}
            </div>
            <span className={cn(
                "text-[10px] md:text-xs font-bold",
                active ? 'text-golf-800' : 'text-slate-600'
            )}>
                {label}
            </span>
        </button>
    );
};
