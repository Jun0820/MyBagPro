import { useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Target, User, Share2, Shield, FileText, Info, Newspaper } from 'lucide-react';

export const Sitemap = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: 'メインメニュー',
            items: [
                { name: 'ホーム', path: '/', icon: <Home size={18} /> },
                { name: 'My Page (クラブ管理)', path: '/mypage', icon: <User size={18} /> },
            ]
        },
        {
            title: 'AI診断機能',
            items: [
                { name: 'AIクラブ診断', path: '/diagnosis', icon: <Target size={18} /> },
                { name: 'AIボール診断', path: '/ball-diagnosis', icon: <Target size={18} /> },
                { name: '診断結果表示', path: '/result', icon: <ClipboardList size={18} /> },
            ]
        },
        {
            title: 'ソーシャル・その他',
            items: [
                { name: 'バッグ共有', path: '/bag', icon: <Share2 size={18} /> },
                { name: '更新記事', path: '/articles', icon: <Newspaper size={18} /> },
            ]
        },
        {
            title: '規約・ポリシー',
            items: [
                { name: 'プライバシーポリシー', path: '/privacy', icon: <Shield size={18} />, isLegal: 'privacy' },
                { name: '利用規約', path: '/terms', icon: <FileText size={18} />, isLegal: 'terms' },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 md:py-20">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-left">
                    <h1 className="text-3xl md:text-5xl font-black text-trust-navy mb-4 flex items-center gap-3">
                        <Info className="text-golf-600" size={32} />
                        サイトマップ
                    </h1>
                    <p className="text-slate-500 font-medium">
                        MY BAG PRO の全コンテンツ一覧です。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {sections.map((section, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <h2 className="text-lg font-black text-trust-navy mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                                {section.title}
                            </h2>
                            <ul className="space-y-4">
                                {section.items.map((item, iIdx) => (
                                    <li key={iIdx}>
                                        <button
                                            onClick={() => navigate(item.path)}
                                            className="flex items-center gap-3 text-slate-600 hover:text-golf-600 font-bold transition-colors group"
                                        >
                                            <span className="text-slate-400 group-hover:text-golf-500 transition-colors">
                                                {item.icon}
                                            </span>
                                            {item.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-trust-navy font-bold text-sm underline underline-offset-4"
                    >
                        ホームに戻る
                    </button>
                </div>
            </div>
        </div>
    );
};
