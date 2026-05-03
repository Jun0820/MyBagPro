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

    const normalizedClubs = Array.isArray(clubPayloads)
      ? clubPayloads.map((club: any) => ({
          id: toText(club?.id),
          user_id: user.id,
          category: toText(club?.category),
          brand: toText(club?.brand),
          model: toText(club?.model),
          shaft: toText(club?.shaft),
          loft: toText(club?.loft),
          distance: toText(club?.distance),
        }))
      : [];

    const dedupedClubs = Array.from(
      new Map(normalizedClubs.filter((club) => club.id).map((club) => [club.id, club])).values(),
    );

    const profileResult = await adminClient.from('profiles').upsert(sanitizedProfilePayload);
    if (profileResult.error) {
      throw new Error(`profiles save: ${profileResult.error.message}`);
    }

    const deleteResult = await adminClient.from('clubs').delete().eq('user_id', user.id);
    if (deleteResult.error) {
      throw new Error(`clubs clear: ${deleteResult.error.message}`);
    }

    let insertedCount = 0;
    if (dedupedClubs.length > 0) {
      const insertResult = await adminClient.from('clubs').insert(dedupedClubs);
      if (insertResult.error) {
        throw new Error(`clubs insert: ${insertResult.error.message}`);
      }
      insertedCount = dedupedClubs.length;
    }

    const verifyResult = await adminClient
      .from('clubs')
      .select('id,category,brand,model,shaft,loft,distance')
      .eq('user_id', user.id);

    if (verifyResult.error) {
      throw new Error(`clubs verify: ${verifyResult.error.message}`);
    }

    const verifiedIds = new Set((verifyResult.data || []).map((row) => row.id));
    const expectedById = new Map(dedupedClubs.map((club) => [club.id, club]));
    const expected = Array.isArray(expectedIds) ? expectedIds.map((id) => toText(id)).filter(Boolean) : [];
    const missingIds = expected.filter((id) => !verifiedIds.has(id));

    if ((verifyResult.data || []).length !== dedupedClubs.length) {
      throw new Error(`clubs verify: expected ${dedupedClubs.length} rows but found ${(verifyResult.data || []).length}`);
    }

    if (missingIds.length > 0) {
      throw new Error(`clubs verify: missing ${missingIds.length} ids`);
    }

    const mismatchedIds = (verifyResult.data || [])
      .filter((row) => {
        const expectedClub = expectedById.get(row.id);
        if (!expectedClub) return true;
        return (
          toText(row.category) !== expectedClub.category ||
          toText(row.brand) !== expectedClub.brand ||
          toText(row.model) !== expectedClub.model ||
          toText(row.shaft) !== expectedClub.shaft ||
          toText(row.loft) !== expectedClub.loft ||
          toText(row.distance) !== expectedClub.distance
        );
      })
      .map((row) => row.id);

    if (mismatchedIds.length > 0) {
      throw new Error(`clubs verify: ${mismatchedIds.length} rows saved with unexpected field values`);
    }

    return json(res, 200, {
      ok: true,
      receivedCount: normalizedClubs.length,
      dedupedCount: dedupedClubs.length,
      insertedCount,
      verifiedCount: (verifyResult.data || []).length,
      expectedCount: dedupedClubs.length,
      sampleClubs: dedupedClubs.slice(-4).map((club) => ({
        id: club.id,
        category: club.category,
        number: '',
        brand: club.brand,
        model: club.model,
        distance: club.distance,
      })),
    });
  } catch (error: any) {
    return json(res, 500, {
      ok: false,
      error: error?.message || 'Unexpected save error',
    });
  }
}
