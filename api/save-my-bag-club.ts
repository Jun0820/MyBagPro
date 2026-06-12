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
    ? value.map((item) => toText(item).trim()).filter(Boolean)
    : [];

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

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

  const { profilePayload = {}, clubPayload = null } = req.body || {};

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

  if (!clubPayload || typeof clubPayload !== 'object') {
    return json(res, 400, { ok: false, error: 'clubPayload is required' });
  }

  try {
    const sanitizedProfilePayload = {
      ...profilePayload,
      id: user.id,
      updated_at: new Date().toISOString(),
    };

    const normalizedClubBase = {
      id: toText((clubPayload as any).id),
      user_id: user.id,
      category: toText((clubPayload as any).category),
      brand: toText((clubPayload as any).brand),
      model: toText((clubPayload as any).model),
      shaft: toText((clubPayload as any).shaft),
      loft: toText((clubPayload as any).loft),
      distance: toText((clubPayload as any).distance),
    };

    if (!isUuid(normalizedClubBase.id)) {
      throw new Error('clubPayload.id must be a persisted uuid');
    }

    const normalizedClub = {
      ...normalizedClubBase,
      flex: toText((clubPayload as any).flex),
      number: toText((clubPayload as any).number),
      carry_distance: toText((clubPayload as any).carryDistance),
      worry: toText((clubPayload as any).worry),
      shaft_weight: toText((clubPayload as any).shaftWeight),
      sleeve_setting: toText((clubPayload as any).sleeveSetting),
      length: toText((clubPayload as any).length),
      lie_angle: toText((clubPayload as any).lieAngle),
      bounce: toText((clubPayload as any).bounce),
      grind: toText((clubPayload as any).grind),
      head_shape: toText((clubPayload as any).headShape),
      main_use: toTextArray((clubPayload as any).mainUse),
      miss_tendency: toTextArray((clubPayload as any).missTendency),
      memo: toText((clubPayload as any).memo),
      copied_from_club_id: isUuid(toText((clubPayload as any).copiedFromClubId)) ? toText((clubPayload as any).copiedFromClubId) : null,
    };
    let supportsExtendedClubColumns = true;

    const profileResult = await adminClient.from('profiles').upsert(sanitizedProfilePayload);
    if (profileResult.error) {
      throw new Error(`profiles save: ${profileResult.error.message}`);
    }

    const existingClub = await adminClient
      .from('clubs')
      .select('id,user_id')
      .eq('id', normalizedClubBase.id)
      .maybeSingle();

    if (existingClub.error && existingClub.error.code !== 'PGRST116') {
      throw new Error(`clubs lookup: ${existingClub.error.message}`);
    }
    if (existingClub.data && existingClub.data.user_id !== user.id) {
      return json(res, 403, { ok: false, error: 'You can only update your own club record' });
    }

    let upsertResult = await adminClient.from('clubs').upsert(normalizedClub, { onConflict: 'id' });
    if (upsertResult.error && isUndefinedColumnError(upsertResult.error)) {
      supportsExtendedClubColumns = false;
      upsertResult = await adminClient.from('clubs').upsert(normalizedClubBase, { onConflict: 'id' });
    }
    if (upsertResult.error) {
      throw new Error(`clubs upsert: ${upsertResult.error.message}`);
    }

    const verifyResult = await adminClient
      .from('clubs')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', normalizedClubBase.id)
      .maybeSingle();

    if (verifyResult.error) {
      throw new Error(`clubs verify: ${verifyResult.error.message}`);
    }
    if (!verifyResult.data) {
      throw new Error('clubs verify: target row missing after save');
    }

    return json(res, 200, {
      ok: true,
      receivedCount: 1,
      dedupedCount: 1,
      insertedCount: 1,
      verifiedCount: 1,
      expectedCount: 1,
      sampleClubs: [{
        id: normalizedClubBase.id,
        category: normalizedClubBase.category,
        number: toText((normalizedClub as any).number),
        brand: normalizedClubBase.brand,
        model: normalizedClubBase.model,
        distance: normalizedClubBase.distance,
      }],
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
