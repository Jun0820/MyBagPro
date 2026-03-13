// クラブ別質問コンポーネント
// SWING DATA / DEEP ANALYSIS / MEASUREMENT DATA をクラブタイプごとに最適化

import { TargetCategory, SwingTempo } from '../types/golf';

// ===== クラブ別ミスタイプ定義 =====
export const CLUB_SPECIFIC_MISS_TYPES: Record<string, { value: string; label: string; icon: string }[]> = {
    [TargetCategory.DRIVER]: [
        { value: 'SLICE', label: 'スライス', icon: '➡️' },
        { value: 'HOOK', label: 'フック/引っかけ', icon: '⬅️' },
        { value: 'PUSH', label: 'プッシュアウト', icon: '↗️' },
        { value: 'PULL', label: 'プル（左引っ張り）', icon: '↖️' },
        { value: 'HIGH_SPIN', label: '吹き上がり', icon: '⬆️' },
        { value: 'LOW_BALL', label: '低弾道（ドロップ）', icon: '⬇️' },
        { value: 'UNSTABLE', label: '打点バラつき', icon: '🎯' },
        { value: 'THIN_HIT', label: 'テンプラ', icon: '💥' }
    ],
    [TargetCategory.FAIRWAY]: [
        { value: 'SLICE', label: 'スライス', icon: '➡️' },
        { value: 'HOOK', label: 'フック', icon: '⬅️' },
        { value: 'TOP', label: 'トップ（低いゴロ）', icon: '⚡' },
        { value: 'DUFF', label: 'ダフリ', icon: '🌱' },
        { value: 'CANT_HIT_OFF_GROUND', label: '地面から打てない', icon: '🏌️' },
        { value: 'DISTANCE_GAP', label: 'ドライバーとの飛距離差が大きい', icon: '📏' },
        { value: 'LOW_BALL', label: '球が上がらない', icon: '⬇️' }
    ],
    [TargetCategory.UTILITY]: [
        { value: 'SLICE', label: 'スライス', icon: '➡️' },
        { value: 'HOOK', label: 'フック', icon: '⬅️' },
        { value: 'TOP', label: 'トップ', icon: '⚡' },
        { value: 'THIN', label: '薄い当たり', icon: '💨' },
        { value: 'DISTANCE_INCONSISTENT', label: '飛距離がバラつく', icon: '📊' },
        { value: 'CANT_DECIDE_FW_OR_IRON', label: 'FW型かアイアン型か迷う', icon: '🤔' }
    ],
    [TargetCategory.IRON]: [
        { value: 'SLICE', label: 'スライス', icon: '➡️' },
        { value: 'HOOK', label: 'フック/引っかけ', icon: '⬅️' },
        { value: 'DUFF', label: 'ダフリ', icon: '🌱' },
        { value: 'TOP', label: 'トップ', icon: '⚡' },
        { value: 'SHANK', label: 'シャンク', icon: '⚠️' },
        { value: 'DISTANCE_INCONSISTENT', label: '番手間飛距離バラつき', icon: '📊' },
        { value: 'CANT_STOP_ON_GREEN', label: 'グリーンで止まらない', icon: '🕳️' },
        { value: 'TOO_HIGH', label: '球が高すぎる', icon: '⬆️' },
        { value: 'TOO_LOW', label: '球が低い', icon: '⬇️' }
    ],
    [TargetCategory.WEDGE]: [
        { value: 'CHUNK', label: 'ザックリ（ダフリ）', icon: '🌱' },
        { value: 'BLADE', label: 'トップ/ブレード', icon: '⚡' },
        { value: 'CANT_SPIN', label: 'スピンがかからない', icon: '🔄' },
        { value: 'TOO_MUCH_SPIN', label: 'スピンしすぎて戻る', icon: '↩️' },
        { value: 'BUNKER_TROUBLE', label: 'バンカーが苦手', icon: '⛳' },
        { value: 'DISTANCE_CONTROL', label: '距離感が合わない', icon: '📏' },
        { value: 'FLOP_TROUBLE', label: 'ロブショットが打てない', icon: '🌙' }
    ],
    [TargetCategory.PUTTER]: [
        { value: 'PUSH', label: '押し出し（右へ）', icon: '➡️' },
        { value: 'PULL', label: '引っかけ（左へ）', icon: '⬅️' },
        { value: 'DISTANCE_SHORT', label: 'ショートが多い', icon: '📉' },
        { value: 'DISTANCE_LONG', label: 'オーバーが多い', icon: '📈' },
        { value: 'SHORT_PUTT_MISS', label: 'ショートパットが入らない', icon: '🎯' },
        { value: 'LONG_PUTT_3PUTT', label: 'ロングパットで3パット', icon: '🔢' },
        { value: 'BREAKING_PUTT', label: '曲がるライン読めない', icon: '🔀' }
    ],
    [TargetCategory.BALL]: [
        { value: 'NOT_ENOUGH_DISTANCE', label: '飛距離が出ない', icon: '📏' },
        { value: 'TOO_MUCH_SPIN', label: 'スピンが多すぎる', icon: '🔄' },
        { value: 'NOT_ENOUGH_SPIN', label: 'スピンが足りない', icon: '💨' },
        { value: 'HARD_FEEL', label: '打感が硬い', icon: '🔨' },
        { value: 'SOFT_FEEL_WANTED', label: 'もっと柔らかい球が欲しい', icon: '☁️' },
        { value: 'WIND_AFFECTED', label: '風に弱い', icon: '💨' },
        { value: 'DURABILITY', label: 'すぐ傷がつく', icon: '🔧' }
    ]
};


