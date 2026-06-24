import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';
import { profileCategories, type ProfileCategory } from '../lib/profileMetadata';
import { getProfileVisuals } from '../lib/profileVisuals';
import { matchesSearchText } from '../lib/searchNormalizer';

const kanaGroups = [
  { id: 'all', label: 'すべて' },
  { id: 'a', label: 'あ' },
  { id: 'ka', label: 'か' },
  { id: 'sa', label: 'さ' },
  { id: 'ta', label: 'た' },
  { id: 'na', label: 'な' },
  { id: 'ha', label: 'は' },
  { id: 'ma', label: 'ま' },
  { id: 'ya', label: 'や' },
  { id: 'ra', label: 'ら' },
  { id: 'wa', label: 'わ' },
] as const;

const headSpeedGroups = [
  { id: 'all', label: 'すべて' },
  { id: 'lt37', label: '37m/s未満', max: 37 },
  { id: '37to39', label: '37-39.9m/s', min: 37, max: 40 },
  { id: '40to42', label: '40-42.9m/s', min: 40, max: 43 },
  { id: '43to45', label: '43-45.9m/s', min: 43, max: 46 },
  { id: '46to48', label: '46-48.9m/s', min: 46, max: 49 },
  { id: '49to51', label: '49-51.9m/s', min: 49, max: 52 },
  { id: '52to54', label: '52-54.9m/s', min: 52, max: 55 },
  { id: 'gte55', label: '55m/s以上', min: 55 },
] as const;

const searchSuggestions = ['ピン', 'PING', '7W', 'ユーティリティ', 'Pro V1x', 'ドライバー'];

const toHiragana = (value: string) =>
  value.replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));

const getKanaGroup = (name: string) => {
  const normalized = toHiragana(name.trim());
  const first = normalized.charAt(0);
  if (!first) return 'all';
  if (/[A-Za-z]/.test(first)) return 'a';
  if ('あいうえおぁぃぅぇぉ'.includes(first)) return 'a';
  if ('かがきぎくぐけげこご'.includes(first)) return 'ka';
  if ('さざしじすずせぜそぞ'.includes(first)) return 'sa';
  if ('ただちぢっつづてでとど'.includes(first)) return 'ta';
  if ('なにぬねの'.includes(first)) return 'na';
  if ('はばぱひびぴふぶぷへべぺほぼぽ'.includes(first)) return 'ha';
  if ('まみむめも'.includes(first)) return 'ma';
  if ('やゃゆゅよょ'.includes(first)) return 'ya';
  if ('らりるれろ'.includes(first)) return 'ra';
  if ('わをん'.includes(first)) return 'wa';
  return 'ka';
};

