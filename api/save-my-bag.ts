import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const json = (res: any, status: number, body: Record<string, unknown>) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const toText = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));
const toTextArray = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => toText(item).trim())
        .filter(Boolean)
    : [];

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.random() * 16 | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
};

const isUndefinedColumnError = (error: any) =>
  error?.code === '42703' || String(error?.message || '').toLowerCase().includes('column');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return json(res, 500, {
      ok: false,
      error: 'Supabase server configuration is incomplete',
    });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return json(res, 401, { ok: false, error: 'Missing access token' });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    profilePayload = {},
    clubPayloads = [],
    expectedIds = [],
  } = req.body || {};

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(token);

  if (authError || !user) {
    return json(res, 401, {
      ok: false,
      error: authError?.message || 'User not authenticated',
    });
  }

  try {
    const sanitizedProfilePayload = {
      ...profilePayload,
      id: user.id,
      updated_at: new Date().toISOString(),
    };

    const idMap = new Map<string, string>();
    const toPersistedClubId = (rawId: unknown) => {
      const textId = toText(rawId);
      if (textId && isUuid(textId)) return textId;
      if (textId && idMap.has(textId)) return idMap.get(textId) as string;
      const nextId = generateUuid();
      if (textId) idMap.set(textId, nextId);
      return nextId;
    };

    const baseNormalizedClubs = Array.isArray(clubPayloads)
      ? clubPayloads.map((club: any) => ({
          id: toPersistedClubId(club?.id),
          user_id: user.id,
          category: toText(club?.category),
          brand: toText(club?.brand),
          model: toText(club?.model),
          shaft: toText(club?.shaft),
          loft: toText(club?.loft),
          distance: toText(club?.distance),
        }))
      : [];

    const extendedNormalizedClubs = Array.isArray(clubPayloads)
      ? clubPayloads.map((club: any, index: number) => {
          const baseClub = baseNormalizedClubs[index];
          return {
            ...baseClub,
            flex: toText(club?.flex),
            number: toText(club?.number),
            carry_distance: toText(club?.carryDistance),
            worry: toText(club?.worry),
            shaft_weight: toText(club?.shaftWeight),
            sleeve_setting: toText(club?.sleeveSetting),
            length: toText(club?.length),
            lie_angle: toText(club?.lieAngle),
            bounce: toText(club?.bounce),
            grind: toText(club?.grind),
            head_shape: toText(club?.headShape),
            main_use: toTextArray(club?.mainUse),
            miss_tendency: toTextArray(club?.missTendency),
            memo: toText(club?.memo),
            copied_from_club_id: isUuid(toText(club?.copiedFromClubId)) ? toText(club?.copiedFromClubId) : null,
          };
        })
      : [];

    const dedupedClubs = Array.from(
      new Map(extendedNormalizedClubs.filter((club) => club.id).map((club) => [club.id, club])).values(),
    );
    const dedupedBaseClubs = Array.from(
      new Map(baseNormalizedClubs.filter((club) => club.id).map((club) => [club.id, club])).values(),
    );
    let persistedClubs: any[] = dedupedClubs;
    let supportsExtendedClubColumns = true;

    const profileResult = await adminClient.from('profiles').upsert(sanitizedProfilePayload);
    if (profileResult.error) {
      throw new Error(`profiles save: ${profileResult.error.message}`);
    }

    let insertedCount = 0;
    if (dedupedClubs.length > 0) {
      let insertResult = await adminClient.from('clubs').upsert(dedupedClubs, { onConflict: 'id' });
      if (insertResult.error && isUndefinedColumnError(insertResult.error)) {
        supportsExtendedClubColumns = false;
        persistedClubs = dedupedBaseClubs;
        insertResult = await adminClient.from('clubs').upsert(dedupedBaseClubs, { onConflict: 'id' });
      }
      if (insertResult.error) {
        throw new Error(`clubs upsert: ${insertResult.error.message}`);
      }
      insertedCount = persistedClubs.length;
    }

    const persistedIds = persistedClubs.map((club) => club.id).filter(Boolean);
    const deleteQuery = adminClient.from('clubs').delete().eq('user_id', user.id);
    const deleteResult = persistedIds.length > 0
      ? await deleteQuery.not('id', 'in', `(${persistedIds.join(',')})`)
      : await deleteQuery;
    if (deleteResult.error) {
      throw new Error(`clubs cleanup: ${deleteResult.error.message}`);
    }

    const verifyResult = await adminClient
      .from('clubs')
      .select('id')
      .eq('user_id', user.id);

    if (verifyResult.error) {
      throw new Error(`clubs verify: ${verifyResult.error.message}`);
    }

    const verifiedRows = (verifyResult.data || []) as any[];
    const verifiedIds = new Set(verifiedRows.map((row) => row.id));
    const expected = Array.isArray(expectedIds)
      ? expectedIds.map((id) => {
          const textId = toText(id);
          return idMap.get(textId) || textId;
        }).filter(Boolean)
      : [];
    const missingIds = expected.filter((id) => !verifiedIds.has(id));

    if (verifiedRows.length !== persistedClubs.length) {
      throw new Error(`clubs verify: expected ${persistedClubs.length} rows but found ${verifiedRows.length}`);
    }

    if (missingIds.length > 0) {
      throw new Error(`clubs verify: missing ${missingIds.length} ids`);
    }

    return json(res, 200, {
      ok: true,
      receivedCount: extendedNormalizedClubs.length,
      dedupedCount: persistedClubs.length,
      insertedCount,
      verifiedCount: verifiedRows.length,
      expectedCount: persistedClubs.length,
      sampleClubs: persistedClubs.slice(-4).map((club) => ({
        id: club.id,
        category: club.category,
        number: toText((club as any).number),
        brand: club.brand,
        model: club.model,
        distance: club.distance,
      })),
      extendedColumnsSaved: supportsExtendedClubColumns,
      missingExtendedColumns: supportsExtendedClubColumns ? [] : ['extended_club_fields'],
    });
  } catch (error: any) {
    return json(res, 500, {
      ok: false,
      error: error?.message || 'Unexpected save error',
    });
  }
}
