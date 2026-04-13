import type { UserCustomLink, UserSocialLinks } from '../types/golf';

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const toNumberOrUndefined = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeCustomLink = (value: unknown, fallbackIndex: number): UserCustomLink | null => {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const label = typeof record.label === 'string' ? record.label.trim() : '';
  const url = typeof record.url === 'string' ? record.url.trim() : '';

  if (!label || !url || !isValidUrl(url)) return null;

  const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `link-${fallbackIndex + 1}`;

  return { id, label, url };
};

export const normalizeUserSocialLinks = (value: unknown): UserSocialLinks => {
  if (!value || typeof value !== 'object') return {};

  const record = value as Record<string, unknown>;
  const customLinksSource = Array.isArray(record.customLinks) ? record.customLinks : [];
  const profileStatsSource =
    record.profileStats && typeof record.profileStats === 'object'
      ? (record.profileStats as Record<string, unknown>)
      : {};

  const instagram = typeof record.instagram === 'string' ? record.instagram.trim().replace(/^@+/, '') : '';
  const x = typeof record.x === 'string' ? record.x.trim().replace(/^@+/, '') : '';
  const customLinks = customLinksSource
    .map((entry, index) => normalizeCustomLink(entry, index))
    .filter((entry): entry is UserCustomLink => Boolean(entry));

  const bestScore = toNumberOrUndefined(profileStatsSource.bestScore);
  const averageScore = toNumberOrUndefined(profileStatsSource.averageScore);

  return {
    instagram: instagram || undefined,
    x: x || undefined,
    customLinks,
    profileStats:
      bestScore !== undefined || averageScore !== undefined
        ? {
            bestScore,
            averageScore,
          }
        : undefined,
  };
};

export const buildStoredSocialLinks = (
  links: UserSocialLinks | undefined,
  stats?: { bestScore?: number; averageScore?: number },
): UserSocialLinks => {
  const normalized = normalizeUserSocialLinks(links || {});
  const bestScore = toNumberOrUndefined(stats?.bestScore);
  const averageScore = toNumberOrUndefined(stats?.averageScore);

  return {
    ...(normalized.instagram ? { instagram: normalized.instagram } : {}),
    ...(normalized.x ? { x: normalized.x } : {}),
    ...(normalized.customLinks && normalized.customLinks.length > 0
      ? { customLinks: normalized.customLinks }
      : {}),
    ...(bestScore !== undefined || averageScore !== undefined
      ? {
          profileStats: {
            ...(bestScore !== undefined ? { bestScore } : {}),
            ...(averageScore !== undefined ? { averageScore } : {}),
          },
        }
      : {}),
  };
};
