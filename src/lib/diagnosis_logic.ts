import type { UserProfile, ClubPhysics } from "../types/golf";
import { TargetCategory, MissType, DiagnosisMode, ShaftFeelPreference, SwingTempo } from "../types/golf";
import { CLUB_SPECS } from "./specs_db";

export interface DiagnosisResult {
    result: any;
    groundingMetadata: null;
}

import { calculateBallFits, analyzeCurrentBall } from "./ball_logic";
import { calculateWedgeFits, type WedgeProfile } from "./wedge_logic";
import { calculatePutterFits, estimateStrokeType, type PutterProfile } from "./putter_logic";
import { getTrajectoryRecommendation, analyzeTrajectory } from "./trajectory_logic";

export const generatePhysicsBasedDiagnosis = (profile: UserProfile): any => {
    console.log('[DEBUG] Diagnosis started. Category:', profile.targetCategory);

    // Normalize Category check
    const isBall = profile.targetCategory === TargetCategory.BALL;
    const isPutter = profile.targetCategory === TargetCategory.PUTTER;
    // ボールとパターの場合はシャフト診断は適用しない
    const isShaftOnly = !isBall && !isPutter && profile.diagnosisMode === DiagnosisMode.SHAFT_ONLY;

    console.log('[DEBUG] isBall check:', {
        targetCategory: profile.targetCategory,
        expectedBallValue: TargetCategory.BALL,
        isBall,
        isPutter,
        isShaftOnly,
        diagnosisMode: profile.diagnosisMode
    });

    // 2. ウェッジ診断の場合
    if ((profile.targetCategory as any) === TargetCategory.WEDGE) {
        // 1. プロファイル変換 (UserProfile -> WedgeProfile)
        const divotMap: Record<string, 'shallow' | 'normal' | 'deep'> = {
            'LOW': 'shallow',
            'MID': 'normal',
            'HIGH': 'deep',
            'UNKNOWN': 'normal'
        };

        // ハンディキャップ推定
        let handicap: 'scratch' | 'single' | 'mid' | 'high' | 'beginner' = 'mid';
        if (profile.skillLevel?.includes('初心者')) handicap = 'beginner';
        else if (profile.skillLevel?.includes('中級者')) handicap = 'mid';
        else if (profile.skillLevel?.includes('上級者')) handicap = 'single';
        else if (profile.skillLevel?.includes('シングル') || profile.skillLevel?.includes('プロ')) handicap = 'scratch';

        const wedgeProfile: WedgeProfile = {
            diagnosisMode: profile.wedgeDiagnosisMode || 'REPLACE',
            targetLoft: profile.targetWedgeLoft ? parseInt(profile.targetWedgeLoft.replace('°', '')) : undefined,
            pwLoft: profile.wedgePwLoft ? parseInt(profile.wedgePwLoft.replace(/[^\d]/g, '')) : null,
            highestLoft: 58, // デフォルト
            divotDepth: profile.divotDepth || divotMap[profile.wedgeBounce || 'MID'] || 'normal',
            fairwayCondition: profile.fairwayCondition ? profile.fairwayCondition.toLowerCase() as any : 'normal',
            bunkerCondition: profile.bunkerCondition ? profile.bunkerCondition.toLowerCase() as any : 'normal',
            bunkerSkill: profile.bunkerSkill === 'CONFIDENT' ? 'confident' :
                profile.bunkerSkill === 'NOT_CONFIDENT' ? 'not_confident' : 'normal',
            shotType: profile.wedgeShotType === 'OPEN_FACE' ? 'open_face' :
                profile.wedgeShotType === 'VARIOUS' ? 'various' : 'square',
            handicap: handicap,
            ironShaftType: (profile.ironShaftType as any) === 'CARBON' ? 'carbon' : 'steel',
            wedgeUsage: profile.wedgeUsage,
            freeComments: profile.freeComments // Pass to Wedge Logic
        };

        const recommendations = calculateWedgeFits(profile, wedgeProfile);
        const top3 = recommendations.slice(0, 3);
        const trajectoryRec = getTrajectoryRecommendation(TargetCategory.WEDGE, profile.headSpeed || 40);

        return {
            category: TargetCategory.WEDGE,
            userSwingDna: {
                type: 'ウェッジスペシャリスト診断',
                description: `あなたの入射角タイプ(${wedgeProfile.divotDepth})とバンカースキル(${wedgeProfile.bunkerSkill})に基づき、最適なソール形状を選定しました。`,
                keyNeeds: ['スピン性能', '抜けの良さ', '距離感']
            },
            currentGearAnalysis: {
                matchPercentage: 0,
                typeDescription: '現在使用中のウェッジ構成',
                pros: 'PWからのロフトフローを最適化',
                cons: 'バウンス角の不一致によるミスを軽減'
            },
            idealTrajectory: {
                recommendation: 'MID',
                tips: trajectoryRec.tips,
                analysis: null,
                details: trajectoryRec.details
            },
            rankings: top3.map((item, index) => ({
                rank: index + 1,
                modelName: item.modelName,
                brand: item.brand,
                shafts: [item.shaftRecommendation],
                matchPercentage: item.score,
                catchphrase: item.grindDescription,
                reasoning: item.reasoning.join('。'),
                technicalFit: `バウンス${item.bounce}° / ${item.grind}グラインド`,
                priceEstimate: item.priceEstimate,
                radarChart: {
                    axis1: 9, // スピン
                    axis2: 8, // 操作性
                    axis3: 8, // 抜け
                    axis4: 7, // 打感
                    axis5: 9  // バンカー
                }
            })),
            closingMessage: "コース状況や打ち方に合わせた最適なウェッジセッティングです。",
            summary: {
                title: "WEDGE SELECTOR",
                items: []
            }
        };
    }

    // 0. シャフト単体診断
    if (isShaftOnly) {
        // ... (existing shaft logic) ...
        const recommendedShafts = recommendShafts(profile);
        return {
            type: 'SHAFT', // Explicit Type
            category: 'SHAFT',
            userSwingDna: {
                type: determineSwingType(profile),
                description: generateSwingDescription(profile),
                keyNeeds: determineKeyNeeds(profile)
            },
            currentGearAnalysis: {
                matchPercentage: 40,
                typeDescription: `現在: ${profile.currentShaftModel || '不明'} (${profile.currentShaftWeight || '不明'}/${profile.currentShaftFlex || '不明'})`,
                pros: "慣れている振り心地",
                cons: "スイングタイプに対して特性が合っていない可能性"
            },
            rankings: recommendedShafts.map((shaft, index) => ({
                rank: index + 1,
                modelName: shaft.modelName,
                brand: shaft.brand,
                shafts: [], // It IS a shaft
                matchPercentage: shaft.score,
                catchphrase: shaft.catchphrase,
                reasoning: shaft.reasoning,
                technicalFit: `調子: ${shaft.kickPoint} / 重量: ${shaft.weight}g / トルク: ${shaft.torque}`,
                priceEstimate: "¥44,000〜",
                radarChart: {
                    axis1: shaft.specs.stability,  // 安定性
                    axis2: shaft.specs.feel,       // 振り心地
                    axis3: shaft.specs.control,    // 操作性
                    axis4: shaft.specs.distance,   // 飛距離
                    axis5: shaft.specs.spin        // スピン適正
                }
            })),
            closingMessage: "現在のヘッド性能を活かしつつ、シャフトを変更することで劇的な改善が見込めます。",
            summary: {
                title: "SHAFT SELECTION (シャフト選びの鍵)",
                items: recommendedShafts.slice(0, 3).map(s => ({
                    model: s.modelName,
                    description: `【${s.catchphrase}】${s.reasoning.split('。')[0]}を重視。`
                }))
            }
        };
    }

    // 1. ボール診断の場合
    if (isBall) {
        console.log('[DEBUG] Entering Ball Diagnosis Logic');
        const ballResults = calculateBallFits(
            profile,
            profile.shotData || null,
            profile.ballPreferences || { preferredFeel: 'SOFT', priority: 'BALANCE', preferredBrands: profile.preferredBrands } as any
        );

        return {
            type: 'BALL',
            category: TargetCategory.BALL,
            userSwingDna: {
                type: determineSwingType(profile),
                description: `ヘッドスピード${profile.headSpeed}m/s、${profile.missTendencies.join('、')}の傾向。詳細データに基づくスピン最適化と、打感の好みを反映しました。`,
                keyNeeds: determineKeyNeeds(profile)
            },
            currentGearAnalysis: analyzeCurrentBall(
                profile,
                profile.shotData || null,
                profile.ballPreferences || { preferredFeel: 'SOFT', priority: 'BALANCE' }
            ),
            rankings: ballResults.map(res => ({
                rank: res.rank,
                modelName: res.ball.modelName,
                brand: res.ball.brand,
                shafts: [], // ボールなのでなし
                matchPercentage: Math.min(99, Math.floor(res.score)),
                catchphrase: res.ball.catchphrase,
                reasoning: res.matchReasons.join('。\n'),
                technicalFit: `D-Spin: ${res.ball.dSpinIndex} | W-Spin: ${res.ball.wSpinIndex} | 弾道: ${res.ball.trajectoryIndex}`,
                priceEstimate: `¥${res.ball.priceYen.toLocaleString()} / ダース`,
                // ボール専用情報（物理パラメーター）
                physicsScore: Math.round(res.physicsScore),
                dSpinIndex: res.ball.dSpinIndex,
                wSpinIndex: res.ball.wSpinIndex,
                trajectoryIndex: res.ball.trajectoryIndex,
                compression: res.ball.compression,
                structure: res.ball.structure,
                coverMaterial: res.ball.coverMaterial,
                // 見た目・使用情報
                availableColors: res.ball.availableColors,
                hasAlignmentLine: res.ball.hasAlignmentLine,
                alignmentLineType: res.ball.alignmentLineType,
                usedByPros: res.ball.usedByPros,
                colorLineOptions: res.ball.colorLineOptions,
                radarChart: {
                    axis1: Math.min(10, Math.round(res.ball.compression ? res.ball.compression / 10 : 8)), // ボール初速 (推定)
                    axis2: Math.min(10, Math.round(res.ball.trajectoryIndex / 10)),     // 弾道
                    axis3: Math.min(10, Math.round(res.ball.wSpinIndex / 10)),          // スピン量
                    axis4: Math.min(10, Math.round((110 - res.ball.dSpinIndex) / 10)),  // 飛距離
                    axis5: res.ball.coverMaterial === 'URETHANE' ? 9 : 7            // 操作性 (ウレタン=9, その他=7)
                }
            })),
            closingMessage: "あなたのスイングデータと感性にフィットする、最適なボールを選定しました。",
            summary: {
                title: "CHOOSING GUIDE (選び方のポイント)",
                items: ballResults.slice(0, 3).map(res => ({
                    model: res.ball.modelName,
                    description: `【${res.ball.catchphrase}】${res.matchReasons[0] || 'バランスの良い性能'}を重視する方におすすめです。`
                }))
            }
        };
    }



    // 3. パター診断の場合 (Odyssey/Ping式)
    if (isPutter) {
        console.log('[DEBUG] Entering Putter Diagnosis Logic');

        // ストロークタイプの推定（質問から取得、なければ形状から推定）
        const strokeType = profile.measurementData?.strokeType as 'straight' | 'slight_arc' | 'strong_arc' | 'unknown' ||
            estimateStrokeType(
                profile.measurementData?.currentShape as 'blade' | 'mallet' | 'neo_mallet' | 'unknown' || 'unknown',
                profile.measurementData?.shortPuttIssue as 'push' | 'pull' | 'none' || 'none'
            );

        const putterProfile: PutterProfile = {
            strokeType,
            gripStyle: 'conventional',
            distanceIssue: (profile.measurementData?.distanceIssue as 'short' | 'long' | 'none') || 'none',
            shortPuttIssue: (profile.measurementData?.shortPuttIssue as 'push' | 'pull' | 'none') || 'none',
            preferredFeel: (profile.measurementData?.preferredFeel as 'soft' | 'firm') || 'soft',
            currentShape: (profile.measurementData?.currentShape as 'blade' | 'mallet' | 'neo_mallet' | 'unknown') || 'unknown',
            putterLength: parseInt(profile.measurementData?.putterLength || '34'),
            freeComments: profile.freeComments // Pass to Putter Logic
        };

        const putterResults = calculatePutterFits(profile, putterProfile);

        const strokeTypeLabel = strokeType === 'straight' ? 'ストレート軌道' :
            strokeType === 'slight_arc' ? '軽いアーク軌道' :
                strokeType === 'strong_arc' ? '強いアーク軌道' : '推定中';

        return {
            type: 'PUTTER',
            category: TargetCategory.PUTTER,
            userSwingDna: {
                type: `ストローク: ${strokeTypeLabel}`,
                description: `ストロークタイプに最適なヘッド形状とネックタイプを選定`,
                keyNeeds: ['トゥハング適合', '打感', 'アライメント']
            },
            currentGearAnalysis: {
                matchPercentage: 55,
                typeDescription: `現在のパター: ${profile.currentBrand ? `${profile.currentBrand} ${putterProfile.currentShape === 'blade' ? 'ブレード' : putterProfile.currentShape === 'mallet' ? 'マレット' : 'パター'}` : 'パター分析'}`,
                pros: putterProfile.currentShape !== 'unknown' ? `現在の形状: ${putterProfile.currentShape === 'blade' ? 'ブレード' : putterProfile.currentShape === 'mallet' ? 'マレット' : 'ネオマレット'}` : '新しいパターを提案',
                cons: '最適なトゥハングと打感の選定が重要'
            },
            rankings: putterResults.map((putter, index) => ({
                rank: index + 1,
                modelName: putter.modelName,
                brand: putter.brand,
                headShape: putter.headShape,
                neckType: putter.neckType,
                hangAngle: putter.hangAngle,
                shafts: [],
                matchPercentage: putter.score,
                catchphrase: `${putter.headShape} - ${putter.neckType}`,
                reasoning: putter.reasoning.join('。'),
                technicalFit: `形状: ${putter.headShape} / ネック: ${putter.neckType} / ハング角: ${putter.hangAngle}°`,
                priceEstimate: putter.priceEstimate,
                characteristics: putter.characteristics,
                radarChart: {
                    axis1: Math.floor(putter.characteristics.control * 10), // 距離感
                    axis2: Math.floor(putter.characteristics.alignment * 10), // 直進性(近似)
                    axis3: Math.floor(putter.characteristics.forgiveness * 10), // 転がり/寛容性
                    axis4: Math.floor(putter.characteristics.alignment * 10), // アライメント (Swapped)
                    axis5: Math.floor(putter.characteristics.feel * 10) // 打感 (Swapped)
                }
            })),
            closingMessage: `${strokeTypeLabel}に最適な${putterResults.length}種類のパターを選定しました。`,
            summary: {
                title: 'PUTTER FITTING (推奨パター)',
                items: putterResults.map(p => ({
                    model: `${p.brand} ${p.modelName}`,
                    description: `${p.headShape} / ${p.neckType} / 打感: ${p.insertType}`
                }))
            }
        };
    }

    // 4. ドライバー診断の場合 (Head Focused / Full Spec)
    // Fallback prevention: If meant to be Ball but failed check, do NOT run club logic
    if (isBall) {
        console.error('[ERROR] Ball Logic Skipped unexpectedly. Returning empty result.');
        return { error: 'Diagnosis Failed' };
    }

    // ============================================
    // 🆕 多軸評価システム（専門家パネル合意版）
    // ============================================

    // 推定ミート率の計算（将来の飛距離予測機能で使用予定）
    // const estimatedSmashFactor = (() => {
    //     const hs = profile.headSpeed;
    //     let base = Math.max(1.35, 1.50 - (55 - hs) * 0.003);
    //     if (profile.skillLevel?.includes("初心者")) base -= 0.05;
    //     else if (profile.skillLevel?.includes("中級者")) base -= 0.02;
    //     return Math.min(1.52, base);
    // })();

    // スイングテンポに応じた適正重心角レンジ
    const getOptimalCogAngleRange = (): { min: number; max: number } => {
        switch (profile.swingTempo) {
            case SwingTempo.FAST: return { min: 20, max: 24 };
            case SwingTempo.SMOOTH: return { min: 26, max: 33 };
            default: return { min: 23, max: 27 }; // NORMAL
        }
    };
    const optimalCogRange = getOptimalCogAngleRange();

    const targetSpecs = CLUB_SPECS.filter(c => c.category === (profile.targetCategory || TargetCategory.DRIVER));
    console.log('[DEBUG-DRIVER] targetCategory:', profile.targetCategory);
    console.log('[DEBUG-DRIVER] CLUB_SPECS count:', CLUB_SPECS.length);
    console.log('[DEBUG-DRIVER] Filtered targetSpecs count:', targetSpecs.length);

    // スコアリングロジック（多軸評価）
    const scored = targetSpecs.map((club: ClubPhysics) => {
        const reasons: string[] = [];

        // ============ 軸1: ミス改善スコア (0-100) ============
        let missFixScore = 50;
        if (profile.missTendencies.includes(MissType.SLICE)) {
            // スライサー向け: 重心角が適正レンジ内か
            if (club.cog.angle >= optimalCogRange.min && club.cog.angle <= optimalCogRange.max + 5) {
                missFixScore += 30;
                reasons.push(`重心角${club.cog.angle}°がお客様のテンポに最適（返りやすくスライスを抑制）`);
            } else if (club.cog.angle >= 25) {
                missFixScore += 20;
            } else if (club.cog.angle < 22) {
                missFixScore -= 15; // テンポ速い人向けの小さい重心角はスライサーには逆効果
            }
            if (club.characteristics.bias === 'DRAW') {
                missFixScore += 20;
                reasons.push(`ドローバイアス設計でボールを捕まえる`);
            }
        } else if (profile.missTendencies.includes(MissType.HOOK)) {
            if (club.cog.distance >= 40) {
                missFixScore += 20;
                reasons.push(`重心距離${club.cog.distance}mmでヘッド挙動が安定`);
            }
            if (club.cog.angle <= 23) {
                missFixScore += 20;
                reasons.push(`適度な重心角で左へのミスを軽減`);
            }
            if (club.characteristics.bias === 'FADE') {
                missFixScore += 15;
            }
        } else {
            // ミスなし/その他
            missFixScore = 70;
        }
        missFixScore = Math.min(100, Math.max(0, missFixScore));

        // ============ 軸2: 飛距離スコア (0-100) ============
        let distanceScore = 50;
        const hs = profile.headSpeed;
        // estimatedSmashFactor は将来の飛距離予測に使用予定

        if (hs >= 45) {
            // パワーヒッター: 低スピンで飛距離を稼ぐ
            if (club.characteristics.spin === 'LOW') {
                distanceScore += 25;
                reasons.push(`低スピン設計でパワーをロスなく飛距離に変換`);
            }
            if (club.characteristics.launch === 'MID' || club.characteristics.launch === 'LOW') {
                distanceScore += 15;
            }
        } else if (hs <= 38) {
            // ヘッドスピード遅め: 高弾道でキャリーを稼ぐ
            if (club.characteristics.launch === 'HIGH') {
                distanceScore += 25;
                reasons.push(`高弾道設計でキャリーを最大化`);
            }
            if (club.cog.depth >= 40) {
                distanceScore += 15;
                reasons.push(`重心深度${club.cog.depth}mmの深重心で打ち出し角アップ`);
            }
        } else {
            // 中間層
            distanceScore = 65;
            if (club.characteristics.launch === 'MID') distanceScore += 10;
        }
        distanceScore = Math.min(100, Math.max(0, distanceScore));

        // ============ 軸3: 寛容性スコア (0-100) ============
        let forgivenessScore = 50;
        const needsForgiveness = profile.skillLevel?.includes("初心者") ||
            profile.skillLevel?.includes("中級者") ||
            profile.missTendencies.includes(MissType.UNSTABLE);

        if (needsForgiveness) {
            if (club.moi.total && club.moi.total >= 9500) {
                forgivenessScore = 95;
                reasons.push(`MOI ${club.moi.total}g・cm² の超高慣性でミスヒットに強い`);
            } else if (club.moi.total && club.moi.total >= 8500) {
                forgivenessScore = 80;
            } else if (club.moi.total && club.moi.total >= 8000) {
                forgivenessScore = 65;
            }
            forgivenessScore += club.characteristics.forgiveness * 2;
        } else {
            // 上級者は寛容性より操作性
            forgivenessScore = 60;
        }
        forgivenessScore = Math.min(100, Math.max(0, forgivenessScore));

        // ============ 軸4: 操作性スコア (0-100) ============
        let controlScore = 50;
        const wantsControl = profile.skillLevel?.includes("上級者") ||
            profile.skillLevel?.includes("シングル") ||
            profile.skillLevel?.includes("競技");

        if (wantsControl) {
            controlScore += club.characteristics.control * 4;
            if (club.cog.distance <= 38) {
                controlScore += 15;
                reasons.push(`重心距離${club.cog.distance}mmで操作性が高い`);
            }
        } else {
            controlScore = 60; // デフォルト
        }
        controlScore = Math.min(100, Math.max(0, controlScore));

        // ============ Free Comments Analysis (Generic) ============
        if (profile.freeComments) {
            const comments = profile.freeComments.toLowerCase();
            const brand = club.brand.toLowerCase();

            // Brand Boost
            if (comments.includes(brand)) {
                // If user mentions "Callaway" and this club is "Callaway", huge boost.
                // Assuming user wants that brand.
                missFixScore += 20;
                distanceScore += 20;
                forgivenessScore += 20;
                controlScore += 20;
                reasons.push(`コメントで指定されたブランド: ${club.brand}`);
            }

            // Keyword Boosts
            if (comments.includes('飛距離') || comments.includes('飛び') || comments.includes('distance')) {
                distanceScore += 15;
                if (club.characteristics.spin === 'LOW') reasons.push('低スピンで飛距離性能を強化');
            }
            if (comments.includes('安定') || comments.includes('曲がらない') || comments.includes('stable')) {
                missFixScore += 15;
                forgivenessScore += 10;
                if (club.moi.total && club.moi.total > 8000) reasons.push('高MOIで安定性を強化');
            }
            if (comments.includes('やさしい') || comments.includes('簡単') || comments.includes('easy')) {
                forgivenessScore += 20;
                reasons.push('やさしさを重視したセッティング');
            }
            if (comments.includes('操作') || comments.includes('コントロール') || comments.includes('control')) {
                controlScore += 15;
            }
            if (comments.includes('打感') || comments.includes('feel')) {
                // Hard to quantify purely, but maybe boost overall?
                missFixScore += 5;
            }
        }

        missFixScore = Math.min(100, missFixScore);
        distanceScore = Math.min(100, distanceScore);
        forgivenessScore = Math.min(100, forgivenessScore);
        controlScore = Math.min(100, controlScore);

        // ============ 重み付け統合 ============
        // ユーザーのスキルレベルに応じた重み付け
        let weights = { missFix: 0.35, distance: 0.30, forgiveness: 0.25, control: 0.10 };
        if (profile.skillLevel?.includes("初心者")) {
            weights = { missFix: 0.30, distance: 0.20, forgiveness: 0.40, control: 0.10 };
        } else if (profile.skillLevel?.includes("上級者") || profile.skillLevel?.includes("シングル")) {
            weights = { missFix: 0.25, distance: 0.30, forgiveness: 0.15, control: 0.30 };
        }

        const finalScore =
            missFixScore * weights.missFix +
            distanceScore * weights.distance +
            forgivenessScore * weights.forgiveness +
            controlScore * weights.control;

        return {
            club,
            score: Math.round(finalScore),
            matchReason: reasons,
            axes: { missFixScore, distanceScore, forgivenessScore, controlScore }
        };
    });

    const top3 = scored.sort((a, b) => b.score - a.score).slice(0, 3);

    // クラブ別理想軌道情報を取得
    const trajectoryRec = getTrajectoryRecommendation(
        profile.targetCategory || TargetCategory.DRIVER,
        profile.headSpeed
    );

    // 計測データがあれば軌道分析を実行
    // 計測データがあれば軌道分析を実行
    let currentLaunch = 0;
    let currentSpin = 0;
    const md = profile.measurementData || {};

    switch (profile.targetCategory) {
        case TargetCategory.FAIRWAY:
            currentLaunch = parseFloat(md.fwLaunchAngle || '0');
            currentSpin = parseFloat(md.fwSpinRate || '0');
            break;
        case TargetCategory.UTILITY:
            currentSpin = parseFloat(md.utSpinRate || '0');
            // UT Input usually doesn't have launch, keep 0
            break;
        case TargetCategory.IRON:
            currentLaunch = parseFloat(md.ironLaunchAngle || '0');
            currentSpin = parseFloat(md.ironSpinRate || '0');
            break;
        case TargetCategory.WEDGE:
            currentSpin = parseFloat(md.wedgeSpinRate || '0');
            break;
        default: // Driver and others
            currentLaunch = parseFloat(md.launchAngle || '0');
            currentSpin = parseFloat(md.spinRateMeasured || '0');
    }

    // UT/WedgeなどLaunchがない場合は分析をスキップしないように、Spinのみでも簡易判定できるようにするか
    // 現状は trajectory_logic が両方を必須としているため、データ不足時は null とする
    const trajectoryAnalysis = currentLaunch > 0 && currentSpin > 0
        ? analyzeTrajectory(
            profile.targetCategory || TargetCategory.DRIVER,
            currentLaunch,
            currentSpin,
            profile.headSpeed
        )
        : null;

    return {
        type: 'CLUB',
        category: profile.targetCategory || 'CLUB',
        userSwingDna: {
            type: determineSwingType(profile),
            description: generateSwingDescription(profile),
            keyNeeds: determineKeyNeeds(profile)
        },
        currentGearAnalysis: {
            matchPercentage: profile.currentBrand && profile.currentModel ? 65 : 50,
            typeDescription: profile.currentBrand && profile.currentModel
                ? `${profile.targetCategory || 'クラブ'}: ${profile.currentBrand} ${profile.currentModel}`
                : `${profile.targetCategory || 'クラブ'}: 現在のモデル未設定`,
            pros: profile.currentBrand && profile.currentModel
                ? `慣れ親しんだ${profile.currentBrand}を使用中。スイングとの相性を継続評価中。`
                : "新しいクラブ選びをサポートします。",
            cons: "最新モデルと比較すると、寛容性やスピン性能に差がある可能性。"
        },
        // 🆕 クラブ別理想軌道情報
        idealTrajectory: {
            recommendation: trajectoryRec.ideal,
            tips: trajectoryRec.tips,
            details: trajectoryRec.details,
            analysis: trajectoryAnalysis ? {
                launchStatus: trajectoryAnalysis.launchAngleStatus,
                spinStatus: trajectoryAnalysis.spinRateStatus,
                score: trajectoryAnalysis.overallScore,
                suggestions: trajectoryAnalysis.recommendations,
                clubSuggestion: trajectoryAnalysis.clubSuggestion
            } : null
        },
        rankings: top3.map((item, index) => ({
            rank: index + 1,
            modelName: item.club.modelName,
            brand: item.club.brand,
            shafts: selectShafts(profile),
            matchPercentage: Math.min(99, Math.floor(item.score)),
            catchphrase: generateCatchphrase(item.club),
            reasoning: item.matchReason.join('。'),
            technicalFit: `物理スペック: 重心角${item.club.cog.angle}° / 重心深度${item.club.cog.depth}mm`,
            priceEstimate: "¥80,000前後",
            radarChart: generateRadarChart(item.club)
        })),
        closingMessage: "物理スペックデータに基づき、あなたのスイング特性に最適なモデルを選定しました。",
        summary: {
            title: "CHOOSING GUIDE (選び方のポイント)",
            items: top3.map(item => ({
                model: item.club.modelName,
                description: `【${generateCatchphrase(item.club)}】${item.matchReason[0] || 'バランスの良い性能'}を重視したい場合に最適です。`
            }))
        }
    };
};