// ===== クラブ別SWING DATA質問 =====
export const CLUB_SPECIFIC_SWING_QUESTIONS: Record<string, { id: string; label: string; type: 'slider' | 'select' | 'radio' | 'checkbox'; options?: { value: string; label: string }[]; min?: number; max?: number }[]> = {
    [TargetCategory.DRIVER]: [
        { id: 'headSpeed', label: 'ドライバーのヘッドスピード (m/s)', type: 'slider', min: 30, max: 55 },
        {
            id: 'swingTempo', label: 'スイングテンポ', type: 'radio', options: [
                { value: SwingTempo.FAST, label: '⚡ 速い' },
                { value: SwingTempo.NORMAL, label: '📊 普通' },
                { value: SwingTempo.SMOOTH, label: '🌊 ゆったり' }
            ]
        },
        {
            id: 'preferredTrajectory', label: '好みの弾道高さ', type: 'radio', options: [
                { value: 'HIGH', label: '🚀 高弾道' },
                { value: 'MID', label: '📊 中弾道' },
                { value: 'LOW', label: '⬇️ 低弾道（ライナー）' }
            ]
        },
        {
            id: 'preferredBallFlight', label: '好みの球筋（軌道）', type: 'radio', options: [
                { value: 'STRAIGHT', label: '➡️ ストレート' },
                { value: 'FADE', label: '↗️ フェード（左→右）' },
                { value: 'DRAW', label: '↖️ ドロー（右→左）' }
            ]
        }
    ],
    [TargetCategory.FAIRWAY]: [
        { id: 'headSpeed', label: 'ドライバーのヘッドスピード (m/s)', type: 'slider', min: 30, max: 55 },
        {
            id: 'matchDriverShaft', label: 'ドライバーのシャフトと揃えますか？', type: 'radio', options: [
                { value: 'YES', label: '✅ はい（同じ系統を推奨）' },
                { value: 'NO', label: '❌ いいえ（別で選びたい）' }
            ]
        },
        {
            id: 'groundHitFrequency', label: '地面から打つ頻度', type: 'radio', options: [
                { value: 'MOSTLY', label: 'ほとんど地面から' },
                { value: 'HALF', label: '半々' },
                { value: 'TEE_MOSTLY', label: 'ティーアップが多い' }
            ]
        },
        {
            id: 'fwPriority', label: 'FWに求めること', type: 'radio', options: [
                { value: 'EASY_LAUNCH', label: '上がりやすさ重視' },
                { value: 'DISTANCE', label: '飛距離重視' },
                { value: 'VERSATILITY', label: '汎用性（ライ対応）' }
            ]
        },
        {
            id: 'preferredTrajectory', label: '理想の弾道高さ', type: 'radio', options: [
                { value: 'HIGH', label: '🚀 高弾道（キャリーで止める）' },
                { value: 'MID', label: '📊 中弾道（バランス型）' },
                { value: 'LOW', label: '⬇️ 低弾道（風に強い）' }
            ]
        },
        {
            id: 'preferredBallFlight', label: '好みの球筋（軌道）', type: 'radio', options: [
                { value: 'STRAIGHT', label: '➡️ ストレート' },
                { value: 'FADE', label: '↗️ フェード（左→右）' },
                { value: 'DRAW', label: '↖️ ドロー（右→左）' }
            ]
        }
    ],
    [TargetCategory.UTILITY]: [
        { id: 'headSpeed', label: 'ドライバーのヘッドスピード (m/s)', type: 'slider', min: 30, max: 55 },
        {
            id: 'utUsage', label: '主な使用シーン', type: 'radio', options: [
                { value: 'LONG_PAR3', label: 'ロングのPar3' },
                { value: 'SECOND_SHOT', label: 'Par5のセカンド' },
                { value: 'RECOVERY', label: 'リカバリー/ライが悪い時' },
                { value: 'ALL', label: '万能に使いたい' }
            ]
        },
        {
            id: 'utPreference', label: '好みの形状', type: 'radio', options: [
                { value: 'FW_TYPE', label: 'ウッド型（丸い）' },
                { value: 'IRON_TYPE', label: 'アイアン型（薄い）' },
                { value: 'HYBRID', label: 'ハイブリッド型（中間）' } // Hybrid表記追加
            ]
        },
        {
            id: 'preferredTrajectory', label: '理想の弾道高さ', type: 'radio', options: [
                { value: 'HIGH', label: '🚀 高弾道（グリーンで止まる）' },
                { value: 'MID', label: '📊 中弾道（安定した距離感）' },
                { value: 'LOW', label: '⬇️ 低弾道（ランで転がす）' }
            ]
        },
        {
            id: 'preferredBallFlight', label: '好みの球筋（軌道）', type: 'radio', options: [
                { value: 'STRAIGHT', label: '➡️ ストレート' },
                { value: 'FADE', label: '↗️ フェード（左→右）' },
                { value: 'DRAW', label: '↖️ ドロー（右→左）' }
            ]
        }
    ],
    [TargetCategory.IRON]: [
        { id: 'headSpeed', label: 'ドライバーのヘッドスピード (m/s)', type: 'slider', min: 30, max: 55 },
        {
            id: 'downblowStrength', label: 'ダウンブローの強さ', type: 'radio', options: [
                { value: 'STRONG', label: 'しっかりターフを取る' },
                { value: 'NORMAL', label: '普通' },
                { value: 'SWEEP', label: '払い打ち（レベル）' }
            ]
        },
        {
            id: 'ironPriority', label: 'アイアンに求めること', type: 'radio', options: [
                { value: 'DISTANCE', label: '飛び系（やさしく飛ぶ）' },
                { value: 'FEEL', label: '打感・フィーリング' },
                { value: 'CONTROL', label: '操作性・球筋の打ち分け' },
                { value: 'SPIN', label: 'スピン性能（止まる）' }
            ]
        },
        {
            id: 'preferredTrajectory', label: '理想の弾道高さ', type: 'radio', options: [
                { value: 'HIGH', label: '🚀 高弾道（グリーンで止まる）' },
                { value: 'MID', label: '📊 中弾道（番手通りの距離）' },
                { value: 'LOW', label: '⬇️ 低弾道（風に強い）' }
            ]
        },
        {
            id: 'preferredBallFlight', label: '好みの球筋（軌道）', type: 'radio', options: [
                { value: 'STRAIGHT', label: '➡️ ストレート' },
                { value: 'FADE', label: '↗️ フェード（左→右）' },
                { value: 'DRAW', label: '↖️ ドロー（右→左）' }
            ]
        }
    ],
    [TargetCategory.WEDGE]: [
        // Vokey Wedge Selector準拠の質問フロー + 診断モード
        {
            id: 'wedgeDiagnosisMode', label: '診断モード', type: 'radio', options: [
                { value: 'ADD', label: '➕ 1本追加・買い足し' },
                { value: 'REPLACE', label: '🔄 全体見直し (リプレース)' }
            ]
        },
        {
            id: 'handicapLevel', label: 'ハンディキャップ/平均スコア', type: 'radio', options: [
                { value: 'scratch', label: '0〜9 (シングル)' },
                { value: 'mid', label: '10〜19' },
                { value: 'high', label: '20〜29' },
                { value: 'beginner', label: '30以上' }
            ]
        },
        // PWロフト質問は削除（プロフィール入力等へ移行または省略）
        {
            id: 'highestLoft', label: '欲しい最もロフトが寝ているウェッジ', type: 'radio', options: [
                { value: '56', label: '56°' },
                { value: '58', label: '58°' },
                { value: '60', label: '60°' },
                { value: 'unknown', label: 'わからない' }
            ]
        },
        {
            id: 'divotDepth', label: 'ウェッジのディボット（ターフ）傾向', type: 'radio', options: [
                { value: 'shallow', label: '🟢 浅い（滑らせるタイプ）' },
                { value: 'normal', label: '🟡 普通' },
                { value: 'deep', label: '🔴 深い（打ち込むタイプ）' }
            ]
        },
        {
            id: 'ironShaftType', label: '使用しているアイアンのシャフト', type: 'radio', options: [
                { value: 'steel', label: 'スチール' },
                { value: 'carbon', label: 'カーボン' },
                { value: 'unknown', label: 'わからない' }
            ]
        },
        {
            id: 'bunkerFrequency', label: 'バンカーショットの得意度', type: 'radio', options: [
                { value: 'HIGH', label: '得意・問題ない' },
                { value: 'NORMAL', label: '普通' },
                { value: 'LOW', label: '苦手・脱出優先' }
            ]
        }
        // gapUsage, sandUsage, lobUsage は一旦削除してシンプルに
    ],
    [TargetCategory.PUTTER]: [
        // Odyssey/Ping式パターフィッティング質問
        {
            id: 'strokeType', label: 'ストローク軌道（バックスイングからフォローまでの動き）', type: 'radio', options: [
                { value: 'straight', label: '➡️ ストレート（真っすぐ引いて真っすぐ出す）' },
                { value: 'slight_arc', label: '↩️ 軽いアーク（少し内側に引く）' },
                { value: 'strong_arc', label: '🔄 強いアーク（大きく内側に引く）' },
                { value: 'unknown', label: '❓ わからない' }
            ]
        },
        {
            id: 'distanceIssue', label: '距離感の悩み', type: 'radio', options: [
                { value: 'short', label: '📉 ショートが多い' },
                { value: 'long', label: '📈 オーバーが多い' },
                { value: 'none', label: '✅ 特に問題なし' }
            ]
        },
        {
            id: 'shortPuttIssue', label: 'ショートパット(2m以内)の傾向', type: 'radio', options: [
                { value: 'push', label: '➡️ 押し出し（右へ外れる）' },
                { value: 'pull', label: '⬅️ 引っかけ（左へ外れる）' },
                { value: 'none', label: '✅ 特に問題なし' }
            ]
        },
        {
            id: 'preferredFeel', label: '好みの打感', type: 'radio', options: [
                { value: 'soft', label: '☁️ ソフト（インサート系）' },
                { value: 'firm', label: '🔨 しっかり（ミルドフェース系）' }
            ]
        },
        {
            id: 'currentShape', label: '現在使用しているパターの形状', type: 'radio', options: [
                { value: 'blade', label: '🔪 ブレード (ピン型)' },
                { value: 'mallet', label: '🔵 マレット' },
                { value: 'neo_mallet', label: '⚫ ネオマレット (大型)' },
                { value: 'unknown', label: '❓ わからない' }
            ]
        },
        {
            id: 'putterLength', label: 'パター長さ', type: 'radio', options: [
                { value: '32', label: '32インチ以下' },
                { value: '33', label: '33インチ' },
                { value: '34', label: '34インチ' },
                { value: '35', label: '35インチ以上' }
            ]
        },
        {
            id: 'alignmentPreference', label: 'アライメント（照準）の好み', type: 'radio', options: [
                { value: 'line', label: '📏 センターライン' },
                { value: 'triple', label: '📐 トリプルトラック' },
                { value: 'dot', label: '⚪ ドットのみ' },
                { value: 'none', label: '❌ 特になし' }
            ]
        }
    ],
    [TargetCategory.BALL]: [
        { id: 'headSpeed', label: 'ドライバーのヘッドスピード (m/s)', type: 'slider', min: 30, max: 55 },
        {
            id: 'ballPreferredFeel', label: '好みの打感', type: 'radio', options: [
                { value: 'VERY_SOFT', label: '☁️ とても柔らかい' },
                { value: 'SOFT', label: '柔らかめ' },
                { value: 'NORMAL', label: '普通' },
                { value: 'FIRM', label: 'しっかりめ' }
            ]
        }
    ]
};

