import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, Loader2, LogOut } from 'lucide-react';
import { DiagnosisProvider, useDiagnosis } from './context/DiagnosisContext';
import { AccountAuth } from './features/auth/AccountAuth';
import { LegalPage } from './components/LegalPage';
import { Home } from './pages/Home';
import { DiagnosisWizard } from './pages/DiagnosisWizard';
import { ResultPage } from './pages/ResultPage';
import { MyGearPage } from './pages/MyGearPage';
import { SharedBag } from './pages/SharedBag';
import { ProsSettingsPage } from './pages/ProsSettingsPage';
import { UsersSettingsPage } from './pages/UsersSettingsPage';
import { DriversCatalogPage } from './pages/DriversCatalogPage';
import { ProSettingDetailPage } from './pages/ProSettingDetailPage';
import { DriverDetailPage } from './pages/DriverDetailPage';
import { BuyPage } from './pages/BuyPage';
import { ComparePage } from './pages/ComparePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import BallDiagnosisApp from './pages/ball-diagnosis/BallDiagnosisApp';
import { Sitemap } from './pages/Sitemap';
import { useState, useEffect } from 'react';
import { INITIAL_PROFILE } from './types/golf';
import { supabase } from './lib/supabase';
import { SeoManager } from './components/SeoManager';

