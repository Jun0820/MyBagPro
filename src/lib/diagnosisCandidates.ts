import { BALL_DB } from './ball_data';
import { getAllBrands, getAllModels, getBrands, getModels, getShaftModels, mapCategoryToKey } from './data';
import type { UserProfile } from '../types/golf';
import { TargetCategory } from '../types/golf';

type ClubRanking = {
    rank?: number;
    brand?: string;
    modelName?: string;
    matchPercentage?: number;
    catchphrase?: string;
    reasoning?: string;
    radarChart?: Record<string, number>;
    shafts?: Array<string | { modelName?: string; spec?: string }>;
    expertOpinion?: string;
    loft?: string | number;
};

type ClubDiagnosisPayload = {
    aiResponseText?: string;
    userSwingDna?: {
        type?: string;
        description?: string;
        keyNeeds?: string[];
    };
    currentGearAnalysis?: {
        matchPercentage?: number;
        cons?: string;
        pros?: string;
        typeDescription?: string;
    };
    rankings?: ClubRanking[];
    advice?: string;
};

type BallDiagnosisPayload = {
    recommendedBall?: {
        name?: string;
        brand?: string;
        matchScore?: number;
        catchphrase?: string;
        description?: string;
        radarChart?: Record<string, number>;
        radar?: Record<string, number>;
        expertOpinion?: string;
    };
    alternatives?: Array<{
        type?: string;
        name?: string;
        brand?: string;
        reason?: string;
    }>;
    gearSynergyAdvice?: string;
};

const CLUB_CATEGORY_KEYS = ['DRIVER', 'FAIRWAY', 'UTILITY', 'IRON', 'WEDGE'] as const;

const normalizeKey = (value: string | null | undefined) =>
    String(value || '')
        .toLowerCase()
        .replace(/[()（）]/g, ' ')
        .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const dedupeStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const getCategoryKeysForProfile = (profile: UserProfile): string[] => {
    if (profile.targetCategory === TargetCategory.TOTAL_SETTING) {
        return [...CLUB_CATEGORY_KEYS];
    }

    const key = mapCategoryToKey(profile.targetCategory || TargetCategory.DRIVER);
    return CLUB_CATEGORY_KEYS.includes(key as (typeof CLUB_CATEGORY_KEYS)[number]) ? [key] : ['DRIVER'];
};

const getAllowedBrandsForProfile = (profile: UserProfile) => {
    const categoryKeys = getCategoryKeysForProfile(profile);
    const brands = new Set<string>();

    for (const categoryKey of categoryKeys) {
        for (const brand of getBrands(categoryKey)) {
            brands.add(brand);
        }
    }

    return Array.from(brands).sort();
};

const getAllowedModelsForProfile = (profile: UserProfile) => {
    const categoryKeys = getCategoryKeysForProfile(profile);
    const modelsByBrand = new Map<string, string[]>();

    for (const brand of getAllowedBrandsForProfile(profile)) {
        const models = new Set<string>();
        for (const categoryKey of categoryKeys) {
            for (const model of getModels(brand, categoryKey)) {
                models.add(model);
            }
        }
        if (models.size > 0) {
            modelsByBrand.set(brand, Array.from(models).sort());
        }
    }

    return modelsByBrand;
};

const getAllowedShaftsForProfile = (profile: UserProfile) => {
    const categoryKeys = getCategoryKeysForProfile(profile);
    const shafts = new Set<string>();

    for (const categoryKey of categoryKeys) {
        for (const shaft of getShaftModels(categoryKey)) {
            shafts.add(shaft);
        }
    }

    return Array.from(shafts).sort();
};

const buildModelLookup = (profile: UserProfile) => {
    const modelsByBrand = getAllowedModelsForProfile(profile);
    const modelLookup = new Map<string, { brand: string; modelName: string }>();

    for (const [brand, models] of modelsByBrand.entries()) {
        for (const modelName of models) {
            modelLookup.set(normalizeKey(`${brand} ${modelName}`), { brand, modelName });
            modelLookup.set(normalizeKey(modelName), { brand, modelName });
        }
    }

    return { modelsByBrand, modelLookup };
};

const buildShaftLookup = (profile: UserProfile) => {
    const shafts = getAllowedShaftsForProfile(profile);
    const lookup = new Map<string, string>();

    for (const shaft of shafts) {
        lookup.set(normalizeKey(shaft), shaft);
    }

    return { shafts, lookup };
};