// ===== クラブ別MEASUREMENT DATA項目 =====
export interface ClubMeasurementFields {
    label: string;
    placeholder: string;
    key: string;
    unit: string;
}

export const CLUB_MEASUREMENT_FIELDS: Record<string, ClubMeasurementFields[]> = {
    [TargetCategory.DRIVER]: [
        { label: 'キャリー', key: 'driverCarryDistance', unit: 'yd', placeholder: '230' },
        { label: '総飛距離', key: 'driverTotalDistance', unit: 'yd', placeholder: '250' },
        { label: 'ボール初速', key: 'ballSpeed', unit: 'm/s', placeholder: '65' },
        { label: '打ち出し角', key: 'launchAngle', unit: '°', placeholder: '12' },
        { label: 'スピン量', key: 'spinRateMeasured', unit: 'rpm', placeholder: '2500' },
        { label: 'サイドスピン', key: 'sideSpinRate', unit: 'rpm', placeholder: '+200' },
        { label: 'ミート率', key: 'smashFactor', unit: '', placeholder: '1.48' },
        { label: 'アタックアングル', key: 'attackAngle', unit: '°', placeholder: '+3' }
    ],
    [TargetCategory.FAIRWAY]: [
        { label: '計測した番手', key: 'measurementClubType', unit: '', placeholder: '3W' }, // 番手選択
        { label: 'キャリー飛距離', key: 'fwCarryDistance', unit: 'yd', placeholder: '200' },
        { label: 'スピン量', key: 'fwSpinRate', unit: 'rpm', placeholder: '3500' },
        { label: '打ち出し角', key: 'fwLaunchAngle', unit: '°', placeholder: '14' }
    ],
    [TargetCategory.UTILITY]: [
        { label: '計測した番手', key: 'measurementClubType', unit: '', placeholder: '3H' }, // 番手選択
        { label: 'キャリー飛距離', key: 'utCarryDistance', unit: 'yd', placeholder: '180' },
        { label: 'スピン量', key: 'utSpinRate', unit: 'rpm', placeholder: '4000' }
    ],
    [TargetCategory.IRON]: [
        { label: '7番ロフト角', key: 'sevenIronLoft', unit: '°', placeholder: '30' }, // 追加
        { label: '7番キャリー飛距離', key: 'sevenIronDistance', unit: 'yd', placeholder: '150' },
        { label: '7番スピン量', key: 'ironSpinRate', unit: 'rpm', placeholder: '6000' },
        { label: '7番打ち出し角', key: 'ironLaunchAngle', unit: '°', placeholder: '18' },
        { label: '落下角', key: 'ironDescentAngle', unit: '°', placeholder: '45' }
    ],
    [TargetCategory.WEDGE]: [
        { label: '計測したロフト', key: 'measurementClubType', unit: '°', placeholder: '52' }, // ロフト選択
        { label: 'フルショット距離', key: 'wedgeFullDistance', unit: 'yd', placeholder: '80' },
        { label: 'スピン量', key: 'wedgeSpinRate', unit: 'rpm', placeholder: '9000' }
    ],
    [TargetCategory.PUTTER]: [
        // パターは弾道計測ではなく傾向質問
    ],
    [TargetCategory.BALL]: [
        { label: 'ドライバーキャリー', key: 'driverCarryDistance', unit: 'yd', placeholder: '230' },
        { label: 'ドライバースピン', key: 'spinRateMeasured', unit: 'rpm', placeholder: '2500' },
        { label: '7番アイアン距離', key: 'sevenIronDistance', unit: 'yd', placeholder: '150' },
        { label: 'ウェッジスピン', key: 'wedgeSpinRate', unit: 'rpm', placeholder: '9000' }
    ]
};

