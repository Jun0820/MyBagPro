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
    shaftWeight: typeof record.shaftWeight === 'string' ? record.shaftWeight.trim() : '',
    sleeveSetting: typeof record.sleeveSetting === 'string' ? record.sleeveSetting.trim() : '',
    length: typeof record.length === 'string' ? record.length.trim() : '',
    lieAngle: typeof record.lieAngle === 'string' ? record.lieAngle.trim() : '',
    bounce: typeof record.bounce === 'string' ? record.bounce.trim() : '',
    grind: typeof record.grind === 'string' ? record.grind.trim() : '',
    headShape: typeof record.headShape === 'string' ? record.headShape.trim() : '',
    mainUse: Array.isArray(record.mainUse) ? record.mainUse.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [],
    missTendency: Array.isArray(record.missTendency) ? record.missTendency.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [],
    memo: typeof record.memo === 'string' ? record.memo.trim() : '',
    copiedFromClubId: typeof record.copiedFromClubId === 'string' ? record.copiedFromClubId.trim() : '',
  };
};

export const normalizeUserSocialLinks = (value: unknown): UserSocialLinks => {
  if (!value || typeof value !== 'object') return {};

  const record = value as Record<string, unknown>;
  const golfId = record.golfId && typeof record.golfId === 'object'
    ? (record.golfId as Record<string, unknown>)
    : undefined;
  const youtube = typeof record.youtube === 'string' ? record.youtube.trim() : '';
  const tiktok = typeof record.tiktok === 'string' ? record.tiktok.trim() : '';
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
  const bagSnapshotName = typeof bagSnapshotSource.name === 'string' ? bagSnapshotSource.name.trim() : '';
  const bagSnapshotPurpose = typeof bagSnapshotSource.purpose === 'string' ? bagSnapshotSource.purpose.trim() : '';
  const bagSnapshotBallBrand = typeof bagSnapshotSource.ballBrand === 'string' ? bagSnapshotSource.ballBrand.trim() : '';
  const bagSnapshotBallColor = typeof bagSnapshotSource.ballColor === 'string' ? bagSnapshotSource.ballColor.trim() : '';
  const bagSnapshotBallMemo = typeof bagSnapshotSource.ballMemo === 'string' ? bagSnapshotSource.ballMemo.trim() : '';
  const bagSnapshotUpdatedAt =
    typeof bagSnapshotSource.updatedAt === 'string' ? bagSnapshotSource.updatedAt.trim() : '';

  const bestScore = toNumberOrUndefined(profileStatsSource.bestScore);
  const averageScore = toNumberOrUndefined(profileStatsSource.averageScore);

  return {
    ...(golfId ? { golfId } : {}),
    ...(youtube ? { youtube } : {}),
    ...(tiktok ? { tiktok } : {}),
    ...(record.custom1 && typeof record.custom1 === 'object' ? { custom1: record.custom1 } : {}),
    ...(record.custom2 && typeof record.custom2 === 'object' ? { custom2: record.custom2 } : {}),
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
      bagSnapshotClubs.length > 0 || bagSnapshotBall || bagSnapshotName || bagSnapshotPurpose || bagSnapshotBallBrand || bagSnapshotBallColor || bagSnapshotBallMemo || bagSnapshotUpdatedAt
        ? {
            clubs: bagSnapshotClubs,
            ...(bagSnapshotBall ? { ball: bagSnapshotBall } : {}),
            ...(bagSnapshotName ? { name: bagSnapshotName } : {}),
            ...(bagSnapshotPurpose ? { purpose: bagSnapshotPurpose } : {}),
            ...(bagSnapshotBallBrand ? { ballBrand: bagSnapshotBallBrand } : {}),
            ...(bagSnapshotBallColor ? { ballColor: bagSnapshotBallColor } : {}),
            ...(bagSnapshotBallMemo ? { ballMemo: bagSnapshotBallMemo } : {}),
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
  const passthrough = normalized as UserSocialLinks & {
    golfId?: Record<string, unknown>;
    youtube?: string;
    tiktok?: string;
    custom1?: unknown;
    custom2?: unknown;
  };
  const bestScore = toNumberOrUndefined(stats?.bestScore);
  const averageScore = toNumberOrUndefined(stats?.averageScore);

  return {
    ...(passthrough.golfId ? { golfId: passthrough.golfId } : {}),
    ...(passthrough.youtube ? { youtube: passthrough.youtube } : {}),
    ...(passthrough.tiktok ? { tiktok: passthrough.tiktok } : {}),
    ...(passthrough.custom1 ? { custom1: passthrough.custom1 } : {}),
    ...(passthrough.custom2 ? { custom2: passthrough.custom2 } : {}),
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
            ...(bagSnapshot.name ? { name: bagSnapshot.name } : {}),
            ...(bagSnapshot.purpose ? { purpose: bagSnapshot.purpose } : {}),
            ...(bagSnapshot.ballBrand ? { ballBrand: bagSnapshot.ballBrand } : {}),
            ...(bagSnapshot.ballColor ? { ballColor: bagSnapshot.ballColor } : {}),
            ...(bagSnapshot.ballMemo ? { ballMemo: bagSnapshot.ballMemo } : {}),
            ...(bagSnapshot.updatedAt ? { updatedAt: bagSnapshot.updatedAt } : {}),
          },
        }
      : {}),
  };
};
