import React from 'react';
import type { ShotData } from '../types/golf_ball';

interface Props {
    data: ShotData | undefined;
    onChange: (data: ShotData) => void;
}

export const AdvancedShotInput: React.FC<Props> = ({ data, onChange }) => {
    const handleChange = (key: keyof ShotData, value: string) => {
        const numVal = parseFloat(value);
        onChange({
            ...data,
            [key]: isNaN(numVal) ? undefined : numVal
        });
    };

    const getValue = (key: keyof ShotData) => data?.[key] || '';

    const inputClass = "w-full rounded-xl border border-[#d8e2d9] bg-white px-4 py-3.5 text-[15px] font-bold text-slate-900 outline-none transition-all focus:border-[#176534] focus:ring-4 focus:ring-[#176534]/8";

    return (
        <div className="animate-fadeIn space-y-5">
            <div className="mb-1 rounded-[22px] border border-[#e5ece6] bg-[#f8faf8] p-4 md:p-5">
                <p className="text-sm font-bold leading-7 text-[#1d3a27]">
                    Trackman・GCQuad などの計測データをお持ちなら入力してください。
                    <span className="mt-1 block text-xs font-medium leading-6 text-slate-500">
                        正確な数値があるほど、打ち出し角やスピン量まで踏み込んだ提案ができます。
                    </span>
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-5">
                <div>
                    <label className="mb-2 block text-[11px] font-bold text-slate-500 md:text-xs">ヘッドスピード</label>
                    <input
                        type="number"
                        placeholder="例: 42.5"
                        value={getValue('headSpeed')}
                        onChange={e => handleChange('headSpeed', e.target.value)}
                        className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">m/s</p>
                </div>
                <div>
                    <label className="mb-2 block text-[11px] font-bold text-slate-500 md:text-xs">バックスピン量</label>
                    <input
                        type="number"
                        placeholder="例: 2400"
                        value={getValue('backSpin')}
                        onChange={e => handleChange('backSpin', e.target.value)}
                        className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">rpm</p>
                </div>
                <div>
                    <label className="mb-2 block text-[11px] font-bold text-slate-500 md:text-xs">打ち出し角</label>
                    <input
                        type="number"
                        placeholder="例: 14.0"
                        value={getValue('launchAngle')}
                        onChange={e => handleChange('launchAngle', e.target.value)}
                        className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">度</p>
                </div>
                <div>
                    <label className="mb-2 block text-[11px] font-bold text-slate-500 md:text-xs">キャリー</label>
                    <input
                        type="number"
                        placeholder="例: 230"
                        value={getValue('carryDistance')}
                        onChange={e => handleChange('carryDistance', e.target.value)}
                        className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">yd</p>
                </div>
            </div>

            <div className="pt-1">
                <label className="mb-2 block text-[11px] font-bold text-slate-500 md:text-xs">サイドスピン</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="例: -500 (フック) / 500 (スライス)"
                        value={getValue('sideSpin')}
                        onChange={e => handleChange('sideSpin', e.target.value)}
                        className={inputClass}
                    />
                </div>
                <p className="ml-1 mt-2 text-xs text-slate-400">※ マイナス=左回転(フック系)、プラス=右回転(スライス系)</p>
            </div>
        </div>
    );
};