// ===== 好みと重視するポイント =====
export const CLUB_PRIORITY_OPTIONS: Record<string, { value: string; label: string; icon: string }[]> = {
    [TargetCategory.DRIVER]: [
        { value: 'DISTANCE', label: '飛距離', icon: '🚀' },
        { value: 'DIRECTION', label: '方向性', icon: '🎯' },
        { value: 'FEEL', label: '打感', icon: '✋' },
        { value: 'LOOK', label: '見た目', icon: '👀' },
        { value: 'PRICE', label: '価格', icon: '💰' }
    ],
    [TargetCategory.FAIRWAY]: [
        { value: 'EASY_LAUNCH', label: '上がりやすさ', icon: '⬆️' },
        { value: 'STRAIGHT', label: '直進性', icon: '➡️' },
        { value: 'CONTROL', label: '操作性', icon: '🎮' },
        { value: 'VERSATILITY', label: '万能性', icon: '🔀' }
    ],
    [TargetCategory.UTILITY]: [
        { value: 'EASY_HIT', label: '打ちやすさ', icon: '✅' },
        { value: 'DISTANCE', label: '飛距離', icon: '🚀' },
        { value: 'HEIGHT', label: '球の高さ', icon: '⬆️' },
        { value: 'RESCUE', label: 'リカバリー性能', icon: '🆘' }
    ],
    [TargetCategory.IRON]: [
        { value: 'DISTANCE', label: '飛び系', icon: '🚀' },
        { value: 'FEEL', label: '打感', icon: '✋' },
        { value: 'CONTROL', label: '操作性', icon: '🎮' },
        { value: 'FORGIVENESS', label: 'やさしさ', icon: '🤲' },
        { value: 'SPIN', label: 'スピン性能', icon: '🔄' }
    ],
    [TargetCategory.WEDGE]: [
        { value: 'SPIN', label: 'スピン量', icon: '🔄' },
        { value: 'FEEL', label: '打感', icon: '✋' },
        { value: 'VERSATILITY', label: '汎用性', icon: '🔀' },
        { value: 'SOLE', label: 'ソール抜け', icon: '👟' }
    ],
    [TargetCategory.PUTTER]: [
        { value: 'FEEL', label: '打感', icon: '✋' },
        { value: 'DISTANCE_FEEL', label: '距離感', icon: '📏' },
        { value: 'DIRECTION', label: '方向性', icon: '🎯' },
        { value: 'LOOK', label: '見た目', icon: '👀' },
        { value: 'ALIGNMENT', label: '構えやすさ', icon: '📐' }
    ],
    [TargetCategory.BALL]: [
        { value: 'FEEL', label: '打感', icon: '✋' },
        { value: 'DISTANCE', label: '飛距離', icon: '🚀' },
        { value: 'SPIN', label: 'スピン', icon: '🔄' },
        { value: 'DURABILITY', label: '耐久性', icon: '🔧' },
        { value: 'PRICE', label: '価格', icon: '💰' }
    ]
};

export default CLUB_SPECIFIC_MISS_TYPES;
