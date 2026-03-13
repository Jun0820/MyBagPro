import { TargetCategory, type ClubPhysics } from "../types/golf";

// 物理スペックデータベース
// データソース: 各社公開情報および一般的に知られている測定値に基づく推定値（デモ用）

export const CLUB_SPECS: ClubPhysics[] = [
    // === TaylorMade ===
    {
        id: "TM_QI10_MAX_2024",
        modelName: "Qi10 MAX",
        brand: "TaylorMade",
        releaseYear: 2024,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 58, faceAngle: -1.0 },
        cog: { distance: 41.0, depth: 44.0, angle: 26.0 }, // 重心角大＝つかまり良
        moi: { total: 10000 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'LOW', forgiveness: 10, control: 6 }
    },
    {
        id: "TM_QI10_2024",
        modelName: "Qi10",
        brand: "TaylorMade",
        releaseYear: 2024,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 56, faceAngle: -0.5 },
        cog: { distance: 39.5, depth: 40.0, angle: 23.0 },
        moi: { total: 8500 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 8, control: 8 }
    },
    {
        id: "TM_STEALTH2_HD_2023",
        modelName: "Stealth 2 HD",
        brand: "TaylorMade",
        releaseYear: 2023,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 58, faceAngle: -2.0 },
        cog: { distance: 43.0, depth: 42.0, angle: 28.0 }, // ドローバイアス
        moi: { total: 8800 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 9, control: 5 }
    },
    {
        id: "TM_SIM2_MAX_2021",
        modelName: "SIM2 MAX",
        brand: "TaylorMade",
        releaseYear: 2021,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 56, faceAngle: -0.5 },
        cog: { distance: 38.5, depth: 40.5, angle: 22.5 },
        moi: { total: 8300 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 7, control: 7 }
    },

    // === Callaway ===
    {
        id: "CW_AI_SMOKE_MAX_2024",
        modelName: "Paradym Ai Smoke MAX",
        brand: "Callaway",
        releaseYear: 2024,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 57, faceAngle: -1.0 },
        cog: { distance: 39.0, depth: 39.0, angle: 24.0 },
        moi: { total: 9200 }, // 推定
        characteristics: { bias: 'DRAW', launch: 'MID', spin: 'LOW', forgiveness: 9, control: 7 }
    },
    {
        id: "CW_PARADYM_X_2023",
        modelName: "Paradym X",
        brand: "Callaway",
        releaseYear: 2023,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 58, faceAngle: -1.5 },
        cog: { distance: 40.5, depth: 41.0, angle: 26.5 },
        moi: { total: 8800 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 9, control: 5 }
    },

    // === PING ===
    {
        id: "PING_G430_MAX_10K_2024",
        modelName: "G430 MAX 10K",
        brand: "Ping",
        releaseYear: 2024,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 58, faceAngle: 0.0 },
        cog: { distance: 44.0, depth: 46.0, angle: 27.0 }, // かなり深い・高MOI
        moi: { total: 10000 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'LOW', forgiveness: 10, control: 6 }
    },
    {
        id: "PING_G430_SFT_2022",
        modelName: "G430 SFT",
        brand: "Ping",
        releaseYear: 2022,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 58, faceAngle: -2.0 },
        cog: { distance: 45.0, depth: 43.0, angle: 33.0 }, // 最大級の重心角
        moi: { total: 9500 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 9, control: 4 }
    },
    {
        id: "PING_G430_LST_2022",
        modelName: "G430 LST",
        brand: "Ping",
        releaseYear: 2022,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 57, faceAngle: 0.5 }, // ややオープン
        cog: { distance: 38.0, depth: 38.0, angle: 21.0 },
        moi: { total: 8800 },
        characteristics: { bias: 'FADE', launch: 'LOW', spin: 'LOW', forgiveness: 7, control: 9 }
    },

    // === Titleist ===
    {
        id: "TL_TSR2_2022",
        modelName: "TSR2",
        brand: "Titleist",
        releaseYear: 2022,
        category: TargetCategory.DRIVER,
        head: { loft: 10.0, lie: 58.5, faceAngle: 0.0 },
        cog: { distance: 36.5, depth: 40.0, angle: 24.0 }, // バランス型
        moi: { total: 8600 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 8, control: 8 }
    },
    {
        id: "TL_TSR3_2022",
        modelName: "TSR3",
        brand: "Titleist",
        releaseYear: 2022,
        category: TargetCategory.DRIVER,
        head: { loft: 10.0, lie: 58.5, faceAngle: 0.5 },
        cog: { distance: 35.0, depth: 37.0, angle: 20.0 }, // 操作性重視
        moi: { total: 8200 },
        characteristics: { bias: 'FADE', launch: 'MID', spin: 'LOW', forgiveness: 6, control: 10 }
    },

    // === XXIO ===
    {
        id: "XXIO_13_2023",
        modelName: "XXIO 13",
        brand: "XXIO",
        releaseYear: 2023,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 59, faceAngle: -1.5 },
        cog: { distance: 41.5, depth: 42.0, angle: 28.5 }, // オートマチックドロー
        moi: { total: 8000 }, // 軽量ヘッドのためMOIはそこまで大きくない場合があるが慣性効率は高い
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 9, control: 5 }
    },
    {
        id: "XXIO_X_EKS_2023",
        modelName: "XXIO X -eks-",
        brand: "XXIO",
        releaseYear: 2023,
        category: TargetCategory.DRIVER,
        head: { loft: 10.5, lie: 59, faceAngle: -0.5 },
        cog: { distance: 38.5, depth: 39.0, angle: 24.5 },
        moi: { total: 8300 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'MID', forgiveness: 9, control: 7 }
    },

    // ============ FAIRWAY WOOD DATA ============
    // === TaylorMade フェアウェイウッド ===
    {
        id: "TM_QI10_FW_2024",
        modelName: "Qi10 FW",
        brand: "TaylorMade",
        releaseYear: 2024,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 57, faceAngle: -0.5 },
        cog: { distance: 36.0, depth: 38.0, angle: 23.0 },
        moi: { total: 4200 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 8, control: 8 }
    },
    {
        id: "TM_QI10_MAX_FW_2024",
        modelName: "Qi10 MAX FW",
        brand: "TaylorMade",
        releaseYear: 2024,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 58, faceAngle: -1.0 },
        cog: { distance: 38.0, depth: 40.0, angle: 26.0 },
        moi: { total: 4800 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 10, control: 6 }
    },
    {
        id: "TM_STEALTH2_FW_2023",
        modelName: "Stealth 2 FW",
        brand: "TaylorMade",
        releaseYear: 2023,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 57, faceAngle: -0.5 },
        cog: { distance: 35.0, depth: 36.0, angle: 22.0 },
        moi: { total: 4000 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 8, control: 8 }
    },

    // === Callaway フェアウェイウッド ===
    {
        id: "CW_PARADYM_AI_SMOKE_FW_2024",
        modelName: "Paradym Ai Smoke FW",
        brand: "Callaway",
        releaseYear: 2024,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 57, faceAngle: -0.5 },
        cog: { distance: 36.5, depth: 37.0, angle: 23.5 },
        moi: { total: 4300 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 9, control: 7 }
    },
    {
        id: "CW_PARADYM_X_FW_2023",
        modelName: "Paradym X FW",
        brand: "Callaway",
        releaseYear: 2023,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 58, faceAngle: -1.5 },
        cog: { distance: 38.0, depth: 39.0, angle: 26.0 },
        moi: { total: 4500 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 9, control: 5 }
    },

    // === Ping フェアウェイウッド ===
    {
        id: "PING_G430_MAX_FW_2022",
        modelName: "G430 MAX FW",
        brand: "Ping",
        releaseYear: 2022,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 58, faceAngle: 0.0 },
        cog: { distance: 39.0, depth: 42.0, angle: 25.0 },
        moi: { total: 4600 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'MID', forgiveness: 10, control: 6 }
    },
    {
        id: "PING_G430_FW_2022",
        modelName: "G430 FW",
        brand: "Ping",
        releaseYear: 2022,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 57, faceAngle: 0.0 },
        cog: { distance: 36.0, depth: 38.0, angle: 22.0 },
        moi: { total: 4100 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 8, control: 8 }
    },

    // === Titleist フェアウェイウッド ===
    {
        id: "TL_GT2_FW_2024",
        modelName: "GT2 FW",
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 57, faceAngle: 0.0 },
        cog: { distance: 34.0, depth: 36.0, angle: 21.0 },
        moi: { total: 3900 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 7, control: 9 }
    },
    {
        id: "TL_TSR2_FW_2022",
        modelName: "TSR2 FW",
        brand: "Titleist",
        releaseYear: 2022,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 57, faceAngle: 0.0 },
        cog: { distance: 35.0, depth: 37.0, angle: 22.0 },
        moi: { total: 4000 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 8, control: 8 }
    },

    // === XXIO フェアウェイウッド ===
    {
        id: "XXIO_13_FW_2023",
        modelName: "XXIO 13 FW",
        brand: "XXIO",
        releaseYear: 2023,
        category: TargetCategory.FAIRWAY,
        head: { loft: 15, lie: 59, faceAngle: -1.5 },
        cog: { distance: 40.0, depth: 41.0, angle: 28.0 },
        moi: { total: 4400 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 10, control: 5 }
    },

    // ============ UTILITY / HYBRID DATA ============
    // === TaylorMade ユーティリティ ===
    {
        id: "TM_QI10_RESCUE_2024",
        modelName: "Qi10 Rescue",
        brand: "TaylorMade",
        releaseYear: 2024,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 59, faceAngle: -0.5 },
        cog: { distance: 34.0, depth: 35.0, angle: 22.0 },
        moi: { total: 3200 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'MID', forgiveness: 8, control: 8 }
    },
    {
        id: "TM_QI10_MAX_RESCUE_2024",
        modelName: "Qi10 MAX Rescue",
        brand: "TaylorMade",
        releaseYear: 2024,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 60, faceAngle: -1.0 },
        cog: { distance: 36.0, depth: 38.0, angle: 25.0 },
        moi: { total: 3600 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 10, control: 6 }
    },
    {
        id: "TM_STEALTH2_RESCUE_2023",
        modelName: "Stealth 2 Rescue",
        brand: "TaylorMade",
        releaseYear: 2023,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 59, faceAngle: -0.5 },
        cog: { distance: 33.0, depth: 34.0, angle: 21.0 },
        moi: { total: 3000 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 8, control: 8 }
    },

    // === Callaway ユーティリティ ===
    {
        id: "CW_PARADYM_AI_SMOKE_HY_2024",
        modelName: "Paradym Ai Smoke Hybrid",
        brand: "Callaway",
        releaseYear: 2024,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 59, faceAngle: -0.5 },
        cog: { distance: 34.5, depth: 35.5, angle: 22.5 },
        moi: { total: 3300 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'MID', forgiveness: 8, control: 7 }
    },
    {
        id: "CW_PARADYM_HY_2023",
        modelName: "Paradym Hybrid",
        brand: "Callaway",
        releaseYear: 2023,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 60, faceAngle: -1.0 },
        cog: { distance: 36.0, depth: 37.0, angle: 25.0 },
        moi: { total: 3400 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 9, control: 6 }
    },

    // === Ping ユーティリティ ===
    {
        id: "PING_G430_HY_2022",
        modelName: "G430 Hybrid",
        brand: "Ping",
        releaseYear: 2022,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 59, faceAngle: 0.0 },
        cog: { distance: 35.0, depth: 38.0, angle: 23.0 },
        moi: { total: 3400 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'MID', forgiveness: 9, control: 7 }
    },
    {
        id: "PING_G430_MAX_HY_2022",
        modelName: "G430 MAX Hybrid",
        brand: "Ping",
        releaseYear: 2022,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 60, faceAngle: -0.5 },
        cog: { distance: 37.0, depth: 40.0, angle: 26.0 },
        moi: { total: 3700 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 10, control: 6 }
    },

    // === XXIO ユーティリティ ===
    {
        id: "XXIO_13_HY_2023",
        modelName: "XXIO 13 Hybrid",
        brand: "XXIO",
        releaseYear: 2023,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 60, faceAngle: -1.5 },
        cog: { distance: 38.0, depth: 39.0, angle: 28.0 },
        moi: { total: 3500 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'MID', forgiveness: 10, control: 5 }
    },

    // === Titleist ユーティリティ ===
    {
        id: "TL_TSR_HY_2022",
        modelName: "TSR Hybrid",
        brand: "Titleist",
        releaseYear: 2022,
        category: TargetCategory.UTILITY,
        head: { loft: 19, lie: 58, faceAngle: 0.0 },
        cog: { distance: 32.0, depth: 34.0, angle: 20.0 },
        moi: { total: 2900 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'LOW', forgiveness: 7, control: 9 }
    },

    // ============ IRON DATA ============
    // === TaylorMade アイアン ===
    {
        id: "TM_QI_IRON_2024",
        modelName: "Qi HL アイアン",
        brand: "TaylorMade",
        releaseYear: 2024,
        category: TargetCategory.IRON,
        head: { loft: 28.5, lie: 62, faceAngle: 0 }, // 7番相当
        cog: { distance: 38.0, depth: 5.0, angle: 0 },
        moi: { total: 3200 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'LOW', forgiveness: 10, control: 5 }
    },
    {
        id: "TM_P770_2023",
        modelName: "P770",
        brand: "TaylorMade",
        releaseYear: 2023,
        category: TargetCategory.IRON,
        head: { loft: 33.0, lie: 62.5, faceAngle: 0 },
        cog: { distance: 35.0, depth: 3.5, angle: 0 },
        moi: { total: 2800 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'MID', forgiveness: 7, control: 8 }
    },
    {
        id: "TM_P790_2024",
        modelName: "P790",
        brand: "TaylorMade",
        releaseYear: 2024,
        category: TargetCategory.IRON,
        head: { loft: 30.5, lie: 62.5, faceAngle: 0 },
        cog: { distance: 36.5, depth: 4.0, angle: 0 },
        moi: { total: 3000 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'LOW', forgiveness: 8, control: 7 }
    },

    // === Titleist アイアン ===
    {
        id: "TL_T350_2023",
        modelName: "T350",
        brand: "Titleist",
        releaseYear: 2023,
        category: TargetCategory.IRON,
        head: { loft: 27.0, lie: 62, faceAngle: 0 },
        cog: { distance: 39.0, depth: 5.5, angle: 0 },
        moi: { total: 3400 },
        characteristics: { bias: 'DRAW', launch: 'HIGH', spin: 'LOW', forgiveness: 10, control: 4 }
    },
    {
        id: "TL_T200_2023",
        modelName: "T200",
        brand: "Titleist",
        releaseYear: 2023,
        category: TargetCategory.IRON,
        head: { loft: 30.0, lie: 62.5, faceAngle: 0 },
        cog: { distance: 36.0, depth: 4.0, angle: 0 },
        moi: { total: 3000 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'MID', forgiveness: 8, control: 7 }
    },
    {
        id: "TL_T100_2023",
        modelName: "T100",
        brand: "Titleist",
        releaseYear: 2023,
        category: TargetCategory.IRON,
        head: { loft: 34.0, lie: 63, faceAngle: 0 },
        cog: { distance: 33.0, depth: 2.5, angle: 0 },
        moi: { total: 2500 },
        characteristics: { bias: 'NEUTRAL', launch: 'LOW', spin: 'HIGH', forgiveness: 5, control: 10 }
    },

    // === Ping アイアン ===
    {
        id: "PING_G430_IRON_2022",
        modelName: "G430 アイアン",
        brand: "Ping",
        releaseYear: 2022,
        category: TargetCategory.IRON,
        head: { loft: 29.5, lie: 62, faceAngle: 0 },
        cog: { distance: 37.0, depth: 4.5, angle: 0 },
        moi: { total: 3100 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'MID', forgiveness: 9, control: 6 }
    },
    {
        id: "PING_I230_2023",
        modelName: "i230",
        brand: "Ping",
        releaseYear: 2023,
        category: TargetCategory.IRON,
        head: { loft: 33.0, lie: 62.5, faceAngle: 0 },
        cog: { distance: 34.5, depth: 3.0, angle: 0 },
        moi: { total: 2700 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'HIGH', forgiveness: 6, control: 9 }
    },

    // ============ WEDGE DATA ============
    // === Titleist Vokey SM10 ===
    {
        id: "VOKEY_SM10_48_10F",
        modelName: "SM10 48° 10F",
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.WEDGE,
        head: { loft: 48, lie: 64, faceAngle: 0, bounce: 10, grind: 'F' },
        cog: { distance: 30.0, depth: 2.0, angle: 0 },
        moi: { total: 2050 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'MID', forgiveness: 5, control: 9 }
    },
    {
        id: "VOKEY_SM10_50_08F",
        modelName: "SM10 50° 08F",
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.WEDGE,
        head: { loft: 50, lie: 64, faceAngle: 0, bounce: 8, grind: 'F' },
        cog: { distance: 30.0, depth: 2.0, angle: 0 },
        moi: { total: 2050 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'MID', forgiveness: 5, control: 9 }
    },
    {
        id: "VOKEY_SM10_52_08F",
        modelName: "SM10 52° 08F",
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.WEDGE,
        head: { loft: 52, lie: 64, faceAngle: 0, bounce: 8, grind: 'F' },
        cog: { distance: 30.0, depth: 2.0, angle: 0 },
        moi: { total: 2050 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'HIGH', forgiveness: 5, control: 10 }
    },
    {
        id: "VOKEY_SM10_54_10S",
        modelName: "SM10 54° 10S",
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.WEDGE,
        head: { loft: 54, lie: 64, faceAngle: 0, bounce: 10, grind: 'S' },
        cog: { distance: 29.5, depth: 2.0, angle: 0 },
        moi: { total: 2100 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'HIGH', forgiveness: 6, control: 10 }
    },
    {
        id: "VOKEY_SM10_56_12D", // Added common spec
        modelName: "SM10 56° 12D",
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.WEDGE,
        head: { loft: 56, lie: 64, faceAngle: 0, bounce: 12, grind: 'D' },
        cog: { distance: 29.5, depth: 2.0, angle: 0 },
        moi: { total: 2100 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'HIGH', forgiveness: 7, control: 9 }
    },
    {
        id: "VOKEY_SM10_58_04L", // Change from L for variety if needed, but L is fine
        modelName: "SM10 58° 04T", // Using T grind for variety or keep L
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.WEDGE,
        head: { loft: 58, lie: 64, faceAngle: 0, bounce: 4, grind: 'T' },
        cog: { distance: 29.0, depth: 1.8, angle: 0 },
        moi: { total: 2000 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'HIGH', forgiveness: 4, control: 10 }
    },
    {
        id: "VOKEY_SM10_58_08M", // Added M grind
        modelName: "SM10 58° 08M",
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.WEDGE,
        head: { loft: 58, lie: 64, faceAngle: 0, bounce: 8, grind: 'M' },
        cog: { distance: 29.0, depth: 2.0, angle: 0 },
        moi: { total: 2050 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'HIGH', forgiveness: 6, control: 10 }
    },
    {
        id: "VOKEY_SM10_58_12D",
        modelName: "SM10 58° 12D",
        brand: "Titleist",
        releaseYear: 2024,
        category: TargetCategory.WEDGE,
        head: { loft: 58, lie: 64, faceAngle: 0, bounce: 12, grind: 'D' },
        cog: { distance: 29.0, depth: 2.2, angle: 0 },
        moi: { total: 2100 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'HIGH', forgiveness: 7, control: 8 }
    },

    // === Cleveland RTX ===
    {
        id: "CLEV_RTX_ZIPCORE_52_10",
        modelName: "RTX ZipCore 52° Mid",
        brand: "Cleveland",
        releaseYear: 2023,
        category: TargetCategory.WEDGE,
        head: { loft: 52, lie: 64, faceAngle: 0, bounce: 10, grind: 'MID' },
        cog: { distance: 30.5, depth: 2.5, angle: 0 },
        moi: { total: 2200 },
        characteristics: { bias: 'NEUTRAL', launch: 'MID', spin: 'HIGH', forgiveness: 7, control: 8 }
    },
    {
        id: "CLEV_RTX_ZIPCORE_56_12",
        modelName: "RTX ZipCore 56° Full",
        brand: "Cleveland",
        releaseYear: 2023,
        category: TargetCategory.WEDGE,
        head: { loft: 56, lie: 64, faceAngle: 0, bounce: 12, grind: 'FULL' },
        cog: { distance: 29.5, depth: 2.5, angle: 0 },
        moi: { total: 2100 },
        characteristics: { bias: 'NEUTRAL', launch: 'HIGH', spin: 'HIGH', forgiveness: 8, control: 8 }
    },

    // ============ PUTTER DATA ============
    // === Scotty Cameron ===
    {
        id: "SC_SUPER_SELECT_NP_2024",
        modelName: "Super Select Newport",
        brand: "Scotty Cameron",
        releaseYear: 2024,
        category: TargetCategory.PUTTER,
        head: { loft: 3.5, lie: 70, faceAngle: 0 },
        cog: { distance: 32.0, depth: 15.0, angle: 0 },
        moi: { total: 3500 },
        characteristics: { bias: 'NEUTRAL', launch: 'LOW', spin: 'LOW', forgiveness: 6, control: 10 }
    },
    {
        id: "SC_PHANTOM_X_2024",
        modelName: "Phantom X 5.5",
        brand: "Scotty Cameron",
        releaseYear: 2024,
        category: TargetCategory.PUTTER,
        head: { loft: 3.5, lie: 70, faceAngle: 0 },
        cog: { distance: 38.0, depth: 25.0, angle: 0 },
        moi: { total: 5500 },
        characteristics: { bias: 'NEUTRAL', launch: 'LOW', spin: 'LOW', forgiveness: 8, control: 8 }
    },

    // === Ping パター ===
    {
        id: "PING_2023_ANSER_2D",
        modelName: "2023 ANSER 2D",
        brand: "Ping",
        releaseYear: 2023,
        category: TargetCategory.PUTTER,
        head: { loft: 3.0, lie: 70, faceAngle: 0 },
        cog: { distance: 35.0, depth: 18.0, angle: 0 },
        moi: { total: 4000 },
        characteristics: { bias: 'NEUTRAL', launch: 'LOW', spin: 'LOW', forgiveness: 7, control: 9 }
    },
    {
        id: "PING_2023_PRODI_G",
        modelName: "2023 PLD Milled Tyne 4",
        brand: "Ping",
        releaseYear: 2023,
        category: TargetCategory.PUTTER,
        head: { loft: 3.0, lie: 70, faceAngle: 0 },
        cog: { distance: 40.0, depth: 30.0, angle: 0 },
        moi: { total: 6500 },
        characteristics: { bias: 'NEUTRAL', launch: 'LOW', spin: 'LOW', forgiveness: 10, control: 7 }
    },

    // === Odyssey パター ===
    {
        id: "ODYSSEY_ELEVEN_2M",
        modelName: "Eleven 2M",
        brand: "Odyssey",
        releaseYear: 2023,
        category: TargetCategory.PUTTER,
        head: { loft: 3.0, lie: 70, faceAngle: 0 },
        cog: { distance: 42.0, depth: 35.0, angle: 0 },
        moi: { total: 7000 },
        characteristics: { bias: 'NEUTRAL', launch: 'LOW', spin: 'LOW', forgiveness: 10, control: 6 }
    },
    {
        id: "ODYSSEY_TRI_HOT_5K",
        modelName: "Tri-Hot 5K #2",
        brand: "Odyssey",
        releaseYear: 2023,
        category: TargetCategory.PUTTER,
        head: { loft: 3.0, lie: 70, faceAngle: 0 },
        cog: { distance: 36.0, depth: 20.0, angle: 0 },
        moi: { total: 5000 },
        characteristics: { bias: 'NEUTRAL', launch: 'LOW', spin: 'LOW', forgiveness: 8, control: 9 }
    }
];
