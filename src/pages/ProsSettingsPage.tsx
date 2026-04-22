import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { fetchPublishedSettingProfiles, type PublicSettingProfile } from '../lib/contentProfiles';
import { profileCategories, type ProfileCategory } from '../lib/profileMetadata';
import { getProfileVisuals } from '../lib/profileVisuals';

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
    const query = searchText.trim().toLowerCase();
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

        const haystack = [profile.name, profile.kanaName || '', profile.categoryLabel, profile.contractDisplay]
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
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
    <div className="min-h-screen overflow-x-hidden space-y-6 pb-20 md:space-y-8">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-5 shadow-sm md:rounded-[2rem] md:px-8 md:py-10">
        <div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-black tracking-[0.16em] text-slate-400">PRO SETTINGS</div>
              <h1 className="mt-2 text-[1.75rem] font-black tracking-tight text-trust-navy md:text-5xl">
                プロのクラブセッティング一覧
              </h1>
              <p className="mt-2 text-sm font-bold text-slate-500">
                名前、カテゴリ、ヘッドスピードで素早く絞り込めます。
              </p>
            </div>
            <div className="inline-flex self-start rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-black text-trust-navy">
              {filteredProfiles.length}件
            </div>
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3 md:mt-6 md:rounded-[1.5rem] md:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 md:flex-1">
                <Search size={18} className="text-slate-400" />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      applyFilters({ search: searchText.trim(), category: activeCategory, kana: activeKana, headSpeed: activeHeadSpeed });
                    }
                  }}
                  placeholder="選手名を入力"
                  className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 md:flex">
                <button
                  onClick={() => applyFilters({ search: searchText.trim(), category: activeCategory, kana: activeKana, headSpeed: activeHeadSpeed })}
                  className="rounded-full bg-trust-navy px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  検索
                </button>
                <button
                  onClick={() => {
                    setSearchText('');
                    applyFilters({ category: activeCategory, kana: activeKana, headSpeed: activeHeadSpeed });
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  クリア
                </button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-2 text-[11px] font-black tracking-[0.14em] text-slate-400">カテゴリ</div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {profileCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        applyFilters({ search: searchText.trim(), category: category.id, kana: activeKana, headSpeed: activeHeadSpeed })
                      }
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                        activeCategory === category.id
                          ? 'bg-trust-navy text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-black tracking-[0.14em] text-slate-400">フリガナ</div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {kanaGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() =>
                        applyFilters({ search: searchText.trim(), category: activeCategory, kana: group.id, headSpeed: activeHeadSpeed })
                      }
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                        activeKana === group.id
                          ? 'bg-golf-700 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-black tracking-[0.14em] text-slate-400">ヘッドスピード</div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {headSpeedGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() =>
                        applyFilters({ search: searchText.trim(), category: activeCategory, kana: activeKana, headSpeed: group.id })
                      }
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                        activeHeadSpeed === group.id
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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

      <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
            掲載プロフィールを読み込んでいます...
          </div>
        )}

        {!isLoading && profiles.length === 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
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
                navigate(`/settings/pros/${setting.slug}`);
              }}
              className="rounded-[1.125rem] border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-golf-300 hover:shadow-md md:rounded-[1.25rem] md:p-3.5"
            >
              <div className="flex items-center gap-3">
                <img
                  src={visuals.portrait}
                  alt={`${setting.name}の写真またはプレースホルダー画像`}
                  className={`h-11 w-11 rounded-full border border-slate-200 bg-white object-cover md:h-12 md:w-12 ${
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
                  <div className="text-[15px] font-black text-trust-navy md:text-lg">{setting.name}</div>
                  {setting.kanaName && <div className="mt-0.5 text-[11px] font-bold text-slate-500 md:text-xs">{setting.kanaName}</div>}
                </div>
                <ArrowRight size={16} className="ml-auto shrink-0 text-slate-400" />
              </div>
            </button>
          );
        })}

        {!isLoading && filteredProfiles.length === 0 && profiles.length > 0 && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            条件に合うプロフィールが見つかりませんでした。
          </div>
        )}
      </section>
    </div>
  );
};
