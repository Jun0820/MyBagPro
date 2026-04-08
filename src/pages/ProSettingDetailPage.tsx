import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Gauge, Newspaper, ShoppingBag, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDriverDetailBySlug } from '../data/featuredSettings';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedArticles, type PublicArticle } from '../lib/articles';
import { fetchPublishedSettingProfileBySlug, type PublicSettingProfile } from '../lib/contentProfiles';
import { applySeo, getSeoPath, removeStructuredData, setStructuredData, toAbsoluteUrl } from '../lib/seo';

const formatClubLabel = (category: string, specLabel?: string) => {
  if (specLabel) return specLabel;
  if (category === 'Driver') return '1W';
  if (category === 'Putter') return 'PT';
  return category;
};

const formatDistance = (carryDistance?: number | null, totalDistance?: number | null) => {
  if (carryDistance && totalDistance) {
    return `${carryDistance} / ${totalDistance}`;
  }
  if (carryDistance) return `${carryDistance}`;
  if (totalDistance) return `${totalDistance}`;
  return '未公開';
};

const evergreenPrioritySlugs = [
  'how-to-read-pro-setting-pages',
  'how-to-use-setting-compare',
  'why-14-clubs-matter',
  'driver-diagnosis-purpose',
  'what-to-check-before-publishing-profile',
];

const pickRecommendedArticles = (articles: PublicArticle[], profileName: string) => {
  const directMatches = articles.filter(
    (article) =>
      article.title.includes(profileName) ||
      article.excerpt.includes(profileName) ||
      article.body.includes(profileName)
  );

  const evergreenMatches = evergreenPrioritySlugs
    .map((targetSlug) => articles.find((article) => article.slug === targetSlug))
    .filter(Boolean) as PublicArticle[];

  return [...directMatches, ...evergreenMatches]
    .filter((article, index, self) => self.findIndex((item) => item.slug === article.slug) === index)
    .slice(0, 3);
};

