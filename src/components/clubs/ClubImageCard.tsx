import { ImageIcon } from 'lucide-react';
import { clubImageAlt, getPrimaryClubImage, type ClubModel } from '../../lib/clubMaster';

export const ClubImageCard = ({ model, compact = false }: { model: ClubModel; compact?: boolean }) => {
  const image = getPrimaryClubImage(model);
  const alt = clubImageAlt(model);

  return (
    <figure className={`overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 ${compact ? 'grid grid-cols-[88px_1fr]' : ''}`}>
      <div className={`${compact ? 'h-full min-h-[88px]' : 'aspect-[4/3]'} bg-[#F5F7F4]`}>
        {image?.image_url ? (
          <img src={image.image_url} alt={alt} className="h-full w-full object-contain p-3" loading="lazy" />
        ) : (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 px-3 text-center text-slate-400">
            <ImageIcon className="h-7 w-7" />
            <span className="text-[11px] font-black">画像準備中</span>
          </div>
        )}
      </div>
      <figcaption className="p-3">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#1F7A4D]">{model.club_brands?.name || 'Brand'}</p>
        <h3 className="mt-1 text-sm font-black leading-5 text-slate-950">{model.model_name}</h3>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {[model.release_year ? `${model.release_year}` : null, model.category].filter(Boolean).join(' / ')}
        </p>
        {image && (
          <p className="mt-2 text-[10px] font-bold leading-4 text-slate-400">
            {image.credit || image.source_type || 'verified image'} / {image.license_status}
          </p>
        )}
      </figcaption>
    </figure>
  );
};
