import { Brain, ChevronRight, Activity, ArrowRight, Share2, Plus } from 'lucide-react';
import { useDiagnosis } from '../context/DiagnosisContext';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
    const { user, setStep, resetDiagnosis } = useDiagnosis();
    const navigate = useNavigate();

    const handleStartDiagnosis = () => {
        resetDiagnosis();
        setStep(1);
        navigate('/diagnosis');
    };

    return (
        <div className="w-full bg-trust-platinum/20 min-h-screen font-sans text-trust-navy overflow-x-hidden">
            {/* HERO SECTION — My Bag = あなたのゴルフ名刺 */}
            <section className="relative w-full overflow-hidden bg-white pt-20 pb-16 md:pt-32 md:pb-24">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-b from-golf-100 to-golf-50 blur-3xl opacity-60 animate-float"></div>
                    <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-trust-platinum to-blue-50 blur-3xl opacity-60 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 right-[20%] w-[60%] h-[30%] rounded-t-full bg-gradient-to-t from-golf-50 to-transparent opacity-80"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-5xl mx-auto text-left">
                        {/* Trust Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-trust-navy to-trust-navy-light text-white rounded-full text-xs md:text-sm font-bold mb-8 shadow-lg shadow-trust-navy/20 ring-1 ring-white/20 backdrop-blur-md transform transition hover:scale-105 cursor-default">
                            <Share2 size={14} className="text-cyan-300" />
                            <span className="tracking-wider">ゴルファーのためのセッティング共有プラットフォーム</span>
                        </div>

                        {/* Welcome Back */}
                        {user?.isLoggedIn && (
                            <div className="mb-6 animate-fadeIn">
                                <span className="inline-block px-5 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-trust-platinum text-sm font-bold text-trust-slate shadow-sm">
                                    おかえりなさい、<span className="text-golf-600 font-black">{user.name}</span> さん
                                </span>
                            </div>
                        )}

                        {/* Main Copy */}
                        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-trust-navy mb-8 tracking-tight leading-[1.1] drop-shadow-sm animate-slideIn">
                            あなたのセッティングが、<br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-golf-500 to-trust-navy">最高の名刺になる。</span>
                        </h1>

                        <p className="text-trust-slate font-medium text-base md:text-xl max-w-2xl mb-12 leading-relaxed md:leading-loose animate-fadeIn" style={{animationDelay: '0.1s', animationFillMode: 'both'}}>
                            14本のクラブを登録して、あなただけのデジタルゴルフ名刺をつくろう。<br className="hidden md:block" />
                            ゴルフ仲間に「何使ってるの？」と聞かれたら、My Bagを見せるだけ。
                        </p>

                        {/* PRIMARY CTA: My Bag作成 */}
                        <div className="relative group animate-fadeIn flex justify-start" style={{animationDelay: '0.2s', animationFillMode: 'both'}}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-golf-400 to-trust-navy rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                            
                            <button
                                onClick={() => navigate('/mypage')}
                                className="relative flex items-center justify-center gap-4 bg-trust-navy text-white px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                            >
                                <Plus size={24} /> My Bagをつくる（無料） <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-golf-600 to-trust-navy opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            </button>
                        </div>

                        {/* SECONDARY: AI診断リンク */}
                        <div className="mt-8 animate-fadeIn flex flex-col sm:flex-row gap-6 items-center" style={{animationDelay: '0.25s', animationFillMode: 'both'}}>
                            <button
                                onClick={handleStartDiagnosis}
                                className="text-base text-trust-slate/80 hover:text-golf-600 transition-colors font-bold flex items-center gap-2"
                            >
                                🎯 クラブ選びに迷ったら → <span className="text-golf-600 underline underline-offset-4">AIクラブ診断</span>
                            </button>
                            <span className="text-slate-300 hidden sm:inline">|</span>
                            <button
                                onClick={() => navigate('/ball-diagnosis')}
                                className="text-base text-trust-slate/80 hover:text-cyan-600 transition-colors font-bold flex items-center gap-2"
                            >
                                ⚪ <span className="text-cyan-600 underline underline-offset-4">ボール診断</span>
                            </button>
                        </div>

                        {/* Benefits */}
                        <div className="mt-12 flex flex-wrap gap-8 text-sm font-bold text-trust-slate animate-fadeIn" style={{animationDelay: '0.3s', animationFillMode: 'both'}}>
                            <span className="flex items-center gap-2"><Activity size={18} className="text-golf-500" /> 完全無料</span>
                            <span className="flex items-center gap-2"><Brain size={18} className="text-trust-navy" /> 会員登録不要</span>
                            <span className="flex items-center gap-2"><Share2 size={18} className="text-cyan-500" /> SNSシェア対応</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-20 md:py-32 bg-trust-platinum/30 relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-trust-navy mb-4 tracking-tight">
                            3ステップで、あなたの名刺が完成
                        </h2>
                        <p className="text-trust-slate text-sm md:text-base font-medium mt-4">
                            セッティングを登録 → AI診断で最適化 → SNSでシェア
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-7xl mx-auto">
                        
                        {/* Step 1: Register */}
                        <div className="relative flex flex-col items-start text-left group bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-trust-platinum/50 hover:-translate-y-2">
                            <div className="w-20 h-20 rounded-2xl bg-slate-50 text-trust-slate flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-trust-navy group-hover:text-white transition-all duration-300 transform -rotate-3 group-hover:rotate-0 shadow-sm">
                                <Plus size={40} strokeWidth={1.5} />
                            </div>
                            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-trust-navy text-white font-black flex items-center justify-center text-xl shadow-lg border-4 border-white">1</div>
                            <h3 className="text-2xl font-black text-trust-navy mb-4 tracking-tight">セッティングを登録</h3>
                            <p className="text-trust-slate text-base leading-relaxed font-medium">
                                ドライバーからパターまで14本のクラブとボールを登録。ブランド、モデル、シャフトまで記録できます。
                            </p>
                        </div>

                        {/* Step 2: Optimize */}
                        <div className="relative flex flex-col items-start text-left group bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-trust-platinum/50 hover:-translate-y-2" style={{transitionDelay: '50ms'}}>
                            <div className="w-20 h-20 rounded-2xl bg-golf-50 text-golf-600 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-golf-500 group-hover:text-white transition-all duration-300 transform rotate-3 group-hover:rotate-0 shadow-sm">
                                <Brain size={40} strokeWidth={1.5} />
                            </div>
                            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-trust-navy text-white font-black flex items-center justify-center text-xl shadow-lg border-4 border-white">2</div>
                            <h3 className="text-2xl font-black text-trust-navy mb-4 tracking-tight">AI診断で最適化</h3>
                            <p className="text-trust-slate text-base leading-relaxed font-medium">
                                「このクラブ、自分に合ってる？」AI診断で各カテゴリのベストモデルを提案。My Bagをアップグレードしよう。
                            </p>
                        </div>

                        {/* Step 3: Share */}
                        <div className="relative flex flex-col items-start text-left group bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-trust-platinum/50 hover:-translate-y-2" style={{transitionDelay: '100ms'}}>
                            <div className="w-20 h-20 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300 transform -rotate-3 group-hover:rotate-0 shadow-sm">
                                <Share2 size={40} strokeWidth={1.5} />
                            </div>
                            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-trust-navy text-white font-black flex items-center justify-center text-xl shadow-lg border-4 border-white">3</div>
                            <h3 className="text-2xl font-black text-trust-navy mb-4 tracking-tight">SNSでシェア</h3>
                            <p className="text-trust-slate text-base leading-relaxed font-medium">
                                完成したMy BagをXやInstagramに投稿。ゴルフ仲間と「どっちのセッティングが良い？」で盛り上がろう。
                            </p>
                        </div>
                    </div>
                    
                    {/* Bottom CTA */}
                    <div className="mt-20 text-center">
                        <button
                            onClick={() => navigate('/mypage')}
                            className="inline-flex items-center gap-2 text-golf-600 font-bold hover:text-golf-800 transition-colors group"
                        >
                            <span className="border-b-2 border-golf-600/30 group-hover:border-golf-800 pb-1 pr-1">早速、My Bagをつくる</span>
                            <ChevronRight size={18} className="translate-y-0.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};