export const ProsSettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState<PublicSettingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const activeCategory = (searchParams.get('category') as 'all' | ProfileCategory | null) || 'all';
  const activeKana = searchParams.get('kana') || 'all';
  const activeHeadSpeed = searchParams.get('headSpeed') || 'all';

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      setIsLoading(true);
      const data = await fetchPublishedSettingProfiles();
      if (isMounted) {
        setProfiles(data);
        setIsLoading(false);
      }
    };

    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSearchText(searchParams.get('search') || '');
  }, [searchParams]);

  const filteredProfiles = useMemo(() => {
    const query = searchText.trim();
    return profiles
      .filter((profile) => {
        if (activeCategory !== 'all' && profile.category !== activeCategory) {
          return false;
        }
        if (activeKana !== 'all' && getKanaGroup(profile.kanaName || profile.name) !== activeKana) {
          return false;
        }
        if (activeHeadSpeed !== 'all') {
          const speed = profile.headSpeedMps;
          if (speed === null || speed === undefined) return false;
          const group = headSpeedGroups.find((item) => item.id === activeHeadSpeed);
          if (!group) return false;
          if ('min' in group && group.min !== undefined && speed < group.min) return false;
          if ('max' in group && group.max !== undefined && speed >= group.max) return false;
        }
        if (!query) return true;

        return matchesSearchText(
          [
            profile.name,
            profile.kanaName,
            profile.categoryLabel,
            profile.contractDisplay,
            profile.contractMaker,
            profile.ball,
            profile.tagline,
            profile.summary,
            profile.headSpeed,
            profile.seasonYear,
            profile.latestSourcePolicy,
            profile.verifiedAt,
            ...profile.strengths,
            ...profile.sources.flatMap((source) => [source.title, source.notes, source.checkedAt]),
            ...profile.clubs.flatMap((club) => [
              club.category,
              club.brand,
              club.model,
              club.loft,
              club.specLabel,
              club.shaftBrand,
              club.shaftModel,
              club.shaftWeight,
              club.shaftFlex,
              club.carryDistance,
              club.totalDistance,
              club.sourceNote,
            ]),
          ],
          query
        );
      })
      .sort((a, b) => (a.kanaName || a.name).localeCompare(b.kanaName || b.name, 'ja'));
  }, [activeCategory, activeHeadSpeed, activeKana, profiles, searchText]);

  const applyFilters = (next: { search?: string; category?: string; kana?: string; headSpeed?: string }) => {
    setSearchParams(
      {
        ...(next.search ? { search: next.search } : {}),
        ...(next.category && next.category !== 'all' ? { category: next.category } : {}),
        ...(next.kana && next.kana !== 'all' ? { kana: next.kana } : {}),
        ...(next.headSpeed && next.headSpeed !== 'all' ? { headSpeed: next.headSpeed } : {}),
      },
      { replace: true }
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden space-y-4 pb-20 md:space-y-6">
      <section className="rounded-lg bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200/80 md:px-7 md:py-6">
        <div>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.16em] text-slate-400">PRO SETTINGS</div>
              <h1 className="mt-1.5 text-[1.65rem] font-black tracking-tight text-trust-navy md:text-[3.15rem]">
                プロのクラブセッティング一覧
              </h1>
              <p className="mt-1.5 text-sm font-bold text-slate-500">
                選手名、メーカー、番手、クラブ名、ボール名で素早く絞り込めます。
              </p>
            </div>
            <div className="inline-flex self-start rounded-full bg-slate-100/90 px-3 py-1.5 text-sm font-black text-trust-navy">
              {filteredProfiles.length}件
            </div>
          </div>

          <div className="mt-3.5 rounded-lg bg-slate-50/75 px-3 py-3 ring-1 ring-slate-100/80 md:mt-4 md:px-3.5 md:py-3.5">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
              <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 ring-1 ring-slate-100 md:flex-1">
                <Search size={18} className="text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      applyFilters({ search: searchText.trim(), category: activeCategory, kana: activeKana, headSpeed: activeHeadSpeed });
                    }
                  }}
                  placeholder="選手名・メーカー・番手・クラブ名で検索"
                  className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 md:flex">
                <button
                  onClick={() => applyFilters({ search: searchText.trim(), category: activeCategory, kana: activeKana, headSpeed: activeHeadSpeed })}
                  className="rounded-lg bg-trust-navy px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  検索
                </button>
                <button
                  onClick={() => {
                    setSearchText('');
                    applyFilters({ category: activeCategory, kana: activeKana, headSpeed: activeHeadSpeed });
                  }}
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-black text-slate-600 ring-1 ring-slate-100 transition hover:bg-slate-50"
                >
                  クリア
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setSearchText(suggestion);
                    applyFilters({ search: suggestion, category: activeCategory, kana: activeKana, headSpeed: activeHeadSpeed });
                  }}
                  className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-100 transition hover:bg-golf-50 hover:text-golf-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="mt-3.5 space-y-2.5">
              <div>
                <div className="mb-1.5 text-[11px] font-black tracking-[0.14em] text-slate-400">カテゴリ</div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {profileCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        applyFilters({ search: searchText.trim(), category: category.id, kana: activeKana, headSpeed: activeHeadSpeed })
                      }
                      className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-black transition ${
                        activeCategory === category.id
                          ? 'bg-trust-navy text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[11px] font-black tracking-[0.14em] text-slate-400">フリガナ</div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {kanaGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() =>
                        applyFilters({ search: searchText.trim(), category: activeCategory, kana: group.id, headSpeed: activeHeadSpeed })
                      }
                      className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-black transition ${
                        activeKana === group.id
                          ? 'bg-golf-700 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[11px] font-black tracking-[0.14em] text-slate-400">ヘッドスピード</div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {headSpeedGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() =>
                        applyFilters({ search: searchText.trim(), category: activeCategory, kana: activeKana, headSpeed: group.id })
                      }
                      className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-black transition ${
                        activeHeadSpeed === group.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-emerald-950 px-4 py-5 text-white shadow-sm ring-1 ring-emerald-900/40 md:px-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">Golf ID</div>
            <h2 className="mt-2 text-xl font-black md:text-2xl">このクラブ、あなたにも合う？</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
              Golf IDを作って、AI上達診断を受けると、プロの14本をそのまま真似るのではなく、自分の距離・悩みに合わせて見直せます。
            </p>
          </div>
          <a
            href="https://golfid.jp/create"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
          >
            無料でGolf IDを作る
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && (
          <div className="rounded-lg bg-white p-6 text-sm font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
            掲載プロフィールを読み込んでいます...
          </div>
        )}

        {!isLoading && profiles.length === 0 && (
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-[11px] font-black tracking-[0.15em] text-slate-400">読み込みエラー</div>
            <h2 className="mt-3 text-2xl font-black text-trust-navy">プロフィールを取得できませんでした。</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              一時的な通信エラーの可能性があります。少し時間を置いて再読み込みするか、トップページからもう一度アクセスしてください。
            </p>
          </div>
        )}

        {filteredProfiles.map((setting) => {
          const visuals = getProfileVisuals(setting.slug, setting.instagramHandle, { preferInstagramPortrait: true });

          return (
            <button
              key={setting.slug}
              onClick={() => {
                trackEvent('view_setting_detail', {
                  source_page: 'pros_library',
                  profile_slug: setting.slug,
                  profile_name: setting.name,
                });
                navigate(`/pros/${setting.slug}`);
              }}
              className="rounded-[1.125rem] bg-white p-2.5 text-left shadow-sm ring-1 ring-slate-200/80 transition-all hover:-translate-y-0.5 hover:ring-golf-300 hover:shadow-md md:rounded-[1.25rem] md:p-3"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={visuals.portrait}
                  alt={`${setting.name}の写真またはプレースホルダー画像`}
                  className={`h-10 w-10 rounded-full bg-white object-cover ring-1 ring-slate-200/80 md:h-11 md:w-11 ${
                    visuals.portraitMedia ? '' : 'p-2'
                  }`}
                  onError={(event) => {
                    const fallbackSrc = visuals.portraitMedia?.fallbackSrc;
                    if (!fallbackSrc) return;
                    const target = event.currentTarget;
                    if (target.src === fallbackSrc) return;
                    target.src = fallbackSrc;
                  }}
                />
                <div className="min-w-0">
                  <div className="text-[14px] font-black text-trust-navy md:text-base">{setting.name}</div>
                  {setting.kanaName && <div className="mt-0.5 text-[10px] font-bold text-slate-500 md:text-[11px]">{setting.kanaName}</div>}
                </div>
                <ArrowRight size={16} className="ml-auto shrink-0 text-slate-400" />
              </div>
            </button>
          );
        })}

        {!isLoading && filteredProfiles.length === 0 && profiles.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            条件に合うプロフィールが見つかりませんでした。
          </div>
        )}
      </section>
    </div>
  );
};
