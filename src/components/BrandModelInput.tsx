import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { getBrands, getModels, getAllBrands, getAllModels } from '../lib/data';
import { searchBrands, searchModels } from '../lib/fuzzySearch';
import { TargetCategory } from '../types/golf';
import { cn } from '../lib/utils';

interface BrandModelInputProps {
    brand: string;
    model: string;
    category: TargetCategory | string;
    onBrandChange: (value: string) => void;
    onModelChange: (value: string) => void;
    bgClass?: string;
    placeholderModel?: string;
    compact?: boolean;
}

export const BrandModelInput: React.FC<BrandModelInputProps> = ({
    brand,
    model,
    category,
    onBrandChange,
    onModelChange,
    bgClass = "bg-white",
    placeholderModel,
    compact = false
}) => {
    const [showBrand, setShowBrand] = useState(false);
    const [showModel, setShowModel] = useState(false);
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [suggestedModels, setSuggestedModels] = useState<string[]>([]);

    // Ref to track clicks outside the component
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (category === "ALL") {
            setAvailableBrands([...getAllBrands(), "その他"]);
        } else {
            const cat = category as TargetCategory;
            const brandList = getBrands(cat);
            setAvailableBrands([...brandList, "その他"]);
        }
    }, [category]);

    useEffect(() => {
        if (brand && brand !== "その他") {
            if (category === "ALL") {
                setSuggestedModels(getAllModels(brand));
            } else {
                const cat = category as TargetCategory;
                setSuggestedModels(getModels(brand, cat));
            }
        } else {
            setSuggestedModels([]);
        }
    }, [brand, category]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowBrand(false);
                setShowModel(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleBrandSelect = (b: string) => {
        onBrandChange(b === "その他" ? "" : b);
        setShowBrand(false);
    };

    const handleModelSelect = (m: string) => {
        onModelChange(m);
        setShowModel(false);
    };

    return (
        <div ref={wrapperRef} className={cn("grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3", compact && "grid-cols-2 md:grid-cols-2 gap-1.5 md:gap-2")}>
            {/* BRAND */}
            <div className="relative">
                <label className={cn("block font-bold text-slate-500 mb-1 ml-1", compact ? "text-[9px]" : "text-[10px] md:text-xs")}>メーカー</label>
                <div className="relative">
                    <input
                        type="text"
                        value={brand}
                        onChange={(e) => { onBrandChange(e.target.value); setShowBrand(true); }}
                        onFocus={() => { setShowBrand(true); setShowModel(false); }}
                        placeholder="メーカー"
                        className={cn(
                            "w-full border border-slate-200/60 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-400 focus:ring-4 focus:ring-golf-400/10 transition-all shadow-sm",
                            compact ? "p-2.5 text-sm" : "p-4 md:p-4 text-base md:text-sm",
                            bgClass === "bg-white" ? "bg-white/50 backdrop-blur-sm" : bgClass
                        )}
                    />
                    {showBrand && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            <div className="p-2 text-[10px] text-slate-400 font-bold bg-slate-50 sticky top-0">人気ブランド</div>
                            {(brand ? searchBrands(brand, availableBrands) : availableBrands).slice(0, 15).map(b => (
                                <div
                                    key={b}
                                    className="px-4 py-3 hover:bg-golf-50 cursor-pointer text-slate-700 font-medium text-sm border-b border-slate-50 last:border-0"
                                    onMouseDown={(e) => { e.preventDefault(); handleBrandSelect(b); }}
                                >
                                    {b}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODEL */}
            <div className="relative">
                <label className={cn("block font-bold text-slate-500 mb-1 ml-1", compact ? "text-[9px]" : "text-[10px] md:text-xs")}>モデル名</label>
                <div className="relative">
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => { onModelChange(e.target.value); setShowModel(true); }}
                        onFocus={() => { setShowModel(true); setShowBrand(false); }}
                        disabled={!brand}
                        placeholder={!brand ? "メーカーを選択" : (placeholderModel || "モデル名 (例: Qi10)")}
                        className={cn(
                            "w-full border border-slate-200/60 rounded-xl font-bold text-trust-navy outline-none focus:border-golf-400 focus:ring-4 focus:ring-golf-400/10 disabled:text-slate-400 transition-all shadow-sm",
                            compact ? "p-2.5 text-xs" : "p-4 md:p-4 text-base md:text-sm",
                            !brand ? 'bg-slate-100/50' : (bgClass === "bg-white" ? "bg-white/50 backdrop-blur-sm" : bgClass)
                        )}
                    />
                    <div className={cn("absolute right-3 text-slate-400 pointer-events-none", compact ? "top-2.5" : "top-3.5")}>
                        <Search size={compact ? 14 : 18} />
                    </div>
                    {showModel && brand && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {suggestedModels.length > 0 && <div className="p-2 text-[10px] text-slate-400 font-bold bg-slate-50 sticky top-0">SUGGESTED FOR {brand}</div>}
                            {(model ? searchModels(model, suggestedModels) : suggestedModels).slice(0, 15).map(m => (
                                <div
                                    key={m}
                                    className="px-4 py-3 hover:bg-golf-50 cursor-pointer text-slate-700 font-medium text-sm border-b border-slate-50 last:border-0"
                                    onMouseDown={(e) => { e.preventDefault(); handleModelSelect(m); }}
                                >
                                    {m}
                                </div>
                            ))}
                            {model.length > 1 && !suggestedModels.includes(model) && (
                                <div className="px-4 py-3 text-slate-500 italic text-xs border-t border-slate-100">
                                    "{model}" を使用
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

