import fs from 'node:fs';

const seedFiles = fs.readdirSync('docs').filter((file) => file.endsWith('-seed.json'));

const changed = [];
const exact = [];
const classOnly = [];
const skipped = [];

const graphiteSplitPatterns = [
  /^(Tour AD(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{1,3})$/i,
  /^(Ventus(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{1,2})$/i,
  /^(VENTUS(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{1,2})$/i,
  /^(\d{2}\s+VENTUS(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{1,2})$/i,
  /^(Diamana(?:\s+[A-Za-z0-9+.+-]+)*?)\s+(\d{2,3})$/i,
  /^(Tensei(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{2,3})$/i,
  /^(TENSEI(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{2,3})$/i,
  /^(LIN-Q(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{1,2})$/i,
  /^(LINQ(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{1,2})$/i,
  /^(SPEEDER\s+NX(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{2})$/i,
  /^(Speeder\s+NX(?:\s+[A-Za-z0-9+.-]+)*?)\s+(\d{2})$/i,
  /^(Aldila\s+Synergy\s+Blue)\s+(\d{2,3})$/i,
];

function normalizeText(value) {
  return String(value || '')
    .replace(/[™®]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFlex(value) {
  return normalizeText(value).toUpperCase();
}

function isBlankWeight(value) {
  return value === null || value === undefined || value === '';
}

function isNumericOnly(value) {
  return /^\d{1,3}$/.test(String(value || '').trim());
}

function splitGraphiteModel(model) {
  if (typeof model !== 'string') return null;
  const value = normalizeText(model);

  // Speeder Evolution 3/4/7 uses the number as a generation name, not a weight class.
  if (/Evolution\s+\d+$/i.test(value)) return null;

  for (const pattern of graphiteSplitPatterns) {
    const match = value.match(pattern);
    if (match) {
      return {
        model: normalizeText(match[1]),
        classCode: match[2],
      };
    }
  }

  return null;
}

function classLabel(classCode) {
  const numeric = Number(classCode);
  if (!Number.isFinite(numeric)) return null;
  if (numeric >= 100) return `${numeric}g台`;
  if (numeric >= 20) {
    if (numeric % 10 === 0) return `${numeric}g台`;
    return `${numeric}g`;
  }
  return `${numeric * 10}g台`;
}

function exactTourAdDi(classCode, flex) {
  const f = normalizeFlex(flex);
  const key = `${classCode}-${f}`;
  const map = {
    '5-R2': '53.5g',
    '5-R1': '55g',
    '5-S': '56.5g',
    '5-X': '60.5g',
    '6-SR': '63.5g',
    '6-S': '65g',
    '6-X': '66.5g',
    '6-TX': '68.5g',
    '7-S': '73.5g',
    '7-X': '75g',
    '7-TX': '76.5g',
    '8-S': '83.5g',
    '8-X': '84.5g',
    '8-TX': '86g',
    '9-X': '97g',
  };
  return map[key] || null;
}

function exactGraphiteWeight(model, classCode, flex) {
  const normalized = normalizeText(model).toLowerCase();

  if (/^tour ad di$/.test(normalized)) {
    const value = exactTourAdDi(classCode, flex);
    if (value) return { value, confidence: 'exact', reason: 'Tour AD DI model/flex catalog match' };
  }

  // Diamana model numbers such as 53/63/73/83 are specific published weight codes.
  // Round numbers such as 50/60/70/80 are treated as weight classes unless an exact
  // source-specific spec is added later.
  if (/^diamana\s+(bb|wb)$/i.test(model) && Number(classCode) >= 50 && Number(classCode) % 10 !== 0) {
    return { value: `${classCode}g`, confidence: 'exact', reason: 'Diamana published weight code in model name' };
  }

  return null;
}

function exactSteelWeight(model, flex) {
  const m = normalizeText(model).toLowerCase();
  const f = normalizeFlex(flex);

  if (/dynamic gold/.test(m)) {
    if (/(^|[^a-z])x100($|[^a-z])/.test(f)) return { value: '130g', confidence: 'exact', reason: 'Dynamic Gold X100 catalog weight' };
    if (/(^|[^a-z])s300($|[^a-z])/.test(f)) return { value: '130g', confidence: 'exact', reason: 'Dynamic Gold S300 catalog weight' };
    if (/(^|[^a-z])s200($|[^a-z])/.test(f)) return { value: '129g', confidence: 'exact', reason: 'Dynamic Gold S200 catalog weight' };
    if (/(^|[^a-z])s400($|[^a-z])/.test(f)) return { value: '130g台', confidence: 'class', reason: 'Dynamic Gold S400 exact value varies by listing; use class only' };
  }

  if (/project x lz/.test(m) || /^project x$/.test(m) || /project x 125/.test(m)) {
    if (f === '6.0') return { value: '120g', confidence: 'exact', reason: 'Project X 6.0 catalog weight' };
    if (f === '6.5') return { value: '125g', confidence: 'exact', reason: 'Project X 6.5 catalog weight' };
    if (f === '7.0') return { value: '130g', confidence: 'exact', reason: 'Project X 7.0 catalog weight' };
    if (/project x 125/.test(m)) return { value: '125g', confidence: 'exact', reason: 'Project X 125 model name' };
  }

  if (/modus3?(?:\s+|.*)tour\s*130/i.test(m)) {
    if (f === 'S') return { value: '124g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 130 S catalog weight' };
    if (f === 'X') return { value: '129g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 130 X catalog weight' };
  }

  if (/modus3?(?:\s+|.*)tour\s*125/i.test(m) || /system3\s+tour\s*125/i.test(m)) {
    if (f === 'S') return { value: '128.5g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 125 S catalog weight' };
    if (f === 'X') return { value: '129.5g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 125 X catalog weight' };
  }

  if (/modus3?(?:\s+|.*)tour\s*120/i.test(m)) {
    if (f === 'R') return { value: '111g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 120 R catalog weight' };
    if (f === 'S') return { value: '114g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 120 S catalog weight' };
    if (f === 'X') return { value: '120g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 120 X catalog weight' };
  }

  if (/modus3?(?:\s+|.*)tour\s*105/i.test(m)) {
    if (f === 'R') return { value: '103g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 105 R catalog weight' };
    if (f === 'S') return { value: '106.5g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 105 S catalog weight' };
    if (f === 'X') return { value: '112g', confidence: 'exact', reason: 'N.S.PRO MODUS3 TOUR 105 X catalog weight' };
  }

  if (/950gh\s+neo/i.test(m)) {
    if (f === 'R') return { value: '94.5g', confidence: 'exact', reason: 'N.S.PRO 950GH neo R catalog weight' };
    if (f === 'SR') return { value: '97g', confidence: 'exact', reason: 'N.S.PRO 950GH neo SR catalog weight' };
    if (f === 'S') return { value: '98g', confidence: 'exact', reason: 'N.S.PRO 950GH neo S catalog weight' };
  }

  if (/950gh/i.test(m)) {
    if (f === 'R') return { value: '94.5g', confidence: 'exact', reason: 'N.S.PRO 950GH R catalog weight' };
    if (f === 'S') return { value: '98g', confidence: 'exact', reason: 'N.S.PRO 950GH S catalog weight' };
  }

  if (/850gh\s+neo/i.test(m)) {
    if (f === 'R') return { value: '84.5g', confidence: 'exact', reason: 'N.S.PRO 850GH neo R catalog weight' };
    if (f === 'S') return { value: '88g', confidence: 'exact', reason: 'N.S.PRO 850GH neo S catalog weight' };
    return { value: '80g台', confidence: 'class', reason: 'N.S.PRO 850GH neo class only; exact flex not mapped' };
  }

  if (/850gh/i.test(m)) {
    if (f === 'R') return { value: '87g', confidence: 'exact', reason: 'N.S.PRO 850GH R catalog weight' };
    if (f === 'S') return { value: '91g', confidence: 'exact', reason: 'N.S.PRO 850GH S catalog weight' };
  }

  if (/750.*wrap\s+tech/i.test(m)) {
    return { value: '70g台', confidence: 'class', reason: 'N.S.PRO 750 Wrap Tech class only; variant exact value needs manual confirmation' };
  }

  if (/750gh\s+neo/i.test(m)) {
    if (f === 'R') return { value: '74.5g', confidence: 'exact', reason: 'N.S.PRO 750GH neo R catalog weight' };
    if (f === 'S') return { value: '78g', confidence: 'exact', reason: 'N.S.PRO 750GH neo S catalog weight' };
    return { value: '70g台', confidence: 'class', reason: 'N.S.PRO 750GH neo class only; exact flex not mapped' };
  }

  if (/750gh/i.test(m)) {
    if (f === 'R') return { value: '79g', confidence: 'exact', reason: 'N.S.PRO 750GH R catalog weight' };
    if (f === 'S') return { value: '83g', confidence: 'exact', reason: 'N.S.PRO 750GH S catalog weight' };
    return { value: '70g台', confidence: 'class', reason: 'N.S.PRO 750GH class only; exact flex not mapped' };
  }

  if (/kbs\s+tgi\s*110/i.test(m)) {
    return { value: '110g', confidence: 'exact', reason: 'KBS TGI 110 model name' };
  }

  return null;
}

function weightFromCurrentValue(item) {
  if (!isNumericOnly(item.shaft_weight)) return null;
  const code = String(item.shaft_weight).trim();
  const exactMatch = exactGraphiteWeight(item.shaft_model, code, item.shaft_flex);
  if (exactMatch) return exactMatch;
  return { value: classLabel(code), confidence: 'class', reason: 'numeric weight code normalized to class label' };
}

function normalizeExistingRoundGraphiteWeight(item) {
  const model = normalizeText(item.shaft_model).toLowerCase();
  const weight = normalizeText(item.shaft_weight);
  const match = weight.match(/^([4-9]0)g$/i);
  if (!match) return null;

  // Earlier data occasionally stored round graphite model suffixes as exact grams.
  // If the model uses a generic round class code, keep it as a class label unless
  // exact specs are explicitly mapped above.
  if (/^diamana\s+(prototype|zf)$/.test(model)) {
    return {
      value: `${match[1]}g台`,
      confidence: 'class',
      reason: 'round Diamana weight code kept as class label',
    };
  }

  return null;
}

function normalizeItem(item) {
  const originalModel = item.shaft_model;
  const originalWeight = item.shaft_weight;

  const existingRoundGraphite = normalizeExistingRoundGraphiteWeight(item);
  if (existingRoundGraphite && item.shaft_weight !== existingRoundGraphite.value) {
    item.shaft_weight = existingRoundGraphite.value;
    return {
      changed: true,
      beforeModel: originalModel,
      afterModel: item.shaft_model,
      beforeWeight: originalWeight,
      afterWeight: item.shaft_weight,
      confidence: existingRoundGraphite.confidence,
      reason: existingRoundGraphite.reason,
    };
  }

  const steel = exactSteelWeight(originalModel, item.shaft_flex);
  if (steel && item.shaft_weight !== steel.value) {
    item.shaft_weight = steel.value;
    return {
      changed: true,
      beforeModel: originalModel,
      afterModel: item.shaft_model,
      beforeWeight: originalWeight,
      afterWeight: item.shaft_weight,
      confidence: steel.confidence,
      reason: steel.reason,
    };
  }

  const currentWeight = weightFromCurrentValue(item);
  if (currentWeight) {
    item.shaft_weight = currentWeight.value;
    return {
      changed: item.shaft_weight !== originalWeight,
      beforeModel: originalModel,
      afterModel: item.shaft_model,
      beforeWeight: originalWeight,
      afterWeight: item.shaft_weight,
      confidence: currentWeight.confidence,
      reason: currentWeight.reason,
    };
  }

  const split = splitGraphiteModel(originalModel);
  if (split) {
    item.shaft_model = split.model;
    const exactMatch = exactGraphiteWeight(split.model, split.classCode, item.shaft_flex);
    if (exactMatch) {
      item.shaft_weight = exactMatch.value;
      return {
        changed: item.shaft_model !== originalModel || item.shaft_weight !== originalWeight,
        beforeModel: originalModel,
        afterModel: item.shaft_model,
        beforeWeight: originalWeight,
        afterWeight: item.shaft_weight,
        confidence: exactMatch.confidence,
        reason: exactMatch.reason,
      };
    }
    item.shaft_weight = classLabel(split.classCode);
    return {
      changed: item.shaft_model !== originalModel || item.shaft_weight !== originalWeight,
      beforeModel: originalModel,
      afterModel: item.shaft_model,
      beforeWeight: originalWeight,
      afterWeight: item.shaft_weight,
      confidence: 'class',
      reason: 'graphite shaft weight class inferred from model suffix',
    };
  }

  return null;
}

for (const file of seedFiles) {
  const filepath = `docs/${file}`;
  let payload;

  try {
    payload = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch {
    continue;
  }

  let dirty = false;

  for (const item of payload.bagItems || []) {
    if (!item.shaft_model) continue;
    const result = normalizeItem(item);
    if (result?.changed) {
      dirty = true;
      const entry = {
        file: filepath,
        player: payload.profile?.display_name || '',
        slot: item.spec_label || '',
        ...result,
      };
      changed.push(entry);
      if (entry.confidence === 'exact') exact.push(entry);
      else classOnly.push(entry);
    } else if (!result && isBlankWeight(item.shaft_weight)) {
      skipped.push({
        file: filepath,
        player: payload.profile?.display_name || '',
        slot: item.spec_label || '',
        model: item.shaft_model,
        flex: item.shaft_flex || '',
        reason: 'weight not filled: model/flex is not enough for a confident value',
      });
    }
  }

  if (dirty) {
    fs.writeFileSync(filepath, `${JSON.stringify(payload, null, 2)}\n`);
  }
}

const formatChange = (entry) =>
  `- ${entry.player} ${entry.slot} (${entry.file}): model \`${entry.beforeModel}\` -> \`${entry.afterModel}\`, weight \`${entry.beforeWeight ?? 'blank'}\` -> \`${entry.afterWeight}\` (${entry.reason})`;

const reportLines = [
  '# Shaft Weight Normalization - 2026-05-31',
  '',
  '## Policy',
  '',
  '- Exact gram values are only filled when the script has a model/flex rule with enough confidence.',
  '- Graphite shaft series numbers without a verified exact model/flex match are stored as weight classes such as `60g台`.',
  '- Ambiguous shafts are left blank for manual review rather than guessed.',
  '',
  '## Exact Weight Updates',
  '',
  ...exact.map(formatChange),
  '',
  '## Weight Class Updates',
  '',
  ...classOnly.map(formatChange),
  '',
  '## Left Blank For Manual Review',
  '',
  ...skipped.map(
    (entry) =>
      `- ${entry.player} ${entry.slot} (${entry.file}): \`${entry.model}\` flex \`${entry.flex || 'blank'}\` - ${entry.reason}`
  ),
  '',
];

fs.writeFileSync('docs/shaft-weight-normalization-2026-05-31.md', reportLines.join('\n'));

console.log(
  JSON.stringify(
    {
      changed: changed.length,
      exact: exact.length,
      classOnly: classOnly.length,
      filesChanged: new Set(changed.map((entry) => entry.file)).size,
      skipped: skipped.length,
      report: 'docs/shaft-weight-normalization-2026-05-31.md',
    },
    null,
    2
  )
);
