import type { Club, UserCustomLink, UserSocialLinks } from '../types/golf';

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

const normalizeBagSnapshotClub = (value: unknown, fallbackIndex: number): Club | null => {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `club-${fallbackIndex + 1}`;
  const category = typeof record.category === 'string' ? record.category.trim() : '';
  const brand = typeof record.brand === 'string' ? record.brand.trim() : '';
  const model = typeof record.model === 'string' ? record.model.trim() : '';

  if (!category && !brand && !model) return null;

  return {
    id,
    category,
    brand,
    model,
    shaft: typeof record.shaft === 'string' ? record.shaft.trim() : '',
    flex: typeof record.flex === 'string' ? record.flex.trim() : '',
    number: typeof record.number === 'string' ? record.number.trim() : '',
    loft: typeof record.loft === 'string' ? record.loft.trim() : '',
    distance: typeof record.distance === 'string' ? record.distance.trim() : '',
    carryDistance: typeof record.carryDistance === 'string' ? record.carryDistance.trim() : '',
    worry: typeof record.worry === 'string' ? record.worry.trim() : '',
  };
};

export const normalizeUserSocialLinks = (value: unknown): UserSocialLinks => {
  if (!value || typeof value !== 'object') return {};

  const record = value as Record<string, unknown>;
  const customLinksSource = Array.isArray(record.customLinks) ? record.customLinks : [];
  const bagSnapshotSource =
    record.bagSnapshot && typeof record.bagSnapshot === 'object'
      ? (record.bagSnapshot as Record<string, unknown>)
      : {};
  const profileStatsSource =
    record.profileStats && typeof record.profileStats === 'object'
      ? (record.profileStats as Record<string, unknown>)
      : {};

  const instagram = typeof record.instagram === 'string' ? record.instagram.trim().replace(/^@+/, '') : '';
  const x = typeof record.x === 'string' ? record.x.trim().replace(/^@+/, '') : '';
  const customLinks = customLinksSource
    .map((entry, index) => normalizeCustomLink(entry, index))
    .filter((entry): entry is UserCustomLink => Boolean(entry));
  const bagSnapshotClubs = Array.isArray(bagSnapshotSource.clubs)
    ? bagSnapshotSource.clubs
        .map((entry, index) => normalizeBagSnapshotClub(entry, index))
        .filter((entry): entry is Club => Boolean(entry))
    : [];
  const bagSnapshotBall = typeof bagSnapshotSource.ball === 'string' ? bagSnapshotSource.ball.trim() : '';
  const bagSnapshotUpdatedAt =
    typeof bagSnapshotSource.updatedAt === 'string' ? bagSnapshotSource.updatedAt.trim() : '';

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
    bagSnapshot:
      bagSnapshotClubs.length > 0 || bagSnapshotBall || bagSnapshotUpdatedAt
        ? {
            clubs: bagSnapshotClubs,
            ...(bagSnapshotBall ? { ball: bagSnapshotBall } : {}),
            ...(bagSnapshotUpdatedAt ? { updatedAt: bagSnapshotUpdatedAt } : {}),
          }
        : undefined,
  };
};

export const buildStoredSocialLinks = (
  links: UserSocialLinks | undefined,
  stats?: { bestScore?: number; averageScore?: number },
  bagSnapshot?: UserSocialLinks['bagSnapshot'],
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
    ...(bagSnapshot && bagSnapshot.clubs.length > 0
      ? {
          bagSnapshot: {
            clubs: bagSnapshot.clubs,
            ...(bagSnapshot.ball ? { ball: bagSnapshot.ball } : {}),
            ...(bagSnapshot.updatedAt ? { updatedAt: bagSnapshot.updatedAt } : {}),
          },
        }
      : {}),
  };
};