// ヘルパー関数群
const determineSwingType = (p: UserProfile) => {
    if (p.headSpeed >= 45) return "パワーヒッター型";
    if (p.missTendencies.includes(MissType.SLICE)) return "スライス改善型";
    return "テクニカル重視型";
};

const generateSwingDescription = (p: UserProfile) => {
    return `ヘッドスピード${p.headSpeed}m/sで、${p.missTendencies.join('、')}の傾向が見られます。物理的には、重心角やMOIを最適化することで飛距離と安定性が向上します。`;
};

const determineKeyNeeds = (p: UserProfile) => {
    const needs = ["飛距離アップ"];
    if (p.missTendencies.includes(MissType.SLICE)) needs.push("スライス防止");
    if (p.missTendencies.includes(MissType.UNSTABLE)) needs.push("寛容性");
    return needs;
};

// シャフトデータベース（簡易版）
const SHAFT_DB = [
    { modelName: "Ventus Blue", brand: "Fujikura", weight: "50/60/70", kickPoint: "中元調子", torque: "3.1~", type: "STABILITY", catchphrase: "PGAツアー使用率No.1の安定感", specs: { stability: 10, feel: 8, control: 9, distance: 8, spin: 7 } },
    { modelName: "Ventus Red", brand: "Fujikura", weight: "50/60/70", kickPoint: "先中調子", torque: "3.5~", type: "SPEED_DRAW", catchphrase: "走りすぎない、叩ける先中調子", specs: { stability: 8, feel: 9, control: 7, distance: 9, spin: 8 } },
    { modelName: "Ventus Black", brand: "Fujikura", weight: "60/70", kickPoint: "元調子", torque: "2.9~", type: "HARD_HITTER", catchphrase: "低スピン・低弾道の極み", specs: { stability: 9, feel: 7, control: 9, distance: 9, spin: 10 } },
    { modelName: "Tour AD VF", brand: "Graphite Design", weight: "50/60/70", kickPoint: "中元調子", torque: "3.0~", type: "LOW_SPIN", catchphrase: "強く叩いても吹き上がらない", specs: { stability: 9, feel: 8, control: 8, distance: 10, spin: 9 } },
    { modelName: "Tour AD CQ", brand: "Graphite Design", weight: "40/50/60", kickPoint: "先中調子", torque: "4.5~", type: "CAPTURE", catchphrase: "鞭のようなしなりで捕まえる", specs: { stability: 6, feel: 10, control: 7, distance: 9, spin: 6 } },
    { modelName: "Speeder NX Green", brand: "Fujikura", weight: "40/50/60", kickPoint: "中調子", torque: "4.9~", type: "BALANCE", catchphrase: "逆輸入的進化を果たしたNX", specs: { stability: 9, feel: 9, control: 8, distance: 9, spin: 8 } },
    { modelName: "Speeder NX Black", brand: "Fujikura", weight: "40/50/60", kickPoint: "先中調子", torque: "4.9~", type: "CATCH_HIGH", catchphrase: "新しい「先中」のスタンダード", specs: { stability: 7, feel: 9, control: 8, distance: 9, spin: 5 } },
    { modelName: "Diamana GT", brand: "Mitsubishi", weight: "40/50/60", kickPoint: "中元調子", torque: "3.8~", type: "VERSATILE", catchphrase: "どんなヘッドとも合う万能性", specs: { stability: 9, feel: 8, control: 9, distance: 8, spin: 9 } },
    { modelName: "TENSEI 1K Pro Orange", brand: "Mitsubishi", weight: "50/60/70", kickPoint: "元調子", torque: "3.0~", type: "COUNTER_BALANCE", catchphrase: "振り抜き抜群のカウンターバランス", specs: { stability: 9, feel: 7, control: 10, distance: 8, spin: 9 } }
];

