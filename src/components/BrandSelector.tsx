import React from 'react';
import { TargetCategory } from '../types/golf';

interface BrandSelectorProps {
    category: TargetCategory;
    selectedBrands: string[];
    preferenceMode: 'strict' | 'preferred' | 'any';
    onChange: (brands: string[]) => void;
    onPreferenceModeChange: (mode: 'strict' | 'preferred' | 'any') => void;
    customBrands?: string[]; // 任意のブランドリストを表示するためのプロパティ
}

const BALL_BRANDS = [
    'Titleist', 'Bridgestone', 'Callaway', 'TaylorMade', 'Srixon', 'Mizuno', 'Honma',
    'XXIO', 'Kasco', 'Volvik', 'Wilson', 'Snell', 'Kirkland', 'Vice'
];

const CLUB_BRANDS = [
    'Titleist', 'Callaway', 'TaylorMade', 'Ping', 'Srixon', 'Mizuno',
    'Bridgestone', 'Yamaha', 'Honma', 'XXIO', 'Cobra', 'PRGR'
];

const PREFERENCE_OPTIONS = [
    { value: 'strict' as const, label: '必須', desc: '選択ブランドのみ表示', icon: '🎯' },
    { value: 'preferred' as const, label: 'できれば', desc: '優先しつつ他も候補に', icon: '⭐' },
    { value: 'any' as const, label: 'こだわらない', desc: '全メーカーから最適を選定', icon: '🌐' }
];

export const BrandSelector: React.FC<BrandSelectorProps> = ({
    category,
    selectedBrands = [],
    preferenceMode = 'any',
    onChange,
    onPreferenceModeChange,
    customBrands
}) => {
    const brands = customBrands || (category === TargetCategory.BALL ? BALL_BRANDS : CLUB_BRANDS);

    const toggleBrand = (brand: string) => {
        if (selectedBrands.includes(brand)) {
            onChange(selectedBrands.filter(b => b !== brand));
        } else {
            onChange([...selectedBrands, brand]);
        }
    };

    const hasBrandSelected = selectedBrands.length > 0;

    return (
        <div className="space-y-6">
            {/* こだわり度セクション */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200">
                <label className="font-bold text-trust-navy text-base mb-4 block">こだわり度</label>
                <div className="flex flex-col md:flex-row gap-3">
                    {PREFERENCE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                onPreferenceModeChange(opt.value);
                                if (opt.value === 'any') {
                                    onChange([]); // こだわらない場合はブランド選択をクリア
                                }
                            }}
                            className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${preferenceMode === opt.value
                                ? 'border-golf-500 bg-golf-50 shadow-md'
                                : 'border-slate-200 bg-white hover:border-golf-200'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{opt.icon}</span>
                                <div>
                                    <div className={`font-bold ${preferenceMode === opt.value ? 'text-golf-800' : 'text-slate-600'}`}>
                                        {opt.label}
                                    </div>
                                    <div className="text-xs text-slate-400">{opt.desc}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ブランド選択セクション - こだわらない以外の場合のみ表示 */}
            {preferenceMode !== 'any' && (
                <div className="animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <label className="font-bold text-trust-navy text-lg">
                            {preferenceMode === 'strict' ? '🎯 必須ブランドを選択' : '⭐ 優先ブランドを選択'}
                        </label>
                        {hasBrandSelected && (
                            <span className="text-xs font-bold text-golf-600 bg-golf-50 px-3 py-1 rounded-full">
                                {selectedBrands.length}件選択中
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {brands.map(brand => {
                            const isSelected = selectedBrands.includes(brand);
                            return (
                                <button
                                    key={brand}
                                    onClick={() => toggleBrand(brand)}
                                    className={`
                                        relative p-4 rounded-xl border-2 font-bold text-sm md:text-base transition-all
                                        ${isSelected
                                            ? 'border-golf-500 bg-golf-50 text-golf-800 shadow-md transform scale-[1.02]'
                                            : 'border-slate-200 bg-white text-slate-500 hover:border-golf-200 hover:shadow-sm'
                                        }
                                    `}
                                >
                                    {isSelected && (
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-golf-500 rounded-full flex items-center justify-center text-white shadow-sm">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    {brand}
                                </button>
                            );
                        })}
                    </div>

                    {preferenceMode === 'strict' && hasBrandSelected && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-xs text-amber-700 font-medium">
                                ⚠️ 「必須」モードでは、選択したブランド以外の製品は診断結果に表示されません。
                            </p>
                        </div>
                    )}

                    {!hasBrandSelected && (
                        <p className="text-xs text-rose-500 mt-2 text-center font-medium">
                            ※ 1つ以上のブランドを選択してください
                        </p>
                    )}
                </div>
            )}

            {preferenceMode === 'any' && (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl">
                    🌐 全メーカーの中から、あなたに最適な製品を診断します
                </p>
            )}
        </div>
    );
};
