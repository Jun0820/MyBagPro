import React from 'react';
import { Target, Trophy, Clock, Lightbulb, ShoppingCart, Search } from 'lucide-react';
import { getAffiliateUrl } from '../utils/affiliate';

interface AiResponseDisplayProps {
    responseText: string;
}

export const AiResponseDisplay: React.FC<AiResponseDisplayProps> = ({ responseText }) => {
    // 1. レスポンスのパース処理
    const extractSection = (titleRegex: RegExp) => {
        const match = responseText.match(titleRegex);
        if (!match) return null;
        
        // title以降のテキストを取得し、次の "##" までの間をコンテンツとする
        const startIdx = match.index! + match[0].length;
        const remaining = responseText.slice(startIdx);
        const endIdx = remaining.indexOf('##');
        const contentStr = endIdx === -1 ? remaining : remaining.slice(0, endIdx);
        
        return contentStr.trim();
    };

    // セクションの中身をキーバリューでパースする関数（リスト形式 (- **キー**: バリュー) を想定）
    const parseListItems = (text: string) => {
        const items: Record<string, string> = {};
        let description = '';
        
        const lines = text.split('\n');
        for (const line of lines) {
            const listMatch = line.match(/^-\s*\*\*(.+?)\*\*\s*:\s*(.+)$/);
            if (listMatch) {
                items[listMatch[1].trim()] = listMatch[2].trim();
            } else if (line.trim().startsWith('- ')) {
                 description += line.replace('- ', '').trim() + '\n';
            } else {
                description += line.trim() + '\n';
            }
        }
        return { items, description: description.trim() };
    };

    const summaryStr = extractSection(/##\s*🎯\s*診断サマリー/);
    const bestMatchStr = extractSection(/##\s*🏆\s*ベストマッチ提案/);
    const vintageStr = extractSection(/##\s*⏳\s*専門家が厳選する中古名器/);
    const adviceStr = extractSection(/##\s*⚙️\s*セッティングのワンポイントアドバイス/);

    const bestMatch = bestMatchStr ? parseListItems(bestMatchStr) : null;
    const vintageMatch = vintageStr ? parseListItems(vintageStr) : null;

    // 2. UI定義
    return (
        <div className="space-y-6 md:space-y-8 mt-[-2rem] relative z-20">
            {/* サマリーセクション：ヒーローからオーバーラップするグラスモーフィズム */}
            {summaryStr && (
                <div className="bg-white/80 backdrop-blur-xl border border-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 mx-4 md:mx-0">
                    <h3 className="text-sm font-bold text-golf-600 tracking-widest font-eng flex items-center gap-2 mb-3">
                        <Target size={16} /> SWING DNA SUMMARY
                    </h3>
                    <p className="text-slate-800 font-medium leading-relaxed md:text-lg">
                        {summaryStr}
                    </p>
                </div>
            )}

            {/* ベストマッチ提案（メイン） */}
            {bestMatch && bestMatch.items['ヘッド'] && (
                <div className="bg-gradient-to-br from-slate-900 to-trust-navy rounded-[2rem] p-1 border border-slate-700 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-golf-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-[1.8rem] p-6 md:p-8 relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <span className="bg-golf-500 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-golf-500/30">
                                <Trophy size={14} /> Best Match
                            </span>
                        </div>
                        
                        <div className="mb-2">
                            <h4 className="text-white text-3xl md:text-5xl font-black tracking-tight font-eng drop-shadow-md">
                                {bestMatch.items['ヘッド']}
                            </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Loft</span>
                                <span className="text-white font-bold">{bestMatch.items['ロフト角'] || '-'}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Shaft</span>
                                <span className="text-white font-bold text-sm truncate">{bestMatch.items['シャフト'] || '-'}</span>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {bestMatch.items['おすすめの理由'] || bestMatch.description}
                            </p>
                        </div>

                        {/* アフィリエイトボタン群 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <a href={getAffiliateUrl('amazon', bestMatch.items['ヘッド'])} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#FF9900] hover:bg-[#FF9900]/90 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#FF9900]/20 active:scale-95 text-[10px] md:text-xs">
                                <ShoppingCart size={16} />
                                Amazon
                            </a>
                            <a href={getAffiliateUrl('rakuten', bestMatch.items['ヘッド'])} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#BF0000] hover:bg-[#BF0000]/90 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#BF0000]/20 active:scale-95 text-[10px] md:text-xs">
                                <ShoppingCart size={16} />
                                楽天市場
                            </a>
                            <a href={getAffiliateUrl('rakuten_golf_partner', bestMatch.items['ヘッド'], 'RAKUTEN_GOLF_PARTNER' as any)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95 text-[10px] md:text-xs">
                                <Search size={16} />
                                Golf Partner
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* 中古名器提案 */}
            {vintageMatch && vintageMatch.items['ヘッド'] && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-[2rem] p-6 md:p-8 border border-amber-200/50 shadow-xl shadow-amber-900/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                        <Clock size={120} />
                    </div>
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 border border-amber-200 bg-white/50 px-3 py-1 rounded-full">
                            <Clock size={14} /> Vintage Choice
                        </span>
                        
                        <h4 className="text-slate-800 text-2xl md:text-3xl font-black tracking-tight mb-2">
                            {vintageMatch.items['ヘッド']}
                        </h4>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg">
                                ロフト: {vintageMatch.items['ロフト角'] || '-'}
                            </span>
                            <span className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg truncate max-w-[200px]">
                                シャフト: {vintageMatch.items['シャフト'] || '-'}
                            </span>
                        </div>

                        <p className="text-slate-600 text-sm leading-relaxed mb-6 bg-white/60 p-4 rounded-xl">
                            {vintageMatch.items['おすすめの理由'] || vintageMatch.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a href={getAffiliateUrl('rakuten_golf_partner', vintageMatch.items['ヘッド'], 'RAKUTEN_GOLF_PARTNER' as any)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 text-xs shadow-md">
                                <Search size={18} />
                                Golf Partner 中古在庫
                            </a>
                            <a href={getAffiliateUrl('amazon', vintageMatch.items['ヘッド'])} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95 text-xs shadow-md">
                                <ShoppingCart size={18} />
                                Amazonで中古を探す
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ワンポイントアドバイス */}
            {adviceStr && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                    <h5 className="font-bold text-blue-800 flex items-center gap-2 mb-3 text-sm">
                        <Lightbulb size={18} /> ワンポイントアドバイス
                    </h5>
                    <div className="text-sm text-blue-900/80 leading-relaxed font-medium">
                        {adviceStr.split('\n').map((line, i) => (
                            <p key={i} className="mb-1">{line.replace(/^- /, '')}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
