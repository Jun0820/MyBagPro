import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SHAFT_MODELS } from '../lib/data';
import { cn } from '../lib/utils';

interface DetailedShaftInputProps {
    model: string;
    weight: string;
    flex: string;
    onModelChange: (value: string) => void;
    onWeightChange: (value: string) => void;
    onFlexChange: (value: string) => void;
    compact?: boolean;
}

export const DetailedShaftInput: React.FC<DetailedShaftInputProps> = ({
    model, weight, flex, onModelChange, onWeightChange, onFlexChange, compact = false
}) => {
    const [showModel, setShowModel] = useState(false);

    return (
        <div className={cn("grid grid-cols-12 gap-2 md:gap-3", compact && "gap-1.5 md:gap-2")}>
            <div className="col-span-12 md:col-span-6 relative">
                <input
                    type="text"
                    value={model}
                    onChange={(e) => { onModelChange(e.target.value); setShowModel(true); }}
                    onFocus={() => setShowModel(true)}
                    onBlur={() => setTimeout(() => setShowModel(false), 200)}
                    placeholder="シャフトモデル"
                    className={cn(
                        "w-full border-2 border-slate-200 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-500 bg-white shadow-sm transition-all",
                        compact ? "p-2 px-3 text-sm" : "p-3.5 md:p-3 text-base md:text-sm"
                    )}
                />
                {showModel && (
                    <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        <li className="px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 sticky top-0">COMMON MODELS</li>
                        {SHAFT_MODELS.filter(s => s.toLowerCase().includes(model.toLowerCase())).map((s, i) => (
                            <li
                                key={i}
                                className="px-4 py-3 hover:bg-golf-50 cursor-pointer text-sm text-slate-700 border-b border-slate-50"
                                onClick={() => onModelChange(s)}
                            >
                                {s}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="col-span-6 md:col-span-3">
                <div className="relative">
                    <select
                        value={weight}
                        onChange={(e) => onWeightChange(e.target.value)}
                        className={cn(
                            "w-full border-2 border-slate-200 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-500 bg-white appearance-none shadow-sm transition-all",
                            compact ? "p-2 px-2 text-sm" : "p-3.5 md:p-3 text-base md:text-sm"
                        )}
                    >
                        <option value="">重量</option>
                        {['40', '50', '60', '70', '80', '90', '100', '110', '120'].map(w => (
                            <option key={w} value={w}>{w}g</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>
            <div className="col-span-6 md:col-span-3">
                <div className="relative">
                    <select
                        value={flex}
                        onChange={(e) => onFlexChange(e.target.value)}
                        className={cn(
                            "w-full border-2 border-slate-200 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-500 bg-white appearance-none shadow-sm transition-all",
                            compact ? "p-2 px-2 text-sm" : "p-3.5 md:p-3 text-base md:text-sm"
                        )}
                    >
                        <option value="">Flex</option>
                        {['R', 'SR', 'S', 'X'].map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
};
