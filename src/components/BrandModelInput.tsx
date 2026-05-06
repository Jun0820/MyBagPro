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

    const baseInputClass = cn(
        "w-full rounded-xl border border-[#d8e2d9] bg-white text-slate-900 outline-none transition-all focus:border-[#176534] focus:ring-4 focus:ring-[#176534]/8",
        compact ? "min-h-11 px-3 py-2.5 text-sm font-bold" : "min-h-[52px] px-4 py-3.5 text-[15px] font-bold"
    );

    return (
        <div ref={wrapperRef} className={cn("grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3", compact && "grid-cols-1 md:grid-cols-2 gap-2")}>
            {/* BRAND */}
            <div className="relative">
                <label className={cn("mb-1 ml-1 block font-bold text-slate-500", compact ? "text-[10px]" : "text-[11px] md:text-xs")}>メーカー</label>
                <div className="relative">
                    <input
                        type="text"
                        value={brand}
                        onChange={(e) => { onBrandChange(e.target.value); setShowBrand(true); }}
                        onFocus={() => { setShowBrand(true); setShowModel(false); }}
                        placeholder="メーカー"
                        className={cn(baseInputClass, bgClass !== "bg-white" && bgClass)}
                    />
                    {showBrand && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-[#dfe7df] bg-white shadow-[0_22px_50px_-32px_rgba(15,15,16,0.35)]">
                            <div className="sticky top-0 bg-[#f6f8f6] p-2 text-[10px] font-bold text-slate-400">ブランド候補</div>
                            {(brand ? searchBrands(brand, availableBrands) : availableBrands).slice(0, 15).map(b => (
                                <div
                                    key={b}
                                    className="cursor-pointer border-b border-slate-50 px-4 py-3 text-sm font-medium text-slate-700 last:border-0 hover:bg-[#f4f8f5]"
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
                <label className={cn("mb-1 ml-1 block font-bold text-slate-500", compact ? "text-[10px]" : "text-[11px] md:text-xs")}>モデル名</label>
                <div className="relative">
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => { onModelChange(e.target.value); setShowModel(true); }}
                        onFocus={() => { setShowModel(true); setShowBrand(false); }}
                        disabled={!brand}
                        placeholder={!brand ? "メーカーを選択" : (placeholderModel || "モデル名 (例: Qi10)")}
                        className={cn(
                            baseInputClass,
                            !brand ? 'bg-slate-100 text-slate-400' : (bgClass !== "bg-white" ? bgClass : '')
                        )}
                    />
                    <div className={cn("pointer-events-none absolute right-3 text-slate-400", compact ? "top-3" : "top-4")}>
                        <Search size={compact ? 14 : 18} />
                    </div>
                    {showModel && brand && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-[#dfe7df] bg-white shadow-[0_22px_50px_-32px_rgba(15,15,16,0.35)]">
                            {suggestedModels.length > 0 && <div className="sticky top-0 bg-[#f6f8f6] p-2 text-[10px] font-bold text-slate-400">{brand} の候補</div>}
                            {(model ? searchModels(model, suggestedModels) : suggestedModels).slice(0, 15).map(m => (
                                <div
                                    key={m}
                                    className="cursor-pointer border-b border-slate-50 px-4 py-3 text-sm font-medium text-slate-700 last:border-0 hover:bg-[#f4f8f5]"
                                    onMouseDown={(e) => { e.preventDefault(); handleModelSelect(m); }}
                                >
                                    {m}
                                </div>
                            ))}
                            {model.length > 1 && !suggestedModels.includes(model) && (
                                <div className="border-t border-slate-100 px-4 py-3 text-xs italic text-slate-500">
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