const IRON_SHAFT_DB = [
    // スチール
    { modelName: "Dynamic Gold", brand: "True Temper", weight: "129g (S200)", kickPoint: "元調子", torque: "1.2~", type: "HARD_HITTER", catchphrase: "世界標準のツアー・イシュー", specs: { stability: 10, feel: 8, control: 9, distance: 7, spin: 9 } },
    { modelName: "Dynamic Gold 120", brand: "True Temper", weight: "118g (S200)", kickPoint: "元調子", torque: "1.5~", type: "HARD_HITTER", catchphrase: "DGの粘りを軽量化", specs: { stability: 9, feel: 8, control: 9, distance: 7, spin: 9 } },
    { modelName: "Dynamic Gold 105", brand: "True Temper", weight: "103g (S200)", kickPoint: "元調子", torque: "1.8~", type: "VERSATILE", catchphrase: "軽量かつ粘る、新定番", specs: { stability: 8, feel: 9, control: 8, distance: 8, spin: 8 } },
    { modelName: "Dynamic Gold 95", brand: "True Temper", weight: "95g (S200)", kickPoint: "中元調子", torque: "2.0~", type: "CAPTURE", catchphrase: "最軽量DG、高弾道", specs: { stability: 7, feel: 9, control: 7, distance: 9, spin: 8 } },
    { modelName: "N.S.PRO 950GH neo", brand: "Nippon Shaft", weight: "98g (S)", kickPoint: "中調子", torque: "1.9~", type: "BALANCE", catchphrase: "現代アイアンにマッチする高弾道", specs: { stability: 8, feel: 9, control: 8, distance: 9, spin: 8 } },
    { modelName: "N.S.PRO MODUS3 Tour 105", brand: "Nippon Shaft", weight: "106.5g (S)", kickPoint: "元調子", torque: "1.7~", type: "SPEED_DRAW", catchphrase: "軽硬の代名詞、直進性抜群", specs: { stability: 9, feel: 8, control: 8, distance: 9, spin: 7 } },
    { modelName: "N.S.PRO MODUS3 Tour 115", brand: "Nippon Shaft", weight: "118.5g (S)", kickPoint: "元調子", torque: "1.6~", type: "VERSATILE", catchphrase: "操作性と直進性のバランス", specs: { stability: 9, feel: 9, control: 9, distance: 8, spin: 8 } },
    { modelName: "N.S.PRO MODUS3 Tour 120", brand: "Nippon Shaft", weight: "114g (S)", kickPoint: "中元調子", torque: "1.7~", type: "CATCH_HIGH", catchphrase: "低めの剛性で粘り系", specs: { stability: 8, feel: 10, control: 9, distance: 7, spin: 9 } },
    { modelName: "Project X LZ", brand: "Project X", weight: "115g (5.5)", kickPoint: "中調子", type: "STABILITY", torque: "1.6~", catchphrase: "Loading Zoneでエネルギー伝達", specs: { stability: 9, feel: 8, control: 8, distance: 9, spin: 8 } },
    { modelName: "KBS Tour", brand: "KBS", weight: "120g (S)", kickPoint: "中調子", torque: "1.5~", type: "VERSATILE", catchphrase: "スムーズな剛性分布", specs: { stability: 8, feel: 9, control: 8, distance: 8, spin: 8 } },
    // カーボン
    { modelName: "MCI 80", brand: "Fujikura", weight: "84g (S)", kickPoint: "中調子", torque: "2.7~", type: "BALANCE", catchphrase: "メタルコンポジットの先駆け", specs: { stability: 8, feel: 9, control: 8, distance: 8, spin: 8 } },
    { modelName: "TRAVIL 85", brand: "Fujikura", weight: "89g (S)", kickPoint: "中元調子", torque: "2.5~", type: "STABILITY", catchphrase: "落下角を制御する", specs: { stability: 9, feel: 8, control: 9, distance: 8, spin: 9 } },
    { modelName: "Tour AD AD-85", brand: "Graphite Design", weight: "88g (S)", kickPoint: "中調子", torque: "2.6~", type: "VERSATILE", catchphrase: "クセのないスタンダード", specs: { stability: 8, feel: 8, control: 8, distance: 8, spin: 8 } }
];

