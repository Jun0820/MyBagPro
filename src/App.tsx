import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { User, LogIn, ShieldCheck, Stethoscope, CircleHelp } from 'lucide-react';
import { DiagnosisProvider, useDiagnosis } from './context/DiagnosisContext';
import { AccountAuth } from './features/auth/AccountAuth';
import { LegalPage } from './components/LegalPage';
import { Home } from './pages/Home';
import { SeoManager } from './components/SeoManager';

const DiagnosisWizard = lazy(() =>
  import('./pages/DiagnosisWizard').then((module) => ({ default: module.DiagnosisWizard }))
);
const ResultPage = lazy(() =>
  import('./pages/ResultPage').then((module) => ({ default: module.ResultPage }))
);
const MyGearPage = lazy(() =>
  import('./pages/MyGearPage').then((module) => ({ default: module.MyGearPage }))
);
const SharedBag = lazy(() =>
  import('./pages/SharedBag').then((module) => ({ default: module.SharedBag }))
);
const ProsSettingsPage = lazy(() =>
  import('./pages/ProsSettingsPage').then((module) => ({ default: module.ProsSettingsPage }))
);
const UsersSettingsPage = lazy(() =>
  import('./pages/UsersSettingsPage').then((module) => ({ default: module.UsersSettingsPage }))
);
const DriversCatalogPage = lazy(() =>
  import('./pages/DriversCatalogPage').then((module) => ({ default: module.DriversCatalogPage }))
);
const ProSettingDetailPage = lazy(() =>
  import('./pages/ProSettingDetailPage').then((module) => ({ default: module.ProSettingDetailPage }))
);
const DriverDetailPage = lazy(() =>
  import('./pages/DriverDetailPage').then((module) => ({ default: module.DriverDetailPage }))
);
const BuyPage = lazy(() =>
  import('./pages/BuyPage').then((module) => ({ default: module.BuyPage }))
);
const ComparePage = lazy(() =>
  import('./pages/ComparePage').then((module) => ({ default: module.ComparePage }))
);
const ArticlesPage = lazy(() =>
  import('./pages/ArticlesPage').then((module) => ({ default: module.ArticlesPage }))
);
const ArticleDetailPage = lazy(() =>
  import('./pages/ArticleDetailPage').then((module) => ({ default: module.ArticleDetailPage }))
);
const BallDiagnosisApp = lazy(() => import('./pages/ball-diagnosis/BallDiagnosisApp'));
const Sitemap = lazy(() =>
  import('./pages/Sitemap').then((module) => ({ default: module.Sitemap }))
);

const RouteLoading = () => (
  <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-slate-200 bg-white text-sm font-bold text-slate-500 shadow-sm">
    ページを読み込んでいます...
  </div>
);

// Layout Component (Internal to App for simplicity, could be separate)
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, setUser, setProfile, showAuth, setShowAuth } = useDiagnosis();
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
    <div className="min-h-screen w-full overflow-x-hidden font-sans relative bg-slate-50/50 flex flex-col">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
            <a href="/" className="mx-auto min-w-0 cursor-pointer md:mx-0 md:w-auto">
              <img
                src="/branding/logo-wordmark.png"
                alt="My Bag Pro"
                className="h-11 w-auto rounded-xl object-contain shadow-sm"
              />
            </a>

            <nav className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 md:flex md:flex-1 md:justify-end">
              <button
                onClick={() => navigate('/settings/pros')}
                className="inline-flex h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black leading-none text-slate-700 transition-colors hover:border-golf-300 hover:text-golf-700 sm:gap-2 sm:text-sm"
              >
                <ShieldCheck size={14} />
                <span>プロのセッティング</span>
              </button>

              <button
                onClick={() => navigate('/articles')}
                className="inline-flex h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black leading-none text-slate-700 transition-colors hover:border-golf-300 hover:text-golf-700 sm:gap-2 sm:text-sm"
              >
                <CircleHelp size={14} />
                <span>悩みから探す</span>
              </button>

              <button
                onClick={handleMyPageClick}
                className={`group inline-flex h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-3 text-[11px] font-black leading-none active:scale-95 transition-all duration-300 sm:gap-2 sm:text-sm ${
                  user.isLoggedIn
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-golf-300 hover:text-golf-700'
                }`}
              >
                {user.isLoggedIn ? <User size={14} className="group-hover:scale-110 transition-transform" /> : <LogIn size={14} />}
                <span>{user.isLoggedIn ? 'マイページ' : 'ログイン'}</span>
              </button>

              <button
                onClick={() => navigate('/diagnosis')}
                className="inline-flex h-11 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-golf-500 px-3 text-[11px] font-black leading-none text-white shadow-sm transition-all duration-300 hover:bg-golf-600 hover:shadow-golf-500/30 sm:gap-2 sm:text-sm"
              >
                <Stethoscope size={14} />
                <span>無料診断</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl overflow-x-hidden px-3 pb-24 pt-4 sm:px-4 md:px-6 md:pt-8">
        {children}
      </main>

      <footer className="relative z-10 mt-auto border-t border-slate-900/20 bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <a href="/" className="inline-flex">
              <img
                src="/branding/logo-wordmark.png"
                alt="My Bag Pro"
                className="h-12 w-auto rounded-xl"
              />
            </a>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
              プロや上級者のクラブセッティングを見て、自分のバッグと比べ、AI診断や購入導線までつなげるためのゴルフ情報サイトです。
            </p>
          </div>

          <div>
            <h4 className="text-sm font-black text-white">コンテンツ</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li><button onClick={() => navigate('/settings/pros')} className="hover:text-golf-300 transition-colors">プロセッティング</button></li>
              <li><button onClick={() => navigate('/articles')} className="hover:text-golf-300 transition-colors">悩みから探す</button></li>
              <li><button onClick={() => navigate('/diagnosis')} className="hover:text-golf-300 transition-colors">無料診断</button></li>
              <li><button onClick={() => navigate('/articles')} className="hover:text-golf-300 transition-colors">記事一覧</button></li>
              <li><button onClick={() => navigate('/mypage')} className="hover:text-golf-300 transition-colors">マイページ</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black text-white">運営情報</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li><button onClick={() => setShowLegal('privacy')} className="hover:text-golf-300 transition-colors">プライバシーポリシー</button></li>
              <li><button onClick={() => setShowLegal('terms')} className="hover:text-golf-300 transition-colors">利用規約</button></li>
              <li><button onClick={() => navigate('/sitemap')} className="hover:text-golf-300 transition-colors">サイトマップ</button></li>
              <li><a href="mailto:info@mybagpro.jp" className="hover:text-golf-300 transition-colors">お問い合わせ</a></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>© My Bag Pro All rights reserved.</div>
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
      <BrowserRouter>
        <SeoManager />
        <ScrollToTop />
        <Layout>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/settings/pros" element={<ProsSettingsPage />} />
              <Route path="/settings/pros/:slug" element={<ProSettingDetailPage />} />
              <Route path="/settings/users" element={<UsersSettingsPage />} />
              <Route path="/settings/users/:id" element={<SharedBag />} />
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
          </Suspense>
        </Layout>
      </BrowserRouter>
    </DiagnosisProvider>
  );
}

export default App;
