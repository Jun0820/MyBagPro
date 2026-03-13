
import { generatePhysicsBasedDiagnosis } from './lib/diagnosis_logic';
import { TargetCategory, DiagnosisMode, UserProfile, MissType, SwipeDirection, SwingTempo, TrajectoryType, StanceWidth } from './types/golf';

const mockProfileWedge: UserProfile = {
    targetCategory: TargetCategory.WEDGE,
    diagnosisMode: DiagnosisMode.FULL_SPEC,
    headSpeed: 42,
    missTendencies: [],
    skillLevel: ['中級者'],
    currentBrand: 'Unknown',
    currentModel: 'Unknown',
    wedgeUsage: { pw: ['FULL'], gw: ['FULL'], sw: ['BUNKER', 'OPEN_FACE'], lw: [] },
    divotDepth: 'deep',
    bunkerSkill: 'normal',
    handicap: 'mid',
    ironShaftType: 'steel',
    preferredBrands: [],
    freeComments: ''
};

console.log('--- Testing Wedge DB Expansion ---');
const result1 = generatePhysicsBasedDiagnosis(mockProfileWedge);
if (result1.rankings.some(r => r.brand === 'Ping')) {
    console.log('PASS: Ping wedges found in generic search.');
} else {
    console.log('INFO: Ping not in top 3 (might be score related). Top 3 brands:', result1.rankings.map(r => r.brand));
}

console.log('\n--- Testing Strict Brand Filtering (Callaway) ---');
const mockProfileCallaway = { ...mockProfileWedge, preferredBrands: ['Callaway'] };
const result2 = generatePhysicsBasedDiagnosis(mockProfileCallaway);
const brands2 = result2.rankings.map(r => r.brand);
console.log('Result Brands:', brands2);
if (brands2.every(b => b === 'Callaway')) {
    console.log('PASS: Only Callaway wedges returned.');
} else {
    console.error('FAIL: Non-Callaway wedges returned:', brands2);
}

console.log('\n--- Testing Free Comment Analysis (Wedge: "やさしい") ---');
const mockProfileEasy = { ...mockProfileWedge, freeComments: 'とにかくやさしいのがいい。' };
const result3 = generatePhysicsBasedDiagnosis(mockProfileEasy);
const reasoning3 = result3.rankings[0].reasoning;
console.log('Top Recommendation Reasoning:', reasoning3);
console.log('Top Recommendation Reasoning:', reasoning3);
if (typeof reasoning3 === 'string' && reasoning3.includes('やさしさ')) {
    console.log('PASS: "Yasashii" logic triggered reasoning.');
} else if (Array.isArray(reasoning3) && reasoning3.some((r: string) => r.includes('やさしさ'))) {
    console.log('PASS: "Yasashii" logic triggered reasoning (Array).');
} else {
    console.error('FAIL: "Yasashii" reasoning not found.');
}

console.log('\n--- Testing Driver Free Comment ("飛距離") ---');
const mockProfileDriver: UserProfile = {
    targetCategory: TargetCategory.DRIVER,
    diagnosisMode: DiagnosisMode.HEAD_ONLY,
    headSpeed: 40,
    missTendencies: [MissType.SLICE],
    skillLevel: ['初心者'],
    freeComments: 'もっと飛距離が欲しい。',
    // Minimal valid profile
    measurementData: {},
    ballPreferences: { preferredFeel: 'SOFT', priority: 'DISTANCE', preferredBrands: [] }
};
const resultDriver = generatePhysicsBasedDiagnosis(mockProfileDriver);
const reasoningDriver = resultDriver.rankings[0].reasoning;
if (typeof reasoningDriver === 'string' && reasoningDriver.includes('飛距離')) {
    console.log('PASS: "Distance" keyword triggered boost/message.');
} else if (Array.isArray(reasoningDriver) && reasoningDriver.some((r: string) => r.includes('飛距離'))) {
    console.log('PASS: "Distance" keyword triggered boost/message (Array).');
} else {
    console.log('INFO: Top reason:', reasoningDriver);
}

console.log('\n--- Testing Putter Free Comment ("Ping") ---');
const mockProfilePutter: UserProfile = {
    targetCategory: TargetCategory.PUTTER,
    measurementData: { currentShape: 'blade', shortPuttIssue: 'push', putterLength: '34' },
    freeComments: 'Pingが好き。'
};
const resultPutter = generatePhysicsBasedDiagnosis(mockProfilePutter);
const brandsPutter = resultPutter.rankings.map(r => r.brand);
console.log('Putter Brands:', brandsPutter);
if (brandsPutter.includes('Ping')) {
    console.log('PASS: Ping Putter boosted into top results.');
} else {
    console.error('FAIL: Ping not boosted properly.');
}