const recommendShafts = (p: UserProfile) => {
    // 1. 基本フィルタリング
    // IRONの場合はIRON_SHAFT_DBのみ、それ以外（ドライバー、FW、UT）はSHAFT_DBを使用
    // UTは本来専用シャフトがあるべきだが、簡易的にSHAFT_DB（ウッド用）またはIRON_SHAFT_DB（アイアン型）を使い分けるのが理想
    // ここではシンプルにカテゴリで分ける
    let candidates = (p.targetCategory as any) === TargetCategory.IRON ? IRON_SHAFT_DB : SHAFT_DB;

    // アイアンシャフトの素材フィルタリング
    if ((p.targetCategory as any) === TargetCategory.IRON) {
        if (p.ironShaftType === 'STEEL') {
            candidates = IRON_SHAFT_DB.filter(s => !s.modelName.includes('MCI') && !s.modelName.includes('TRAVIL') && !s.modelName.includes('Tour AD'));
        } else if (p.ironShaftType === 'CARBON') {
            candidates = IRON_SHAFT_DB.filter(s => s.modelName.includes('MCI') || s.modelName.includes('TRAVIL') || s.modelName.includes('Tour AD'));
        }
    }

    const scores = candidates.map(shaft => {
        let score = 50;
        const reasons: string[] = [];

        // HSによる重さ/硬さ推奨（簡易）
        // ... (詳細なロジックは省略し、タイプマッチングに特化) ... 

        // 2. ミス傾向と特性のマッチング
        if (p.missTendencies.includes(MissType.SLICE)) {
            if (['SPEED_DRAW', 'CAPTURE', 'CATCH_HIGH'].includes(shaft.type)) {
                score += 25;
                reasons.push("つかまりの良い特性でスライスを軽減");
            } else if (shaft.type === 'HARD_HITTER') {
                score -= 15;
            }
        } else if (p.missTendencies.includes(MissType.HOOK)) {
            if (['STABILITY', 'HARD_HITTER', 'LOW_SPIN'].includes(shaft.type)) {
                score += 25;
                reasons.push("先端剛性が高く、引っかけを抑制");
            }
        }

        // 3. フィーリング (ShaftFeel)
        if (p.shaftFeelPreference === ShaftFeelPreference.KICK_TIP) {
            if (['SPEED_DRAW', 'CAPTURE'].includes(shaft.type)) { score += 15; reasons.push("好みの走り感・弾き感があります"); }
        } else if (p.shaftFeelPreference === ShaftFeelPreference.KICK_HAND) {
            if (['STABILITY', 'VERSATILE', 'COUNTER_BALANCE'].includes(shaft.type)) { score += 15; reasons.push("手元調子系でタイミングが取りやすい"); }
        }

        // 4. HSマッチング
        if (p.headSpeed >= 45) {
            if (['HARD_HITTER', 'LOW_SPIN', 'STABILITY'].includes(shaft.type)) score += 15;
        } else if (p.headSpeed <= 38) {
            if (['CAPTURE', 'SPEED_DRAW'].includes(shaft.type)) score += 15;
        }

        // 5. ブランド好み (Preferred Brands)
        if (p.preferredShaftBrands && p.preferredShaftBrands.length > 0) {
            const isPreferred = p.preferredShaftBrands.some(pref =>
                shaft.brand.toLowerCase().includes(pref.toLowerCase()) ||
                pref.toLowerCase().includes(shaft.brand.toLowerCase())
            );
            if (isPreferred) {
                score += 15;
                reasons.push(`好みのブランド(${shaft.brand})を優先`);
            }
        }

        // Add slight randomization to prevent identical ordering every time for same inputs
        score += Math.random() * 2;

        return { ...shaft, score, reasoning: reasons.join('。') || "バランスが良く扱いやすいモデルです" };
    });

    return scores.sort((a, b) => b.score - a.score).slice(0, 3);
};

