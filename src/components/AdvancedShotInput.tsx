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

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 mb-6">
                <p className="text-sm text-blue-900 font-bold leading-relaxed">
                    <span className="text-xl mr-2">💡</span>
                    Trackman・GCQuad等の計測データをお持ちの場合は入力してください。
                    <br /><span className="font-normal text-xs text-blue-800/80 block mt-2">正確な数値があれば、スピン量や打ち出し角に基づいたプロレベルのボール選定が可能です。</span>
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Head Speed (m/s)</label>
                    <input
                        type="number"
                        placeholder="例: 42.5"
                        value={getValue('headSpeed')}
                        onChange={e => handleChange('headSpeed', e.target.value)}
                        className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-golf-500 focus:ring-4 focus:ring-golf-50 transition-all font-eng text-xl font-bold shadow-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Back Spin (rpm)</label>
                    <input
                        type="number"
                        placeholder="例: 2400"
                        value={getValue('backSpin')}
                        onChange={e => handleChange('backSpin', e.target.value)}
                        className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-golf-500 focus:ring-4 focus:ring-golf-50 transition-all font-eng text-xl font-bold shadow-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Launch Angle (deg)</label>
                    <input
                        type="number"
                        placeholder="例: 14.0"
                        value={getValue('launchAngle')}
                        onChange={e => handleChange('launchAngle', e.target.value)}
                        className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-golf-500 focus:ring-4 focus:ring-golf-50 transition-all font-eng text-xl font-bold shadow-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Carry (yard)</label>
                    <input
                        type="number"
                        placeholder="例: 230"
                        value={getValue('carryDistance')}
                        onChange={e => handleChange('carryDistance', e.target.value)}
                        className="w-full p-4 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-golf-500 focus:ring-4 focus:ring-golf-50 transition-all font-eng text-xl font-bold shadow-sm"
                    />
                </div>
            </div>

            <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Side Spin (rpm)</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="例: -500 (フック) / 500 (スライス)"
                        value={getValue('sideSpin')}
                        onChange={e => handleChange('sideSpin', e.target.value)}
                        className="flex-1 p-4 bg-white text-slate-900 border border-slate-200 rounded-xl outline-none focus:border-golf-500 focus:ring-4 focus:ring-golf-50 transition-all font-eng text-xl font-bold shadow-sm"
                    />
                </div>
                <p className="text-xs text-slate-400 mt-2 ml-1">※ マイナス=左回転(フック系)、プラス=右回転(スライス系)</p>
            </div>
        </div>
    );
};