const formatCandidatesForPrompt = (profile: UserProfile) => {
    const categoryKeys = getCategoryKeysForProfile(profile);
    const { modelsByBrand } = buildModelLookup(profile);
    const { shafts } = buildShaftLookup(profile);

    const brandLines = Array.from(modelsByBrand.entries())
        .map(([brand, models]) => `- ${brand}: ${models.join(' / ')}`)
        .join('\n');

    return `### 【この診断で使ってよい候補】
対象カテゴリ: ${categoryKeys.join(', ')}

#### 許可されたヘッド候補
${brandLines}

#### 許可されたシャフト候補
- ${shafts.join(' / ')}

#### 厳守ルール
- 上の候補にないブランド名・モデル名・シャフト名は絶対に出力しない
- 略称・仮称・後継モデルの推測・海外未確認名は使わない
- 候補にない場合は、近い名前を作らず、必ず候補の中から選ぶ
- JSON内の brand / modelName / shafts には、上の正式名称をそのまま使う`;
};

const buildValidatedClubNarrative = (result: ClubDiagnosisPayload) => {
    const top = result.rankings?.[0];
    if (!top) return '';

    const shaftName = typeof top.shafts?.[0] === 'string'
        ? top.shafts[0]
        : top.shafts?.[0]?.modelName || '診断条件に合うシャフト';

    const summary = result.userSwingDna?.description || result.advice || '現在の条件に合う候補を、現行モデルから整理しました。';
    const bestReason = top.reasoning || result.advice || '入力条件との適合度が高く、現状のミス傾向を補いやすい組み合わせです。';
    const adviceLines = dedupeStrings([
        ...(result.userSwingDna?.keyNeeds || []),
        result.advice || '',
    ]).slice(0, 3);

    const sections = [
        '## 🎯 診断サマリー',
        summary,
        '',
        '## 🏆 ベストマッチ提案',
        `- **ヘッド**: ${top.brand} ${top.modelName}`,
        `- **ロフト角**: ${top.loft || '診断条件に合わせて調整'}`,
        `- **シャフト**: ${shaftName}`,
        `- **おすすめの理由**: ${bestReason}`,
    ];

    if (adviceLines.length > 0) {
        sections.push('', '## ⚙️ セッティングのワンポイントアドバイス');
        for (const line of adviceLines) {
            sections.push(`- ${line}`);
        }
    }

    return sections.join('\n');
};

const buildSafeRankingCopy = (
    item: ClubRanking,
    rank: number,
    keyNeeds: string[],
) => {
    const shaftName = typeof item.shafts?.[0] === 'string'
        ? item.shafts[0]
        : item.shafts?.[0]?.modelName || '診断条件に合うシャフト';
    const needsText = keyNeeds.length > 0 ? keyNeeds.slice(0, 2).join(' / ') : 'ミス傾向と振り心地';

    return {
        ...item,
        rank,
        catchphrase: `${needsText}に合わせやすい ${item.brand} ${item.modelName}`,
        reasoning: `${item.brand} ${item.modelName} は、入力されたヘッドスピードとミス傾向を踏まえて候補化した正式モデルです。シャフトは ${shaftName} を軸に、振りやすさと再現性のバランスを取りやすい組み合わせとして整理しています。`,
        expertOpinion: `${rank}位候補。${needsText} を整えたいゴルファーに合わせやすい現行モデルです。`,
    };
};

const validateClubRanking = (
    item: ClubRanking,
    index: number,
    modelLookup: Map<string, { brand: string; modelName: string }>,
    shaftLookup: Map<string, string>,
): ClubRanking | null => {
    const matchedModel =
        modelLookup.get(normalizeKey(`${item.brand} ${item.modelName}`)) ||
        modelLookup.get(normalizeKey(item.modelName));

    if (!matchedModel) {
        return null;
    }

    const rawShafts = Array.isArray(item.shafts) ? item.shafts : [];
    const normalizedShafts = rawShafts
        .map((shaft) => {
            if (typeof shaft === 'string') {
                return shaftLookup.get(normalizeKey(shaft)) || null;
            }

            const shaftName = shaft?.modelName;
            const matched = shaftLookup.get(normalizeKey(shaftName));
            return matched ? { ...shaft, modelName: matched } : null;
        })
        .filter(Boolean) as Array<string | { modelName?: string; spec?: string }>;

    return {
        ...item,
        rank: index + 1,
        brand: matchedModel.brand,
        modelName: matchedModel.modelName,
        shafts: normalizedShafts,
    };
};

export const buildClubPromptCandidates = (profile: UserProfile) => formatCandidatesForPrompt(profile);