export const ProSettingDetailPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [setting, setSetting] = useState<PublicSettingProfile | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<PublicArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSetting = async () => {
      if (!slug) {
        setSetting(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const profile = await fetchPublishedSettingProfileBySlug(slug);
      if (isMounted) {
        setSetting(profile);
        setIsLoading(false);
      }
    };

    loadSetting();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    if (!setting) {
      removeStructuredData('profile-page');
      applySeo({
        title: 'プロのクラブセッティング詳細',
        description: '確認済みの14本のクラブセッティング詳細ページです。',
        path: getSeoPath(`/settings/pros/${slug}`),
      });
      return;
    }

    applySeo({
      title: `${setting.name}のクラブセッティング`,
      description: `${setting.name}の確認済み14本セッティング。使用ボールやシャフト情報まで見られます。`,
      path: getSeoPath(`/settings/pros/${slug}`),
    });

    setStructuredData('profile-page', {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: `${setting.name}のクラブセッティング`,
      description: `${setting.name}の確認済み14本セッティング。使用ボールやシャフト情報まで見られます。`,
      url: toAbsoluteUrl(getSeoPath(`/settings/pros/${slug}`)),
      mainEntity: {
        '@type': 'Person',
        name: setting.name,
        description: setting.summary,
        additionalType: setting.type,
      },
      hasPart: {
        '@type': 'ItemList',
        name: `${setting.name}の14本セッティング`,
        numberOfItems: setting.clubs.length,
        itemListElement: setting.clubs.map((club, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${formatClubLabel(club.category, club.specLabel)} ${club.model}`,
          item: {
            '@type': 'Product',
            name: club.model,
            brand: club.brand || undefined,
            additionalProperty: [
              club.loft
                ? {
                    '@type': 'PropertyValue',
                    name: 'Loft',
                    value: club.loft,
                  }
                : null,
              club.shaftFlex
                ? {
                    '@type': 'PropertyValue',
                    name: 'Flex',
                    value: club.shaftFlex,
                  }
                : null,
              club.carryDistance || club.totalDistance
                ? {
                    '@type': 'PropertyValue',
                    name: 'Distance',
                    value: formatDistance(club.carryDistance, club.totalDistance),
                  }
                : null,
            ].filter(Boolean),
          },
        })),
      },
    });
  }, [setting, slug]);

  useEffect(() => () => removeStructuredData('profile-page'), []);

  useEffect(() => {
    let isMounted = true;

    const loadArticles = async () => {
      if (!setting) {
        setRelatedArticles([]);
        return;
      }

      const articles = await fetchPublishedArticles({ limit: 50 });
      if (isMounted) {
        setRelatedArticles(pickRecommendedArticles(articles, setting.name));
      }
    };

    loadArticles();

    return () => {
      isMounted = false;
    };
  }, [setting]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">セッティングを読み込んでいます。</h1>
        <p className="mt-3 text-sm text-slate-600">掲載プロフィールを確認中です。</p>
      </div>
    );
  }

  if (!setting) {
    return (
      <div className="min-h-[60vh] rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-black text-trust-navy">セッティングが見つかりません。</h1>
        <p className="mt-3 text-sm text-slate-600">ここには将来的に個別のプロ詳細ページが入ります。</p>
        <button
          onClick={() => navigate('/settings/pros')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
        >
          一覧へ戻る
        </button>
      </div>
    );
  }

  const driverClub = setting.clubs.find((club) => club.category === 'Driver');
  const driverDetail = driverClub?.productSlug
    ? getDriverDetailBySlug(driverClub.productSlug)
    : undefined;

  return (
    <div className="min-h-screen pb-20">
      <button
        onClick={() => navigate('/settings/pros')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-trust-navy"
      >
        <ArrowLeft size={16} />
        プロ一覧へ戻る
      </button>

      <section className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white md:px-10 md:py-14">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black text-cyan-200">
            {setting.type}
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{setting.name}</h1>
          <p className="mt-4 text-lg font-bold text-cyan-200">{setting.tagline}</p>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">{setting.summary}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] font-black text-slate-400">ヘッドスピード</div>
              <div className="mt-2 text-base font-black text-white">{setting.headSpeed}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] font-black text-slate-400">平均スコア</div>
              <div className="mt-2 text-base font-black text-white">{setting.averageScore}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] font-black text-slate-400">使用ボール</div>
              <div className="mt-2 text-base font-black text-white">{setting.ball}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-[11px] font-black text-slate-400">特徴</div>
              <div className="mt-2 text-base font-black text-white">{setting.style}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-black text-slate-400">
            <Sparkles size={14} />
            このページで分かること
          </div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">14本の構成をひと目で確認する</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            クラブ名、シャフト、ロフト、硬さ、飛距離までを一覧で見られるようにしています。まずは全体の並び方を見て、気になる番手を詳しく確認してください。
          </p>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden bg-slate-100 md:grid md:grid-cols-[0.7fr_2fr_2.2fr_1fr_1fr_1.2fr]">
              {['クラブ', 'クラブ名', 'シャフト', 'ロフト(度)', '硬さ', '飛距離(Y)'].map((heading) => (
                <div key={heading} className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                  {heading}
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-200 bg-white">
              {setting.clubs.map((club, index) => {
                const isDriver = club.category === 'Driver';
                const shaftLabel = [club.shaftBrand, club.shaftModel].filter(Boolean).join(' ');
                return (
                  <button
                    key={`${setting.slug}-${club.category}-${club.specLabel || index}`}
                    onClick={() => {
                      if (isDriver && driverDetail) {
                        trackEvent('view_product_detail', {
                          source_page: 'pro_setting_detail',
                          profile_slug: setting.slug,
                          profile_name: setting.name,
                          product_slug: driverDetail.slug,
                          product_name: `${driverDetail.brand} ${driverDetail.name}`,
                          category: 'drivers',
                        });
                        navigate(`/clubs/drivers/${driverDetail.slug}`);
                      }
                    }}
                    className={`w-full text-left ${
                      isDriver && driverDetail ? 'transition-colors hover:bg-cyan-50' : ''
                    }`}
                  >
                    <div className="grid gap-3 px-4 py-4 md:grid-cols-[0.7fr_2fr_2.2fr_1fr_1fr_1.2fr] md:items-center">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">クラブ</div>
                        <div className="text-sm font-black text-trust-navy">{formatClubLabel(club.category, club.specLabel)}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">クラブ名</div>
                        <div className="text-sm font-bold text-trust-navy">{club.model}</div>
                        {club.brand && <div className="mt-1 text-xs text-slate-500">{club.brand}</div>}
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">シャフト</div>
                        <div className="text-sm font-bold text-slate-700">{shaftLabel || '未公開'}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">ロフト(度)</div>
                        <div className="text-sm font-bold text-slate-700">{club.loft || '未公開'}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">硬さ</div>
                        <div className="text-sm font-bold text-slate-700">{club.shaftFlex || '未公開'}</div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 md:hidden">飛距離(Y)</div>
                        <div className="text-sm font-bold text-slate-700">{formatDistance(club.carryDistance, club.totalDistance)}</div>
                        {(club.carryDistance || club.totalDistance) && (
                          <div className="mt-1 text-[11px] text-slate-500">carry / total</div>
                        )}
                      </div>
                    </div>
                    {isDriver && driverDetail && (
                      <div className="px-4 pb-4">
                        <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-golf-700">
                          ドライバー詳細を見る
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="inline-flex items-center gap-2 text-[11px] font-black text-slate-400">
              <Gauge size={14} />
              見るときのポイント
            </div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <div>
                <div className="text-[11px] font-black text-slate-400">ヘッドスピード</div>
                <div className="mt-1 font-bold text-trust-navy">{setting.headSpeed}</div>
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-400">平均スコア</div>
                <div className="mt-1 font-bold text-trust-navy">{setting.averageScore}</div>
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-400">使用ボール</div>
                <div className="mt-1 font-bold text-trust-navy">{setting.ball}</div>
              </div>
              <div>
                <div className="text-[11px] font-black text-slate-400">見るべき特徴</div>
                <div className="mt-1 font-bold text-trust-navy">{setting.style}</div>
              </div>
              <p className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm">
                同じクラブを真似するよりも、番手の流れ方、ウェッジの構成、ボールとの組み合わせを見て、自分のバッグにどう落とし込むかを考えるのがコツです。
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-6">
            <h2 className="text-xl font-black text-trust-navy">このあとできること</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              気になる構成を見つけたら、そのまま比較や診断へ進めます。使っているドライバーが気になるときは購入比較にも移動できます。
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {driverDetail && (
                <button
                  onClick={() => {
                    trackEvent('view_buy_options', {
                      source_page: 'pro_setting_detail',
                      profile_slug: setting.slug,
                      profile_name: setting.name,
                      product_slug: driverDetail.slug,
                      product_name: `${driverDetail.brand} ${driverDetail.name}`,
                      category: 'drivers',
                    });
                    navigate(`/buy/drivers/${driverDetail.slug}`);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-trust-navy ring-1 ring-cyan-200"
                >
                  <ShoppingBag size={16} />
                  使用ドライバーの購入先を見る
                </button>
              )}
              <button
                onClick={() => {
                  trackEvent('start_setting_compare', {
                    source_page: 'pro_setting_detail',
                    profile_slug: setting.slug,
                    profile_name: setting.name,
                  });
                  navigate(`/compare?setting=${setting.slug}`);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-trust-navy px-5 py-3 text-sm font-black text-white"
              >
                自分のバッグと比べる
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => {
                  trackEvent('start_ai_diagnosis', {
                    source_page: 'pro_setting_detail',
                    reference_profile_slug: setting.slug,
                    reference_profile_name: setting.name,
                  });
                  navigate('/diagnosis');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300 px-5 py-3 text-sm font-black text-cyan-700"
              >
                この構成を参考にAI診断する
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-[11px] font-black text-slate-400">読みどころ</div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">{setting.name}のセッティングを見るポイント</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <p>
              このページでは、{setting.name}の14本のクラブ構成を一覧で確認できます。ドライバーだけでなく、
              フェアウェイウッド、アイアン、ウェッジ、パターまで、つながりで見られるのが価値です。
            </p>
            <p>
              特に注目したいのは、使用ボールが <span className="font-bold text-trust-navy">{setting.ball}</span> であることと、
              {setting.strengths.join('・')} という特徴です。単品ではなく、全体の流れとして参考にするのが向いています。
            </p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="text-[11px] font-black text-slate-400">活かし方</div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">自分のバッグ作りに落とし込む</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <p>
              プロのセッティングをそのまま真似するというより、クラブの並び方、ロフトの階段、ウェッジ構成、ボールとの組み合わせを見て、
              自分のヘッドスピードや平均スコアにどう落とし込むかを考えるのがコツです。
            </p>
            <p>
              気になる構成があれば、そのまま比較ページや AI診断につなげて、自分向けの候補へ絞り込めます。
            </p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="inline-flex items-center gap-2 text-[11px] font-black text-slate-400">
            <Newspaper size={14} />
            関連記事
          </div>
          <h2 className="mt-3 text-2xl font-black text-trust-navy">このセッティングと一緒に読みたい記事</h2>
          <div className="mt-5 space-y-4">
            {relatedArticles.map((article) => (
              <button
                key={article.slug}
                onClick={() => {
                  trackEvent('select_article', {
                    source_page: 'pro_setting_detail',
                    profile_slug: setting.slug,
                    profile_name: setting.name,
                    article_slug: article.slug,
                    article_title: article.title,
                  });
                  navigate(`/articles/${article.slug}`);
                }}
                className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                <h3 className="text-base font-black text-trust-navy">{article.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{article.excerpt}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-black text-golf-700">
                  記事を読む
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
            {relatedArticles.length === 0 && (
              <p className="rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                このセッティングの見方や比較の使い方に関する記事を順次追加していきます。
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};
