import { useEffect, useState } from 'react';
import { ArrowRight, Brain, CalendarDays, Eye, Newspaper, Plus, Search, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosis } from '../context/DiagnosisContext';
import { discoveryPaths } from '../data/featuredSettings';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedArticles, type PublicArticle } from '../lib/articles';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';

const stepCards = [
  {
    step: '1',
    title: 'まずはプロのセッティングを見る',
    description: '誰がどんな14本を使っているかを見て、気になる構成を探します。',
  },
  {
    step: '2',
    title: '自分のバッグと比べる',
    description: '参考にしたい人の構成と、自分のバッグの違いを見比べます。',
  },
  {
    step: '3',
    title: 'AI診断と購入につなげる',
    description: '差分を見たあとに、自分向けの診断や購入比較へ進めます。',
  },
];

export const Home = () => {
  const { user } = useDiagnosis();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<PublicSettingProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [articles, setArticles] = useState<PublicArticle[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      setIsLoadingProfiles(true);
      const [profileData, articleData] = await Promise.all([
        fetchPublishedSettingProfiles(),
        fetchPublishedArticles({ limit: 3 }),
      ]);
      if (isMounted) {
        setProfiles(profileData);
        setArticles(articleData);
        setIsLoadingProfiles(false);
      }
    };

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredProfiles = profiles.slice(0, 3);

  return (
    <div className="min-h-screen space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-golf-50 px-4 py-2 text-xs font-black text-golf-700">
              <Eye size={14} />
              プロとみんなのセッティングを見て参考にするサイト
            </div>

            {user?.isLoggedIn && (
              <div className="mt-4 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                おかえりなさい、{user.name} さん
              </div>
            )}

            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-trust-navy md:text-6xl">
              プロとみんなの
              <span className="text-golf-700">クラブセッティング</span>
              を、見つけて比べる。
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              My Bag Pro は、ツアープロや上級者の14本を見て、自分のバッグ作りの参考にできるサイトです。
              気になる構成を見つけたら、そのまま比較、AI診断、購入比較へ進めます。
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  trackEvent('select_content_group', {
                    source_page: 'home',
                    target_type: 'pros_library',
                  });
                  navigate('/settings/pros');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-6 py-4 text-sm font-black text-white transition-colors hover:bg-slate-900"
              >
                プロのセッティングを見る
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => {
                  trackEvent('begin_mybag_creation', {
                    source_page: 'home',
                  });
                  navigate('/mybag/create');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-4 text-sm font-black text-slate-700 transition-colors hover:border-golf-400 hover:text-golf-700"
              >
                <Plus size={16} />
                自分のMy Bagを作る
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-xs font-black text-slate-400">特徴</div>
                <div className="mt-2 text-sm font-bold text-trust-navy">確認済みデータのみ公開</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-xs font-black text-slate-400">使い方</div>
                <div className="mt-2 text-sm font-bold text-trust-navy">見る → 比べる → 診断する</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-xs font-black text-slate-400">料金</div>
                <div className="mt-2 text-sm font-bold text-trust-navy">閲覧も比較も無料</div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
            <div className="text-xs font-black text-cyan-200">いま公開中の注目セッティング</div>
            <div className="mt-4 space-y-4">
              {featuredProfiles.map((setting) => (
                <button
                  key={setting.slug}
                  onClick={() => {
                    trackEvent('select_setting_profile', {
                      source_page: 'home_hero',
                      profile_slug: setting.slug,
                      profile_name: setting.name,
                    });
                    navigate(`/settings/pros/${setting.slug}`);
                  }}
                  className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-left transition-colors hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-black text-cyan-200">{setting.type}</div>
                      <div className="mt-2 text-xl font-black">{setting.name}</div>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-200">
                      {setting.headSpeed}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{setting.tagline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {setting.clubs.slice(0, 3).map((club) => (
                      <span key={`${setting.slug}-${club.category}`} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                        {club.category}: {club.model}
                      </span>
                    ))}
                  </div>
                </button>
              ))}

              {!isLoadingProfiles && featuredProfiles.length === 0 && (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-5">
                  <div className="text-xs font-black text-cyan-200">掲載準備中</div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    14本の確認が終わったプロフィールから順に公開します。推定データやサンプルは表示しません。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stepCards.map((card) => (
          <article key={card.step} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-trust-navy text-sm font-black text-white">
              {card.step}
            </div>
            <h2 className="mt-4 text-xl font-black text-trust-navy">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black text-golf-700">探し方</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-trust-navy">見たい情報からすぐ入る</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              「誰のバッグか」「自分に近い人か」「人気クラブか」など、見たい切り口からすぐ入れるようにしています。
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {discoveryPaths.map((path) => (
            <button
              key={path.label}
              onClick={() => {
                trackEvent('select_discovery_path', {
                  source_page: 'home',
                  path_label: path.label,
                  path_href: path.href,
                });
                navigate(path.href);
              }}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-golf-300 hover:bg-white"
            >
              <div className="text-base font-black text-trust-navy">{path.label}</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{path.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-golf-700">
                この一覧を見る
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-xs font-black text-slate-400">注目セッティング</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-trust-navy">いま見てほしいプロの14本</h2>

          <div className="mt-6 space-y-5">
            {featuredProfiles.map((setting) => (
              <article key={setting.slug} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-black text-slate-400">{setting.type}</div>
                    <h3 className="mt-2 text-2xl font-black text-trust-navy">{setting.name}</h3>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    使用ボール: {setting.ball}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-600">{setting.summary}</p>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {setting.clubs.slice(0, 4).map((club) => (
                    <div key={`${setting.slug}-${club.category}`} className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[11px] font-black text-slate-400">{club.category}</div>
                      <div className="mt-1 text-sm font-bold text-trust-navy">{club.model}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {setting.strengths.map((strength) => (
                    <span key={strength} className="rounded-full border border-golf-200 bg-white px-3 py-1 text-xs font-bold text-golf-700">
                      {strength}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => {
                      trackEvent('select_setting_profile', {
                        source_page: 'home_featured',
                        profile_slug: setting.slug,
                        profile_name: setting.name,
                      });
                      navigate(`/settings/pros/${setting.slug}`);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
                  >
                    セッティング詳細を見る
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => {
                      trackEvent('start_ai_diagnosis', {
                        source_page: 'home_featured',
                        reference_profile_slug: setting.slug,
                        reference_profile_name: setting.name,
                      });
                      navigate('/diagnosis');
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
                  >
                    この構成を参考に診断する
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-golf-50 text-golf-700">
                <Users size={20} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-400">コミュニティ</div>
                <h2 className="mt-1 text-2xl font-black text-trust-navy">みんなのMy Bag</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              プロの世界だけでなく、一般ゴルファーの現実的なセッティングも見られるようになると、もっと参考にしやすいサイトになります。
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                onClick={() => navigate('/settings/users')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
              >
                みんなのMy Bagを見る
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/mybag/create')}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
              >
                自分のバッグを作る
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <Brain size={20} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-400">AI診断</div>
                <h2 className="mt-1 text-2xl font-black text-trust-navy">最後に自分向けへ整える</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              診断は入口ではなく、参考にしたい構成を見つけた後のステップです。クラブ構成やボール診断を通して、自分に合う候補へ絞り込みます。
            </p>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => navigate('/diagnosis')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-black text-white"
              >
                <Sparkles size={16} />
                無料AI診断を試す
              </button>
              <button
                onClick={() => navigate('/ball-diagnosis')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-200 bg-white px-5 py-3 text-sm font-black text-cyan-700"
              >
                ボール診断を見る
              </button>
              <button
                onClick={() => navigate('/clubs/drivers')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
              >
                <ShoppingBag size={16} />
                人気ドライバーを見る
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-trust-navy">
                <Newspaper size={20} />
              </div>
              <div>
                <div className="text-xs font-black text-slate-400">読みもの</div>
                <h2 className="mt-1 text-2xl font-black text-trust-navy">見方が分かる更新記事</h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {articles.map((article) => (
                <button
                  key={article.slug}
                  onClick={() => {
                    trackEvent('select_article', {
                      source_page: 'home',
                      article_slug: article.slug,
                      article_title: article.title,
                    });
                    navigate(`/articles/${article.slug}`);
                  }}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                    <CalendarDays size={14} />
                    {article.publishedAt
                      ? new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(new Date(article.publishedAt))
                      : '公開日未設定'}
                  </div>
                  <h3 className="mt-2 text-base font-black text-trust-navy">{article.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                </button>
              ))}

              <button
                onClick={() => navigate('/articles')}
                className="inline-flex items-center gap-2 text-sm font-black text-golf-700"
              >
                記事一覧を見る
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-[2rem] border border-amber-100 bg-amber-50 p-6 md:p-8">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-700">
            <Search size={18} />
          </div>
          <div>
            <div className="text-xs font-black text-amber-700">掲載方針</div>
            <h2 className="mt-2 text-2xl font-black text-trust-navy">確認できたものだけを公開します</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              製品ページもプロフィールページも、ブランド、モデル、シャフト、ロフト、飛距離、参照元が確認できたデータから順に公開します。
              推定値や途中情報は掲載しません。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