// Layout Component (Internal to App for simplicity, could be separate)
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, setUser, setProfile, showAuth, setShowAuth, saveStatus, resetDiagnosis } = useDiagnosis();
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const navigate = useNavigate();

  const handleMyPageClick = () => {
    if (user.isLoggedIn) {
      navigate('/mypage');
    } else {
      setShowAuth(true); // Or navigate to login page if you have one, but modal is good for login
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('ログアウトしますか？\n保存されていない変更は失われます。')) return;
    await supabase.auth.signOut();
    setUser({ 
        id: '',
        email: '',
        name: '',
        memberSince: '',
        isLoggedIn: false,
        history: []
    });
    setProfile(INITIAL_PROFILE);
    localStorage.removeItem('mybagpro_user');
    localStorage.removeItem('mybagpro_profile');
    resetDiagnosis();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full font-sans relative bg-slate-50/50 flex flex-col">
      {/* Subtle global background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-500">
        <div className="px-6 py-3 flex justify-between items-center bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-full">
          <a href="#/" className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <div className="absolute inset-0 bg-golf-400 blur-lg opacity-30 group-hover:opacity-60 transition-opacity rounded-full"></div>
              <div className="w-10 h-10 bg-gradient-to-br from-golf-500 to-golf-700 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-eng text-lg font-[900] tracking-tighter text-trust-navy leading-none">
                MY <span className="bg-gradient-to-r from-golf-600 to-golf-800 bg-clip-text text-transparent">BAG</span> PRO
              </span>
              <span className="text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase mt-0.5">AI Fitting Platform</span>
            </div>
          </a>

          <div className="flex items-center gap-4">
            {/* Save Status - Redesigned as a floating dot for desktop */}
            <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-200">
              <div className="relative">
                 {saveStatus === 'saving' ? (
                   <Loader2 size={12} className="animate-spin text-golf-500" />
                 ) : (
                   <div className={`w-2 h-2 rounded-full ${
                     saveStatus === 'saved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                     saveStatus === 'error' ? 'bg-red-500' : 'bg-slate-300'
                   }`} />
                 )}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {saveStatus === 'saving' ? 'Syncing' : user.isLoggedIn ? 'Cloud Sync' : 'Local'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMyPageClick}
                className={`group flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[10px] tracking-[0.1em] shadow-xl active:scale-95 transition-all duration-300 ${
                  user.isLoggedIn 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-200' 
                  : 'bg-gradient-to-r from-golf-500 to-golf-600 text-white hover:shadow-golf-500/30'
                }`}
              >
                {user.isLoggedIn ? <User size={14} className="group-hover:scale-110 transition-transform" /> : <LogIn size={14} />} 
                <span>{user.isLoggedIn ? 'マイページ' : 'ログイン'}</span>
                {user.isLoggedIn && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />}
              </button>

              {user.isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-all active:scale-95 border border-red-100 shadow-sm group"
                  title="ログアウト"
                >
                  <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 md:pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        {children}
      </main>

      <footer className="bg-trust-navy text-white pt-20 pb-12 px-4 mt-auto relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16 px-4">
          <div className="col-span-1 md:col-span-1">
            <a href="#/" className="flex items-center gap-3 mb-6 group">
              <span className="font-eng text-2xl font-black tracking-tight text-white leading-none">MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-golf-400 to-golf-600">BAG</span> PRO</span>
            </a>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              あなたのゴルフセッティングを最適な名刺に。AI診断とコミュニティで、最高の14本を。
            </p>
          </div>
          
          <div className="grid grid-cols-2 col-span-1 md:col-span-2 gap-8">
            <div>
              <h4 className="font-bold text-sm mb-6 text-white tracking-widest uppercase">Features</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-400">
                <li><button onClick={() => navigate('/settings/pros')} className="hover:text-golf-400 transition-colors">プロのセッティング</button></li>
                <li><button onClick={() => navigate('/settings/users')} className="hover:text-golf-400 transition-colors">みんなのMy Bag</button></li>
                <li><button onClick={() => navigate('/clubs/drivers')} className="hover:text-golf-400 transition-colors">人気ドライバー</button></li>
                <li><button onClick={() => navigate('/articles')} className="hover:text-golf-400 transition-colors">更新記事</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-6 text-white tracking-widest uppercase">About</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-400">
                <li><button onClick={() => navigate('/sitemap')} className="hover:text-golf-400 transition-colors">サイトマップ</button></li>
                <li><button onClick={() => setShowLegal('terms')} className="hover:text-golf-400 transition-colors">利用規約</button></li>
                <li><button onClick={() => setShowLegal('privacy')} className="hover:text-golf-400 transition-colors">プライバシーポリシー</button></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 px-4">
          <div className="text-[10px] text-slate-500 font-eng tracking-widest">© 2026 MY BAG PRO. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {showLegal && <LegalPage type={showLegal} onClose={() => setShowLegal(null)} />}

      {showAuth && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <AccountAuth
            onLogin={(u, p) => {
              setUser(u);
              if (p) setProfile(p);
              setShowAuth(false);
              navigate('/mypage'); // Navigate after login
            }}
            onClose={() => setShowAuth(false)}
            currentProfile={profile}
          />
        </div>
      )}
    </div>
  );
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Main App Component with Providers and Router
function App() {
  return (
    <DiagnosisProvider>
      <HashRouter>
        <SeoManager />
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings/pros" element={<ProsSettingsPage />} />
            <Route path="/settings/pros/:slug" element={<ProSettingDetailPage />} />
            <Route path="/settings/users" element={<UsersSettingsPage />} />
            <Route path="/clubs/drivers" element={<DriversCatalogPage />} />
            <Route path="/clubs/drivers/:slug" element={<DriverDetailPage />} />
            <Route path="/buy/:category/:slug" element={<BuyPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            <Route path="/ball-diagnosis" element={<BallDiagnosisApp />} />
            <Route path="/diagnosis" element={<DiagnosisWizard />} />
            <Route path="/diagnosis/:category" element={<DiagnosisWizard />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/result/:club" element={<ResultPage />} />
            <Route path="/result/:club/:mode" element={<ResultPage />} />
            <Route path="/mypage" element={<MyGearPage />} />
            <Route path="/mybag/create" element={<MyGearPage />} />
            <Route path="/bag" element={<SharedBag />} />
            <Route path="/sitemap" element={<Sitemap />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DiagnosisProvider>
  );
}

export default App;
