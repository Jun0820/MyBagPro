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
               saveStatus === 'error' ? 'Error' : 'Local'}
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

      <main className="pt-32 pb-24 px-4 md:px-8 max-w-5xl mx-auto relative z-10">
        {children}
      </main>

      <footer className="bg-trust-navy text-white pt-16 pb-8 px-4 mt-auto relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-slate-400 font-eng">© 2026 My Bag Pro</div>
          <div className="flex gap-8 text-xs font-bold text-slate-500 tracking-wide">
            <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors">PRIVACY</button>
            <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors">TERMS</button>
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
          </Routes>
        </Layout>
      </HashRouter>
    </DiagnosisProvider>
  );
}

export default App;
