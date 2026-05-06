import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Bell,
  Home as HomeIcon,
  Menu,
  Search,
  Stethoscope,
  User,
} from 'lucide-react';
import { DiagnosisProvider, useDiagnosis } from './context/DiagnosisContext';
import { AccountAuth } from './features/auth/AccountAuth';
import { LegalPage } from './components/LegalPage';
import { Home } from './pages/Home';
import { SeoManager } from './components/SeoManager';
import { fetchPublishedArticles, type PublicArticle } from './lib/articles';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from './lib/contentProfiles';

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
  <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] bg-white text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200/80">
    ページを読み込んでいます...
  </div>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, setUser, setProfile, showAuth, setShowAuth } = useDiagnosis();
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchArticles, setSearchArticles] = useState<PublicArticle[]>([]);
  const [searchProfiles, setSearchProfiles] = useState<PublicSettingProfile[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = useMemo(
    () => [
      { label: 'プロのセッティング', href: '/settings/pros' },
      { label: 'クラブ診断', href: '/diagnosis' },
      { label: '記事・コラム', href: '/articles' },
    ],
    []
  );

  const mobileItems = useMemo(
    () => [
      { label: 'ホーム', href: '/', icon: HomeIcon, kind: 'route' as const },
      { label: '診断', href: '/diagnosis', icon: Stethoscope, kind: 'route' as const },
      { label: 'マイページ', href: '/mypage', icon: User, kind: 'route' as const },
      { label: 'メニュー', href: '#menu', icon: Menu, kind: 'menu' as const },
    ],
    []
  );

  const handleAuthEntry = () => {
    if (user.isLoggedIn) {
      navigate('/mypage');
      return;
    }
    setShowAuth(true);
  };

  const navigateWithMobileClose = (href: string) => {
    setMobileMenuOpen(false);
    navigate(href);
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!searchOpen || searchArticles.length > 0 || searchProfiles.length > 0 || searchLoading) return;
    setSearchLoading(true);
    Promise.all([fetchPublishedArticles({ limit: 200 }), fetchPublishedSettingProfiles()])
      .then(([articles, profiles]) => {
        setSearchArticles(articles);
        setSearchProfiles(profiles);
      })
      .finally(() => setSearchLoading(false));
  }, [searchOpen, searchArticles.length, searchProfiles.length, searchLoading]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchedProfiles = normalizedQuery
    ? searchProfiles
        .filter((profile) =>
          [profile.name, profile.kanaName, profile.summary, profile.contractDisplay, profile.ball]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery))
        )
        .slice(0, 5)
    : [];
  const matchedArticles = normalizedQuery
    ? searchArticles
        .filter((article) =>
          [article.title, article.excerpt, article.body]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery))
        )
        .slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-[#f5f7f3] text-slate-900">
      <div className="fixed inset-0 pointer-events-none opacity-[0.045]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(22,101,52,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(200,169,106,0.14),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,247,241,0.96))]" />
      </div>

      <header className="sticky top-0 z-50 bg-white/92 shadow-[0_8px_30px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3.5 md:px-8 md:py-4">
          <button onClick={() => navigate('/')} className="flex shrink-0 items-center gap-3">
            <img src="/branding/logo-wordmark-light.svg" alt="MyBag Pro" className="h-10 w-auto md:h-12" />
          </button>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className={`text-sm font-bold transition-colors ${
                  isActive(item.href) ? 'text-[#0f0f10]' : 'text-slate-700 hover:text-[#166534]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:gap-3 md:flex">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200/80 transition hover:text-[#166534] hover:ring-[#166534]/30 md:inline-flex"
              aria-label="サイト内検索"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => navigate(user.isLoggedIn ? '/mypage' : '/articles')}
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200/80 transition hover:text-[#166534] hover:ring-[#166534]/30 md:inline-flex"
              aria-label="通知"
            >
              <Bell size={18} />
            </button>
            <button
              onClick={handleAuthEntry}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-50 px-4 text-sm font-black text-slate-800 ring-1 ring-slate-200/80 transition hover:text-[#166534] hover:ring-[#166534]/30"
            >
              {user.isLoggedIn ? 'マイページ' : 'ログイン'}
            </button>
            <button
              onClick={() => navigate('/diagnosis')}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1c6a3d] px-4 text-sm font-black text-white shadow-[0_18px_32px_-24px_rgba(22,101,52,0.95)] transition hover:bg-[#155d35] md:px-6"
            >
              クラブ診断をはじめる
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200/80"
              aria-label="サイト内検索"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200/80"
              aria-label="メニュー"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-[76px] z-[55] rounded-[28px] bg-white p-4 shadow-[0_24px_70px_-38px_rgba(15,15,16,0.5)] ring-1 ring-slate-200/80 md:hidden">
          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => navigateWithMobileClose(item.href)}
                className={`
                  flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition
                  ${isActive(item.href) ? 'bg-[#edf6ef] text-[#166534]' : 'text-slate-700 hover:bg-slate-50'}
                `}
              >
                <span>{item.label}</span>
                <Menu size={14} className="opacity-0" />
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleAuthEntry();
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-50 px-4 text-sm font-black text-slate-800 ring-1 ring-slate-200/80"
            >
              {user.isLoggedIn ? 'マイページ' : 'ログイン'}
            </button>
            <button
              onClick={() => navigateWithMobileClose('/diagnosis')}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#1c6a3d] px-4 text-sm font-black text-white"
            >
              診断を始める
            </button>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-28 pt-5 md:px-8 md:pt-8">
        {children}
      </main>

      <footer className="relative z-10 bg-[#111315] px-4 py-12 text-white md:px-8">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <button onClick={() => navigate('/')} className="inline-flex">
              <img src="/branding/logo-wordmark-dark.svg" alt="MyBag Pro" className="h-12 w-auto" />
            </button>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/72">
              プロのセッティングとあなたのデータをつなぎ、診断・購入判断まで一気通貫で支えるゴルフサイトです。
            </p>
          </div>

          <div>
            <div className="text-sm font-black text-white">サービス</div>
            <div className="mt-4 space-y-3 text-sm text-white/72">
              <button onClick={() => navigate('/settings/pros')} className="block transition hover:text-[#c8a96a]">プロのセッティング</button>
              <button onClick={() => navigate('/diagnosis')} className="block transition hover:text-[#c8a96a]">クラブ診断</button>
              <button onClick={() => navigate('/mypage')} className="block transition hover:text-[#c8a96a]">マイページ</button>
            </div>
          </div>

          <div>
            <div className="text-sm font-black text-white">コンテンツ</div>
            <div className="mt-4 space-y-3 text-sm text-white/72">
              <button onClick={() => navigate('/articles')} className="block transition hover:text-[#c8a96a]">記事・コラム</button>
              <button onClick={() => navigate('/articles')} className="block transition hover:text-[#c8a96a]">お悩み解決</button>
            </div>
          </div>

          <div>
            <div className="text-sm font-black text-white">サポート</div>
            <div className="mt-4 space-y-3 text-sm text-white/72">
              <button onClick={() => setShowLegal('privacy')} className="block transition hover:text-[#c8a96a]">利用規約</button>
              <button onClick={() => setShowLegal('terms')} className="block transition hover:text-[#c8a96a]">プライバシーポリシー</button>
              <a href="mailto:support@funrecipe.co.jp" className="block transition hover:text-[#c8a96a]">お問い合わせ</a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-[1400px] flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <div>© MyBag Pro All Rights Reserved.</div>
          <div>Instagramプロフィール画像は選手本人公開アカウントを参照しています。</div>
        </div>
      </footer>

      <nav className="fixed inset-x-4 bottom-4 z-50 grid grid-cols-4 rounded-[24px] bg-white/95 p-2 shadow-[0_24px_50px_-30px_rgba(15,15,16,0.45)] ring-1 ring-slate-200/80 backdrop-blur md:hidden">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = item.kind === 'menu' ? mobileMenuOpen : isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => {
                if (item.kind === 'menu') {
                  setMobileMenuOpen((prev) => !prev);
                  return;
                }
                navigate(item.href);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition ${
                active ? 'bg-[#edf6ef] text-[#166534]' : 'text-slate-500'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {showLegal && <LegalPage type={showLegal} onClose={() => setShowLegal(null)} />}

      {searchOpen && (
        <div className="fixed inset-0 z-[58] bg-black/40 p-3 backdrop-blur-sm md:p-6" onClick={() => setSearchOpen(false)}>
          <div
            className="mx-auto max-w-3xl rounded-[28px] bg-white p-4 shadow-[0_24px_70px_-38px_rgba(15,15,16,0.5)] ring-1 ring-slate-200/80 md:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
              <Search size={18} className="text-slate-400" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="記事名、選手名、クラブ名で検索"
                className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200/80"
              >
                閉じる
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <section>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">Pro Settings</div>
                <div className="mt-2 space-y-2">
                  {searchLoading && searchProfiles.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500 ring-1 ring-slate-200/70">読み込み中です...</div>
                  ) : normalizedQuery && matchedProfiles.length > 0 ? (
                    matchedProfiles.map((profile) => (
                      <button
                        key={profile.slug}
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/settings/pros/${profile.slug}`);
                        }}
                        className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200/70 transition hover:bg-slate-100"
                      >
                        <div className="text-sm font-black text-trust-navy">{profile.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{profile.contractDisplay} / {profile.ball}</div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500 ring-1 ring-slate-200/70">
                      {normalizedQuery ? '該当するプロはまだ見つかりませんでした。' : '選手名やブランド名で検索できます。'}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-golf-700">Articles</div>
                <div className="mt-2 space-y-2">
                  {searchLoading && searchArticles.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500 ring-1 ring-slate-200/70">読み込み中です...</div>
                  ) : normalizedQuery && matchedArticles.length > 0 ? (
                    matchedArticles.map((article) => (
                      <button
                        key={article.slug}
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/articles/${article.slug}`);
                        }}
                        className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200/70 transition hover:bg-slate-100"
                      >
                        <div className="text-sm font-black text-trust-navy">{article.title}</div>
                        <div className="mt-1 line-clamp-2 text-xs text-slate-500">{article.excerpt}</div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500 ring-1 ring-slate-200/70">
                      {normalizedQuery ? '該当する記事はまだ見つかりませんでした。' : '悩みやクラブ名でも記事を探せます。'}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {showAuth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm md:p-4">
          <AccountAuth
            onLogin={(u, p) => {
              setUser(u);
              if (p) setProfile(p);
              setShowAuth(false);
              const draftProfile = p || profile;
              const clubCount = draftProfile?.myBag?.clubs?.length || 0;
              const hasBall = Boolean(draftProfile?.myBag?.ball || draftProfile?.currentBall);
              const destination =
                clubCount === 0
                  ? '/mypage?welcome=1&tab=clubs&focus=missing-clubs&next=starter-clubs'
                  : !hasBall
                  ? '/mypage?welcome=1&tab=clubs&focus=ball-first&next=ball'
                  : '/mypage?welcome=1&next=diagnosis';
              navigate(destination);
            }}
            onClose={() => setShowAuth(false)}
            currentProfile={profile}
          />
        </div>
      )}
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

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
              <Route path="/compare" element={<Navigate to="/mypage" replace />} />
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
