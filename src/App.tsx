import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, Loader2, LogOut, BookOpen, House, Newspaper, Users2 } from 'lucide-react';
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
  const location = useLocation();

  const navigationItems = [
    { label: 'ホーム', href: '/', icon: House },
    { label: 'プロ一覧', href: '/settings/pros', icon: BookOpen },
    { label: 'みんなのバッグ', href: '/settings/users', icon: Users2 },
    { label: '更新記事', href: '/articles', icon: Newspaper },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

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
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <a href="#/" className="flex items-center gap-3 cursor-pointer group min-w-0">
              <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-golf-500 to-golf-700 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="font-eng text-lg font-[900] tracking-tight text-trust-navy leading-none">
                  MY <span className="bg-gradient-to-r from-golf-600 to-golf-800 bg-clip-text text-transparent">BAG</span> PRO
                </div>
                <div className="mt-1 text-[11px] font-bold text-slate-500">クラブ選びを、もっと迷わず。</div>
              </div>
            </a>

            <div className="flex items-center gap-3">
              <div className="hidden xl:flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-500">
                {saveStatus === 'saving' ? (
                  <Loader2 size={12} className="animate-spin text-golf-500" />
                ) : (
                  <div
                    className={`h-2 w-2 rounded-full ${
                      saveStatus === 'saved'
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                        : saveStatus === 'error'
                          ? 'bg-red-500'
                          : 'bg-slate-300'
                    }`}
                  />
                )}
                <span>{saveStatus === 'saving' ? '保存中' : user.isLoggedIn ? 'アカウント保存' : 'ローカル保存'}</span>
              </div>

              <button
                onClick={handleMyPageClick}
                className={`group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-black active:scale-95 transition-all duration-300 ${
                  user.isLoggedIn 
                  ? 'bg-slate-900 text-white hover:bg-slate-800' 
                  : 'bg-gradient-to-r from-golf-500 to-golf-600 text-white hover:shadow-golf-500/30'
                }`}
              >
                {user.isLoggedIn ? <User size={14} className="group-hover:scale-110 transition-transform" /> : <LogIn size={14} />} 
                <span>{user.isLoggedIn ? 'マイページ' : 'ログイン'}</span>
                {user.isLoggedIn && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />}
              </button>

              {user.isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 transition-all active:scale-95 hover:bg-red-100 group"
                  title="ログアウト"
                >
                  <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    isActive(item.href)
                      ? 'bg-trust-navy text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-8">
        {children}
      </main>

      <footer className="relative z-10 mt-auto border-t border-slate-200 bg-white px-4 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <a href="#/" className="font-eng text-2xl font-black tracking-tight text-trust-navy">
              MY <span className="text-transparent bg-clip-text bg-gradient-to-r from-golf-500 to-golf-700">BAG</span> PRO
            </a>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              プロや上級者のクラブセッティングを見て、自分のバッグと比べ、AI診断や購入導線までつなげるためのゴルフ情報サイトです。
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black text-trust-navy">主要ページ</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><button onClick={() => navigate('/settings/pros')} className="hover:text-golf-700 transition-colors">プロのセッティング一覧</button></li>
              <li><button onClick={() => navigate('/settings/users')} className="hover:text-golf-700 transition-colors">みんなのMy Bag</button></li>
              <li><button onClick={() => navigate('/clubs/drivers')} className="hover:text-golf-700 transition-colors">人気ドライバー</button></li>
              <li><button onClick={() => navigate('/articles')} className="hover:text-golf-700 transition-colors">更新記事</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-trust-navy">サイト情報</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><button onClick={() => navigate('/sitemap')} className="hover:text-golf-700 transition-colors">サイトマップ</button></li>
              <li><button onClick={() => setShowLegal('terms')} className="hover:text-golf-700 transition-colors">利用規約</button></li>
              <li><button onClick={() => setShowLegal('privacy')} className="hover:text-golf-700 transition-colors">プライバシーポリシー</button></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>© 2026 MY BAG PRO. ALL RIGHTS RESERVED.</div>
          <div>公開するのは確認済みデータのみ。サンプルや推定値は掲載しません。</div>
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