export const validateClubDiagnosisPayload = (profile: UserProfile, payload: ClubDiagnosisPayload) => {
    const { modelLookup } = buildModelLookup(profile);
    const { lookup: shaftLookup } = buildShaftLookup(profile);
    const keyNeeds = dedupeStrings(payload.userSwingDna?.keyNeeds || []);

    const validatedRankings = (payload.rankings || [])
        .map((item, index) => validateClubRanking(item, index, modelLookup, shaftLookup))
        .filter(Boolean)
        .map((item, index) => buildSafeRankingCopy(item as ClubRanking, index + 1, keyNeeds)) as ClubRanking[];

    if (validatedRankings.length === 0) {
        throw new Error('AIが有効な正式モデル名を返せませんでした。');
    }

    return {
        ...payload,
        rankings: validatedRankings,
        aiResponseText: buildValidatedClubNarrative({
            ...payload,
            rankings: validatedRankings,
        }),
    };
};

const buildFallbackSwingType = (profile: UserProfile) => {
    const headSpeed = Number(profile.headSpeed || 0);
    const missText = (profile.missTendencies || []).join(' / ') || '方向性と再現性';

    if (headSpeed >= 50) {
        return {
            type: 'ハイスピード・強弾道タイプ',
            description: `ヘッドスピード ${headSpeed}m/s 前後の強いインパクトを活かしつつ、${missText}を整えるとスコアに直結しやすいタイプです。`,
            keyNeeds: ['低スピンになりすぎない安定感', '左右ブレを抑える再現性', '振り切っても暴れにくい設計'],
        };
    }

    if (headSpeed >= 42) {
        return {
            type: 'バランス重視タイプ',
            description: `ヘッドスピード ${headSpeed}m/s 前後なら、飛距離とやさしさのバランスが合うと結果が安定しやすいタイプです。`,
            keyNeeds: ['つかまりと直進性の両立', 'ミスへの寛容性', '高さを出しやすい設計'],
        };
    }

    return {
        type: 'やさしさ重視タイプ',
        description: `ヘッドスピード ${headSpeed || '未回答'}m/s の条件では、無理にハードなモデルへ寄せるより、上がりやすさとやさしさを優先した方が再現性を作りやすいです。`,
        keyNeeds: ['上がりやすさ', '芯を外したときのやさしさ', '軽快に振れる設計'],
    };
};

const scoreModelForProfile = (profile: UserProfile, brand: string, modelName: string, index: number) => {
    const headSpeed = Number(profile.headSpeed || 0);
    const text = `${brand} ${modelName}`.toLowerCase();
    let score = 82 - index * 3;

    if (headSpeed >= 50) {
        if (/(ls|triple diamond|td|tour|gt3|gt4|lst|zxi7|blueprint t|pro)/.test(text)) score += 9;
        if (/(max fast|max-d|sft)/.test(text)) score -= 6;
    } else if (headSpeed >= 42) {
        if (/(max|x|gt2|t150|t200|i240|i540|zxi5|ai200|ai300)/.test(text)) score += 7;
        if (/(triple diamond|ls|tour|gt4)/.test(text)) score -= 2;
    } else {
        if (/(max fast|max-d|sft|g440|qi|elyte x|t350|hot metal|242cb)/.test(text)) score += 10;
        if (/(triple diamond|ls|tour|gt4|blueprint t|z forged)/.test(text)) score -= 8;
    }

    return Math.max(70, Math.min(97, score));
};

export const buildFallbackClubDiagnosis = (profile: UserProfile) => {
    const { modelsByBrand } = buildModelLookup(profile);
    const { shafts } = buildShaftLookup(profile);
    const swingDna = buildFallbackSwingType(profile);

    const candidates = Array.from(modelsByBrand.entries()).flatMap(([brand, models]) =>
        models.map((modelName, index) => ({
            brand,
            modelName,
            score: scoreModelForProfile(profile, brand, modelName, index),
        })),
    );

    const rankings = candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item, index) =>
            buildSafeRankingCopy(
                {
                    rank: index + 1,
                    brand: item.brand,
                    modelName: item.modelName,
                    matchPercentage: item.score,
                    loft: profile.targetCategory === TargetCategory.DRIVER ? '10.5' : undefined,
                    shafts: shafts.slice(0, 2),
                },
                index + 1,
                swingDna.keyNeeds,
            ),
        );

    if (rankings.length === 0) {
        throw new Error('診断候補データを用意できませんでした。');
    }

    return {
        aiResponseText: buildValidatedClubNarrative({
            userSwingDna: swingDna,
            currentGearAnalysis: {
                matchPercentage: 74,
                pros: '現在の入力条件から大きく外れた危険な組み合わせではありません。',
                cons: 'AI応答が不安定だったため、候補リストベースの安全な提案へ切り替えています。',
                typeDescription: swingDna.type,
            },
            rankings,
            advice: 'まずは1位候補から比較し、打感や高さの好みを確認しながら絞るのがおすすめです。',
        }),
        userSwingDna: swingDna,
        currentGearAnalysis: {
            matchPercentage: 74,
            pros: '現在の入力条件に対して大きなミスマッチは見えていません。',
            cons: '一部条件が未入力、またはAI応答が不安定だったため、安全側の候補を優先しています。',
            typeDescription: swingDna.type,
        },
        rankings,
        advice: 'まずは1位候補を軸に比較し、必要ならボール診断やカテゴリ別診断で絞り込むと精度が上がります。',
    };
};

