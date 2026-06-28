import { useEffect, useMemo, useState } from 'react';
import { Database, Filter, ImagePlus, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { ClubImageCard } from '../components/clubs/ClubImageCard';
import { categoryLabels, loadClubBrands, loadClubModels, slugifyClub, type ClubBrand, type ClubCategory, type ClubModel } from '../lib/clubMaster';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useDiagnosis } from '../context/DiagnosisContext';

const categories = Object.keys(categoryLabels) as ClubCategory[];
const licenseStatuses = ['unknown', 'permitted', 'affiliate_allowed', 'own', 'licensed', 'prohibited'];
const sourceTypes = ['official', 'affiliate_api', 'own_photo', 'licensed', 'manual_upload'];

const normalizeAdminEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return normalized;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${localPart.split('+')[0].replace(/\./g, '')}@gmail.com`;
  }
  return normalized;
};

const fallbackAdminEmails = ['junpei.t.820@gmail.com', 'j_tommy_820@yahoo.co.jp'];
const configuredAdminEmails = String(import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map(normalizeAdminEmail)
  .filter(Boolean);
const adminEmails = Array.from(new Set([...fallbackAdminEmails.map(normalizeAdminEmail), ...configuredAdminEmails]));

export const AdminClubsPage = () => {
  const { user, setUser, setShowAuth } = useDiagnosis();
  const [brands, setBrands] = useState<ClubBrand[]>([]);
  const [models, setModels] = useState<ClubModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', brandId: '', releaseYear: '', missingImages: false, onlyUnverified: false });
  const [brandForm, setBrandForm] = useState({ name: '', slug: '', official_url: '' });
  const [modelForm, setModelForm] = useState({ brand_id: '', model_name: '', slug: '', category: 'driver', release_year: '', official_url: '', aliases: '' });
  const [imageForm, setImageForm] = useState({
    club_model_id: '',
    image_url: '',
    storage_path: '',
    source_url: '',
    source_type: 'official',
    license_status: 'unknown',
    credit: '',
    copyright_notice: '',
    is_primary: true,
    is_verified: false,
  });
  const [aliasForm, setAliasForm] = useState({ club_model_id: '', alias: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [brandRows, modelRows] = await Promise.all([loadClubBrands(), loadClubModels(filters)]);
      setBrands(brandRows);
      setModels(modelRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'クラブマスターを読み込めませんでした。SQLを適用してください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.brandId, filters.releaseYear, filters.missingImages, filters.onlyUnverified]);

  const stats = useMemo(() => {
    const missingImages = models.filter((model) => !(model.club_images || []).some((image) => image.is_primary && image.is_verified)).length;
    return { brands: brands.length, models: models.length, missingImages };
  }, [brands.length, models]);

  const isAdmin = user.isLoggedIn && adminEmails.includes(normalizeAdminEmail(user.email));

  useEffect(() => {
    let mounted = true;
    const syncAdminSession = async () => {
      if (isAdmin || !isSupabaseConfigured) return;
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (!mounted || !authUser) return;
      if (!adminEmails.includes(normalizeAdminEmail(authUser.email || ''))) return;
      setUser({
        id: authUser.id,
        isLoggedIn: true,
        name: authUser.user_metadata?.name || 'Admin',
        email: authUser.email || '',
        memberSince: authUser.created_at,
        history: [],
      });
    };
    syncAdminSession();
    return () => {
      mounted = false;
    };
  }, [isAdmin, setUser]);

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] bg-[#F7F8F5] px-4 py-10">
        <div className="mx-auto max-w-md rounded-[1.7rem] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
          <h1 className="text-2xl font-black text-slate-950">管理者専用ページです</h1>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">クラブマスター管理は許可された管理者だけが利用できます。</p>
          {!user.isLoggedIn && (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#1F7A4D] px-5 text-sm font-black text-white"
            >
              ログインする
            </button>
          )}
        </div>
      </div>
    );
  }

  const createBrand = async () => {
    if (!brandForm.name.trim()) return;
    setSaving(true);
    setMessage('');
    setError('');
    const payload = {
      name: brandForm.name.trim(),
      slug: brandForm.slug.trim() || slugifyClub(brandForm.name),
      official_url: brandForm.official_url.trim() || null,
    };
    const { error } = await supabase.from('club_brands').insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('ブランドを追加しました。');
    setBrandForm({ name: '', slug: '', official_url: '' });
    load();
  };

  const createModel = async () => {
    if (!modelForm.brand_id || !modelForm.model_name.trim()) return;
    setSaving(true);
    setMessage('');
    setError('');
    const payload = {
      brand_id: modelForm.brand_id,
      model_name: modelForm.model_name.trim(),
      slug: modelForm.slug.trim() || slugifyClub(`${brands.find((brand) => brand.id === modelForm.brand_id)?.name || ''}-${modelForm.model_name}`),
      category: modelForm.category,
      release_year: modelForm.release_year ? Number(modelForm.release_year) : null,
      official_url: modelForm.official_url.trim() || null,
      aliases: modelForm.aliases.split(',').map((alias) => alias.trim()).filter(Boolean),
      is_verified: false,
    };
    const { error } = await supabase.from('club_models').insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('クラブモデルを追加しました。画像とソース確認後に公開してください。');
    setModelForm((current) => ({ ...current, model_name: '', slug: '', release_year: '', official_url: '', aliases: '' }));
    load();
  };

  const createImage = async () => {
    if (!imageForm.club_model_id || (!imageForm.image_url.trim() && !imageForm.storage_path.trim())) {
      setError('画像URLまたはstorage_pathを入力してください。');
      return;
    }
    if (imageForm.is_verified && imageForm.license_status === 'unknown') {
      setError('license_status unknown の画像は検証済みにできません。');
      return;
    }
    setSaving(true);
    setMessage('');
    setError('');
    const payload = {
      club_model_id: imageForm.club_model_id,
      image_url: imageForm.image_url.trim() || null,
      storage_path: imageForm.storage_path.trim() || null,
      source_url: imageForm.source_url.trim() || null,
      source_type: imageForm.source_type,
      license_status: imageForm.license_status,
      credit: imageForm.credit.trim() || null,
      copyright_notice: imageForm.copyright_notice.trim() || null,
      is_primary: imageForm.is_primary,
      is_verified: imageForm.is_verified && imageForm.license_status !== 'unknown' && imageForm.license_status !== 'prohibited',
      verified_at: imageForm.is_verified ? new Date().toISOString() : null,
    };
    const { error } = await supabase.from('club_images').insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('画像情報を登録しました。権利不明画像は本番主画像として扱いません。');
    setImageForm((current) => ({ ...current, image_url: '', storage_path: '', source_url: '', credit: '', copyright_notice: '', is_verified: false }));
    load();
  };

  const createAlias = async () => {
    if (!aliasForm.club_model_id || !aliasForm.alias.trim()) return;
    setSaving(true);
    setMessage('');
    setError('');
    const { error } = await supabase.from('club_aliases').insert({
      club_model_id: aliasForm.club_model_id,
      alias: aliasForm.alias.trim(),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('別名を追加しました。検索・表記揺れ対応に使えます。');
    setAliasForm((current) => ({ ...current, alias: '' }));
    load();
  };

  return (
    <div className="min-h-screen bg-[#F7F8F5] pb-20">
      <section className="rounded-[2rem] bg-[#0B0F0D] p-6 text-white md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#C7A45D] ring-1 ring-white/12">
          <Database size={14} />
          Admin / Clubs
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">クラブマスター管理</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/70">
          2006年以降のクラブモデル、画像URL、出典、ライセンス、検証状態を管理します。権利不明画像を勝手に保存・主画像化しないための管理画面です。
        </p>
      </section>

      {!isSupabaseConfigured && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800 ring-1 ring-amber-100">Supabase環境変数が未設定です。</div>}
      {(message || error) && <div className={`mt-4 rounded-2xl p-4 text-sm font-bold ${error ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'}`}>{error || message}</div>}

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ['ブランド', stats.brands],
          ['モデル', stats.models],
          ['画像未設定/未検証', stats.missingImages],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-black text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-[1.7rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
          <Filter size={16} />
          フィルター
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <select value={filters.brandId} onChange={(event) => setFilters((current) => ({ ...current, brandId: event.target.value }))} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold">
            <option value="">全ブランド</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold">
            <option value="">全カテゴリ</option>
            {categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
          </select>
          <input value={filters.releaseYear} onChange={(event) => setFilters((current) => ({ ...current, releaseYear: event.target.value }))} placeholder="発売年" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
          <label className="flex items-center gap-2 rounded-2xl bg-[#F5F7F4] px-3 py-3 text-sm font-black"><input type="checkbox" checked={filters.missingImages} onChange={(event) => setFilters((current) => ({ ...current, missingImages: event.target.checked }))} />画像未設定</label>
          <label className="flex items-center gap-2 rounded-2xl bg-[#F5F7F4] px-3 py-3 text-sm font-black"><input type="checkbox" checked={filters.onlyUnverified} onChange={(event) => setFilters((current) => ({ ...current, onlyUnverified: event.target.checked }))} />未検証</label>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-4">
        <div className="rounded-[1.7rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={18} />ブランド追加</h2>
          <div className="mt-4 space-y-3">
            <input value={brandForm.name} onChange={(event) => setBrandForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugifyClub(event.target.value) }))} placeholder="PING" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <input value={brandForm.slug} onChange={(event) => setBrandForm((current) => ({ ...current, slug: event.target.value }))} placeholder="ping" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <input value={brandForm.official_url} onChange={(event) => setBrandForm((current) => ({ ...current, official_url: event.target.value }))} placeholder="公式URL" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <button onClick={createBrand} disabled={saving} className="min-h-11 w-full rounded-2xl bg-[#1F7A4D] text-sm font-black text-white">追加</button>
          </div>
        </div>

        <div className="rounded-[1.7rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 text-lg font-black"><ShieldCheck size={18} />モデル追加</h2>
          <div className="mt-4 space-y-3">
            <select value={modelForm.brand_id} onChange={(event) => setModelForm((current) => ({ ...current, brand_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold">
              <option value="">ブランド選択</option>
              {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
            <input value={modelForm.model_name} onChange={(event) => setModelForm((current) => ({ ...current, model_name: event.target.value }))} placeholder="G440 MAX" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <select value={modelForm.category} onChange={(event) => setModelForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold">
              {categories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
            </select>
            <input value={modelForm.release_year} onChange={(event) => setModelForm((current) => ({ ...current, release_year: event.target.value }))} placeholder="発売年 例: 2026" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <input value={modelForm.official_url} onChange={(event) => setModelForm((current) => ({ ...current, official_url: event.target.value }))} placeholder="公式URL" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <input value={modelForm.aliases} onChange={(event) => setModelForm((current) => ({ ...current, aliases: event.target.value }))} placeholder="別名 カンマ区切り" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <button onClick={createModel} disabled={saving} className="min-h-11 w-full rounded-2xl bg-[#1F7A4D] text-sm font-black text-white">追加</button>
          </div>
        </div>

        <div className="rounded-[1.7rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 text-lg font-black"><ImagePlus size={18} />画像情報追加</h2>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">権利確認済みの画像だけ検証済みにしてください。unknown/prohibitedは主画像として強く表示しません。</p>
          <div className="mt-4 space-y-3">
            <select value={imageForm.club_model_id} onChange={(event) => setImageForm((current) => ({ ...current, club_model_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold">
              <option value="">モデル選択</option>
              {models.map((model) => <option key={model.id} value={model.id}>{model.club_brands?.name} {model.model_name}</option>)}
            </select>
            <input value={imageForm.image_url} onChange={(event) => setImageForm((current) => ({ ...current, image_url: event.target.value }))} placeholder="画像URL" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <input value={imageForm.storage_path} onChange={(event) => setImageForm((current) => ({ ...current, storage_path: event.target.value }))} placeholder="storage_path（自社/許諾画像のみ）" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <input value={imageForm.source_url} onChange={(event) => setImageForm((current) => ({ ...current, source_url: event.target.value }))} placeholder="source_url" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <select value={imageForm.source_type} onChange={(event) => setImageForm((current) => ({ ...current, source_type: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold">
              {sourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <select value={imageForm.license_status} onChange={(event) => setImageForm((current) => ({ ...current, license_status: event.target.value, is_verified: false }))} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold">
              {licenseStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input value={imageForm.credit} onChange={(event) => setImageForm((current) => ({ ...current, credit: event.target.value }))} placeholder="credit" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <input value={imageForm.copyright_notice} onChange={(event) => setImageForm((current) => ({ ...current, copyright_notice: event.target.value }))} placeholder="copyright_notice" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={imageForm.is_primary} onChange={(event) => setImageForm((current) => ({ ...current, is_primary: event.target.checked }))} /> primary画像</label>
            <label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={imageForm.is_verified} onChange={(event) => setImageForm((current) => ({ ...current, is_verified: event.target.checked }))} /> 権利確認済み</label>
            <button onClick={createImage} disabled={saving} className="min-h-11 w-full rounded-2xl bg-[#0B0F0D] text-sm font-black text-white">{saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : '画像情報を登録'}</button>
          </div>
        </div>

        <div className="rounded-[1.7rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="flex items-center gap-2 text-lg font-black"><Plus size={18} />別名追加</h2>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">PING/ピン、VENTUS/ベンタスなど、表記揺れ検索の土台です。</p>
          <div className="mt-4 space-y-3">
            <select value={aliasForm.club_model_id} onChange={(event) => setAliasForm((current) => ({ ...current, club_model_id: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold">
              <option value="">モデル選択</option>
              {models.map((model) => <option key={model.id} value={model.id}>{model.club_brands?.name} {model.model_name}</option>)}
            </select>
            <input value={aliasForm.alias} onChange={(event) => setAliasForm((current) => ({ ...current, alias: event.target.value }))} placeholder="例: ピン G440 MAX" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" />
            <button onClick={createAlias} disabled={saving} className="min-h-11 w-full rounded-2xl bg-[#1F7A4D] text-sm font-black text-white">別名を追加</button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-black text-slate-950">モデル一覧</h2>
        {loading && <div className="mt-3 rounded-2xl bg-white p-5 text-sm font-black text-slate-500 ring-1 ring-black/5">読み込み中...</div>}
        {!loading && models.length === 0 && <div className="mt-3 rounded-2xl bg-white p-5 text-sm font-bold text-slate-500 ring-1 ring-black/5">まだモデルがありません。</div>}
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {models.map((model) => <ClubImageCard key={model.id} model={model} />)}
        </div>
      </section>
    </div>
  );
};
