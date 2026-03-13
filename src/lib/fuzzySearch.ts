// fuzzy検索ユーティリティ - ローマ字・日本語両対応

// ローマ字 → ひらがな変換マッピング
const ROMAJI_TO_HIRAGANA: Record<string, string> = {
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'sa': 'さ', 'si': 'し', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'za': 'ざ', 'zi': 'じ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'ta': 'た', 'ti': 'ち', 'chi': 'ち', 'tu': 'つ', 'tsu': 'つ', 'te': 'て', 'to': 'と',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'n': 'ん',
    // 拗音
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    // 特殊
    'tei': 'てい', 'tee': 'てー', 'ra-': 'らー', 'me-': 'めー'
};

// ブランド名の読み仮名マッピング（主要ブランド）
export const BRAND_READINGS: Record<string, string[]> = {
    'TaylorMade': ['taylormade', 'テイラーメイド', 'ていらーめいど', 'てーらーめいど', 'テーラーメイド'],
    'Callaway': ['callaway', 'キャロウェイ', 'きゃろうぇい', 'きゃろうぇー', 'キャラウェイ'],
    'Titleist': ['titleist', 'タイトリスト', 'たいとりすと'],
    'PING': ['ping', 'ピン', 'ぴん'],
    'Cobra': ['cobra', 'コブラ', 'こぶら'],
    'Srixon': ['srixon', 'スリクソン', 'すりくそん'],
    'Cleveland': ['cleveland', 'クリーブランド', 'くりーぶらんど'],
    'ブリヂストン': ['bridgestone', 'ブリヂストン', 'ぶりぢすとん', 'ぶりじすとん', 'bs', 'ビーエス'],
    'ダンロップ': ['dunlop', 'ダンロップ', 'だんろっぷ'],
    'XXIO': ['xxio', 'ゼクシオ', 'ぜくしお'],
    'ミズノ': ['mizuno', 'ミズノ', 'みずの'],
    'ヤマハ': ['yamaha', 'ヤマハ', 'やまは'],
    'ホンマ': ['honma', 'ホンマ', 'ほんま', '本間', 'ほんまごるふ', 'HONMA'],
    'PRGR': ['prgr', 'プロギア', 'ぷろぎあ'],
    'フォーティーン': ['fourteen', 'フォーティーン', 'ふぉーてぃーん', '14'],
    'マルマン': ['maruman', 'マルマン', 'まるまん'],
    'オノフ': ['onoff', 'オノフ', 'おのふ'],
    'キャスコ': ['kasco', 'キャスコ', 'きゃすこ'],
    'Odyssey': ['odyssey', 'オデッセイ', 'おでっせい'],
    'Scotty Cameron': ['scotty', 'cameron', 'スコッティキャメロン', 'すこってぃきゃめろん', 'スコッティ'],
    'Bettinardi': ['bettinardi', 'ベティナルディ', 'べてぃなるでぃ']
};

// モデル名の読み仮名マッピング（主要モデル）
export const MODEL_READINGS: Record<string, string[]> = {
    'Qi10': ['qi10', 'キューアイテン', 'きゅーあいてん'],
    'Paradym': ['paradym', 'パラダイム', 'ぱらだいむ'],
    'Stealth': ['stealth', 'ステルス', 'すてるす'],
    'Pro V1': ['prov1', 'pro v1', 'プロブイワン', 'ぷろぶいわん'],
    'Z-STAR': ['zstar', 'z-star', 'ゼットスター', 'ぜっとすたー']
};

/**
 * カタカナをひらがなに変換
 */
const katakanaToHiragana = (str: string): string => {
    return str.replace(/[\u30A1-\u30F6]/g, ch =>
        String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
};

/**
 * ローマ字をひらがなに変換（簡易版）
 */
const romajiToHiragana = (romaji: string): string => {
    let result = '';
    let remaining = romaji.toLowerCase();

    while (remaining.length > 0) {
        let matched = false;
        // 長い順にマッチを試みる
        for (let len = 4; len >= 1; len--) {
            const substr = remaining.substring(0, len);
            if (ROMAJI_TO_HIRAGANA[substr]) {
                result += ROMAJI_TO_HIRAGANA[substr];
                remaining = remaining.substring(len);
                matched = true;
                break;
            }
        }
        if (!matched) {
            result += remaining[0];
            remaining = remaining.substring(1);
        }
    }
    return result;
};

/**
 * 検索クエリを正規化（小文字化、スペース除去など）
 */
const normalizeQuery = (query: string): string => {
    return query.toLowerCase().replace(/[\s\-_\.]/g, '');
};

/**
 * fuzzy検索を実行
 * @param query 検索クエリ
 * @param items 検索対象のアイテム配列
 * @param readings オプションの読み仮名マッピング
 * @returns マッチしたアイテムの配列（スコア順）
 */
export const fuzzySearch = (
    query: string,
    items: string[],
    readings?: Record<string, string[]>
): string[] => {
    if (!query || query.length === 0) return items;

    const normalizedQuery = normalizeQuery(query);
    const hiraganaQuery = katakanaToHiragana(query);
    const romajiHiragana = romajiToHiragana(normalizedQuery);

    const scored: Array<{ item: string; score: number }> = [];

    for (const item of items) {
        let score = 0;
        const normalizedItem = normalizeQuery(item);

        // 完全一致（最高スコア）
        if (normalizedItem === normalizedQuery) {
            score = 100;
        }
        // 先頭一致
        else if (normalizedItem.startsWith(normalizedQuery)) {
            score = 90;
        }
        // 部分一致
        else if (normalizedItem.includes(normalizedQuery)) {
            score = 70;
        }
        // 読み仮名でマッチ
        else if (readings && readings[item]) {
            for (const reading of readings[item]) {
                const normalizedReading = normalizeQuery(reading);
                if (normalizedReading.includes(normalizedQuery) ||
                    normalizedReading.includes(hiraganaQuery) ||
                    normalizedReading.includes(romajiHiragana)) {
                    score = 60;
                    break;
                }
            }
        }
        // ローマ字→ひらがな変換でマッチ
        else if (romajiHiragana.length > 0) {
            const itemHiragana = katakanaToHiragana(item);
            if (itemHiragana.includes(romajiHiragana)) {
                score = 50;
            }
        }

        if (score > 0) {
            scored.push({ item, score });
        }
    }

    // スコア降順でソート
    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.item);
};

/**
 * ブランド名をfuzzy検索
 */
export const searchBrands = (query: string, brands: string[]): string[] => {
    return fuzzySearch(query, brands, BRAND_READINGS);
};

/**
 * モデル名をfuzzy検索
 */
export const searchModels = (query: string, models: string[]): string[] => {
    return fuzzySearch(query, models, MODEL_READINGS);
};