const getAllowedBallModels = () => {
    const allowed = BALL_DB.filter((ball) => ball.releaseYear >= 2024);
    const lookup = new Map<string, { brand: string; modelName: string }>();

    for (const ball of allowed) {
        lookup.set(normalizeKey(`${ball.brand} ${ball.modelName}`), { brand: ball.brand, modelName: ball.modelName });
        lookup.set(normalizeKey(ball.modelName), { brand: ball.brand, modelName: ball.modelName });
    }

    return { allowed, lookup };
};

export const buildBallPromptCandidates = () => {
    const { allowed } = getAllowedBallModels();
    const lines = allowed.map((ball) => `- ${ball.brand}: ${ball.modelName}`).join('\n');

    return `### 【この診断で使ってよいボール候補】
${lines}

#### 厳守ルール
- 上の候補にないボール名は絶対に出力しない
- 旧モデル名・仮称・俗称を作らない
- recommendedBall.name と alternatives[].name には上の正式名称をそのまま使う`;
};

export const validateBallDiagnosisPayload = (payload: BallDiagnosisPayload) => {
    const { lookup } = getAllowedBallModels();
    const recommended = payload.recommendedBall;
    const matchedRecommended = recommended
        ? lookup.get(normalizeKey(`${recommended.brand} ${recommended.name}`)) || lookup.get(normalizeKey(recommended.name))
        : null;

    if (!matchedRecommended) {
        throw new Error('AIが有効なボール名を返せませんでした。');
    }

    const alternatives = (payload.alternatives || [])
        .map((item) => {
            const matched =
                lookup.get(normalizeKey(`${item.brand} ${item.name}`)) ||
                lookup.get(normalizeKey(item.name));
            return matched ? { ...item, brand: matched.brand, name: matched.modelName } : null;
        })
        .filter(Boolean);

    return {
        ...payload,
        recommendedBall: {
            ...recommended,
            brand: matchedRecommended.brand,
            name: matchedRecommended.modelName,
        },
        alternatives,
    };
};

export const buildFallbackBallDiagnosis = () => {
    const { allowed } = getAllowedBallModels();
    const recommended = allowed.find((ball) => ball.brand === 'Titleist' && ball.modelName === 'Pro V1') || allowed[0];
    const alternatives = allowed
        .filter((ball) => ball.modelName !== recommended.modelName)
        .slice(0, 2)
        .map((ball, index) => ({
            type: index === 0 ? 'SOFT' : 'FIRM',
            name: ball.modelName,
            brand: ball.brand,
            reason: 'AI応答が不安定だったため、現行ボール候補から安全な代替案として提示しています。',
        }));

    return {
        recommendedBall: {
            name: recommended.modelName,
            brand: recommended.brand,
            matchScore: 90,
            catchphrase: 'まず比較の起点にしやすい現行ボール',
            description: 'AI応答が不安定だったため、現行ラインナップから汎用性の高い候補を安全に提示しています。',
            radarChart: {
                飛距離: 8,
                スピン: 8,
                打感: 7,
                直進性: 8,
                コストパフォーマンス: 6,
            },
            expertOpinion: 'まずはこのボールを基準に、打感とスピン量の好みを確認する進め方が安全です。',
        },
        alternatives,
        gearSynergyAdvice: 'まずは現在のクラブとのつながりが自然な現行ボールから比較するのがおすすめです。',
    };
};

export const getAllCurrentClubModels = () => {
    const models = new Set<string>();
    for (const brand of getAllBrands()) {
        for (const model of getAllModels(brand)) {
            models.add(`${brand} ${model}`);
        }
    }
    return Array.from(models).sort();
};