const selectShafts = (p: UserProfile) => {
    // If diagnosis mode is HEAD_ONLY, return empty array
    if (p.diagnosisMode === DiagnosisMode.HEAD_ONLY) return [];

    // 既存のselectShaftsをrecommendShaftsロジックを使ってアップデート
    const recommended = recommendShafts(p);

    // アイアンスペックのリターン形式調整 (7番アイアン基準など)
    if ((p.targetCategory as any) === TargetCategory.IRON) {
        return recommended.map(s => `${s.modelName} (7i想定)`);
    }

    return recommended.map(s => {
        // スペック推定
        let spec = '5S';
        if (p.headSpeed >= 48) spec = '6X/7S';
        else if (p.headSpeed >= 45) spec = '6S';
        else if (p.headSpeed >= 42) spec = '5S/5X';
        else if (p.headSpeed >= 38) spec = '5R/5SR';
        else spec = '40R/40SR';

        return `${s.modelName} ${spec}`;
    });
};

const generateCatchphrase = (club: ClubPhysics) => {
    if (club.moi.total && club.moi.total > 9000) return "ミスを恐れず振れる、圧倒的直進性";
    if (club.characteristics.bias === 'DRAW') return "つかまりの良さで、スライスと決別";
    return "操作性と寛容性のパーフェクトバランス";
};

const generateRadarChart = (club: ClubPhysics) => {
    return {
        axis1: club.characteristics.launch === 'HIGH' ? 9 : 7, // 飛距離
        axis2: club.characteristics.forgiveness || 8, // 寛容性
        axis3: club.characteristics.control || 7, // 操作性
        axis4: 8, // 打感
        axis5: 9  // 安定性
    };
};
