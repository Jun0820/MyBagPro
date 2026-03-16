import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, Check, Cloud, AlertCircle, Loader2 } from 'lucide-react';
import { DiagnosisProvider, useDiagnosis } from './context/DiagnosisContext';
import { AccountAuth } from './features/auth/AccountAuth';
import { LegalPage } from './components/LegalPage';
import { Home } from './pages/Home';
import { DiagnosisWizard } from './pages/DiagnosisWizard';
import { ResultPage } from './pages/ResultPage';
import { MyGearPage } from './pages/MyGearPage';
import { SharedBag } from './pages/SharedBag';
import BallDiagnosisApp from './pages/ball-diagnosis/BallDiagnosisApp';
import { Sitemap } from './pages/Sitemap';
import { useState, useEffect } from 'react';

// Layout Component (Internal to App for simplicity, could be separate)
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, setUser, setProfile, showAuth, setShowAuth, saveStatus } = useDiagnosis();
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const navigate = useNavigate();

  const handleMyPageClick = () => {
    if (user.isLoggedIn) {
      navigate('/mypage');
    } else {
      setShowAuth(true); // Or navigate to login page if you have one, but modal is good for login
    }
  };

  return (
    <div className="min-h-screen w-full font-sans relative">
      <header className="fixed top-4 left-4 right-4 z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm rounded-full max-w-5xl mx-auto transition-all">
        <a href="#/" className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <div className="absolute inset-0 bg-golf-400 blur-md opacity-20 group-hover:opacity-40 transition-opacity rounded-full animate-pulse-slow"></div>
            <svg className="w-8 h-8 text-golf-600 relative z-10 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <span className="font-eng text-xl font-black tracking-tight text-trust-navy leading-none">MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-golf-500 to-golf-700">BAG</span> PRO</span>
        </a>
        <div className="flex items-center gap-3">
          {/* Save Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold tracking-wider text-slate-400">
            {saveStatus === 'saving' && <Loader2 size={12} className="animate-spin text-golf-500" />}
            {saveStatus === 'saved' && <Check size={12} className="text-emerald-500" />}
            {saveStatus === 'error' && <AlertCircle size={12} className="text-red-500" />}
            {saveStatus === 'idle' && <Cloud size={12} />}
            <span className="uppercase">
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'saved' ? 'Saved' : 
               saveStatus === 'error' ? 'Error' : 'Guest (On Device)'}
            </span>
          </div>

          <button
            onClick={handleMyPageClick}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs tracking-wider shadow-lg active:scale-95 transition-all ${user.isLoggedIn ? 'bg-gradient-to-r from-golf-600 to-golf-700 text-white shadow-golf-500/30' : 'bg-slate-900 text-white'}`}
          >
            {user.isLoggedIn ? <User size={14} /> : <LogIn size={14} />} 
            <span>{user.isLoggedIn ? 'MY PAGE' : 'LOGIN'}</span>
            {user.isLoggedIn && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />}
          </button>
        </div>
      </header>

      <main className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
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
                <li><button onClick={() => navigate('/diagnosis')} className="hover:text-golf-400 transition-colors">AIクラブ診断</button></li>
                <li><button onClick={() => navigate('/ball-diagnosis')} className="hover:text-golf-400 transition-colors">AIボール診断</button></li>
                <li><button onClick={() => navigate('/mypage')} className="hover:text-golf-400 transition-colors">マイページ / クラブ登録</button></li>
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
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ball-diagnosis" element={<BallDiagnosisApp />} />
            <Route path="/diagnosis" element={<DiagnosisWizard />} />
            <Route path="/diagnosis/:category" element={<DiagnosisWizard />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/result/:club" element={<ResultPage />} />
            <Route path="/result/:club/:mode" element={<ResultPage />} />
            <Route path="/mypage" element={<MyGearPage />} />
            <Route path="/bag" element={<SharedBag />} />
            <Route path="/sitemap" element={<Sitemap />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DiagnosisProvider>
  );
}

export default App;
