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
        <div className="w-full bg-slate-50/50 min-h-screen font-sans text-trust-navy overflow-x-hidden">
            {/* HERO SECTION — My Bag = あなたのゴルフ名刺 */}
            <section className="relative w-full overflow-hidden bg-white pt-20 pb-16 md:pt-32 md:pb-24">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-b from-golf-100 to-golf-50 blur-3xl opacity-60 animate-float"></div>
                    <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-trust-platinum to-blue-50 blur-3xl opacity-60 animate-pulse-slow"></div>
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
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-trust-navy via-golf-600 to-trust-navy">最高の名刺になる。</span>
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
                                className="relative flex items-center justify-center gap-4 bg-trust-navy text-white px-10 py-5 rounded-full font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                            >
                                <Plus size={24} /> My Bagをつくる（無料） <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-golf-600 to-trust-navy opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            </button>
                        </div>

                        {/* SECONDARY: AI診断リンク - Redesigned as interactive cards for Phase 3 */}
                        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn" style={{animationDelay: '0.3s', animationFillMode: 'both'}}>
                            <button
                                onClick={handleStartDiagnosis}
                                className="group relative bg-white/50 backdrop-blur-sm border border-trust-platinum hover:border-golf-300 rounded-3xl p-6 text-left transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-golf-50 text-golf-600 flex items-center justify-center group-hover:bg-golf-500 group-hover:text-white transition-colors">
                                        <Activity size={20} />
                                    </div>
                                    <span className="font-eng text-xs font-black tracking-widest text-slate-400 uppercase">Pro Fitting</span>
                                </div>
                                <h3 className="text-lg font-black text-trust-navy mb-1">AI クラブ診断</h3>
                                <p className="text-xs text-trust-slate leading-relaxed">セッティングの悩みを選んで、AIが贈る「運命の1本」を見つける。</p>
                                <ChevronRight className="absolute right-6 bottom-6 w-5 h-5 text-slate-300 group-hover:text-golf-500 group-hover:translate-x-1 transition-all" />
                            </button>

                            <button
                                onClick={() => navigate('/ball-diagnosis')}
                                className="group relative bg-white/50 backdrop-blur-sm border border-trust-platinum hover:border-cyan-300 rounded-3xl p-6 text-left transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                            >
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                                        <Brain size={20} />
                                    </div>
                                    <span className="font-eng text-xs font-black tracking-widest text-slate-400 uppercase">AI Analysis</span>
                                </div>
                                <h3 className="text-lg font-black text-trust-navy mb-1">AI ボール診断</h3>
                                <p className="text-xs text-trust-slate leading-relaxed">パワーとクラブに合わせて、スコアを伸ばす「最適球」を導き出す。</p>
                                <ChevronRight className="absolute right-6 bottom-6 w-5 h-5 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>

                        {/* Benefits */}
                        <div className="mt-12 flex flex-wrap gap-8 text-[10px] font-black tracking-[0.1em] text-slate-400 animate-fadeIn uppercase" style={{animationDelay: '0.4s', animationFillMode: 'both'}}>
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-golf-500" /> 完全無料</span>
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-trust-navy" /> 2026最新モデル対応</span>
                            <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-cyan-500" /> SNSシェア対応</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24 md:py-32 bg-slate-50/80 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-golf-200/20 blur-[100px] rounded-full"></div>
                    <div className="absolute bottom-[10%] right-[5%] w-64 h-64 bg-cyan-200/20 blur-[100px] rounded-full"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <span className="font-eng text-[10px] font-black tracking-[0.4em] text-golf-500 uppercase mb-4 block">Experience Guide</span>
                        <h2 className="text-3xl md:text-5xl font-black text-trust-navy mb-6 tracking-tight leading-tight">
                            理想の14本を、<span className="text-golf-600">3ステップ</span>で手に入れる
                        </h2>
                        <div className="w-12 h-1 bg-gradient-to-r from-golf-500 to-cyan-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-7xl mx-auto">
                        
                        {/* Step 1: Register */}
                        <div className="relative group">
                            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60 flex flex-col items-center text-center h-full hover:shadow-[0_20px_48px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2">
                                <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white flex items-center justify-center mb-8 transform -rotate-6 group-hover:rotate-0 transition-all duration-500 relative">
                                    <Plus size={44} strokeWidth={1} />
                                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-golf-500 text-white font-black flex items-center justify-center text-lg shadow-xl border-4 border-white">1</div>
                                </div>
                                <h3 className="text-2xl font-black text-trust-navy mb-4 tracking-tight">セッティングを登録</h3>
                                <p className="text-sm text-trust-slate leading-relaxed font-medium">
                                    ドライバーからパター、使用ボールまで。<br/>
                                    あなたの「今」を1分でマイバッグに記録。
                                </p>
                            </div>
                        </div>

                        {/* Step 2: Optimize */}
                        <div className="relative group">
                            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60 flex flex-col items-center text-center h-full hover:shadow-[0_20px_48px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-golf-400 to-golf-600 text-white flex items-center justify-center mb-8 transform rotate-3 group-hover:rotate-0 transition-all duration-500 relative shadow-lg">
                                    <Brain size={44} strokeWidth={1} />
                                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-trust-navy text-white font-black flex items-center justify-center text-lg shadow-xl border-4 border-white">2</div>
                                </div>
                                <h3 className="text-2xl font-black text-trust-navy mb-4 tracking-tight">AI診断で最適化</h3>
                                <p className="text-sm text-trust-slate leading-relaxed font-medium">
                                    蓄積されたデータとGemini AIが、<br/>
                                    次のスコアアップに必要な1本を正確に予測。
                                </p>
                            </div>
                        </div>

                        {/* Step 3: Share */}
                        <div className="relative group">
                            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60 flex flex-col items-center text-center h-full hover:shadow-[0_20px_48px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2">
                                <div className="w-24 h-24 rounded-3xl bg-cyan-900 text-white flex items-center justify-center mb-8 transform -rotate-3 group-hover:rotate-0 transition-all duration-500 relative">
                                    <Share2 size={44} strokeWidth={1} />
                                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-cyan-400 text-white font-black flex items-center justify-center text-lg shadow-xl border-4 border-white">3</div>
                                </div>
                                <h3 className="text-2xl font-black text-trust-navy mb-4 tracking-tight">SNSでシェア</h3>
                                <p className="text-sm text-trust-slate leading-relaxed font-medium">
                                    生成されたURLをシェアするだけ。<br/>
                                    ゴルフ仲間とセッティング論義を始めよう。
                                </p>
                            </div>
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
