import type { Launch10ResearchRecord } from '../data/launch10ResearchTemplate';

export interface ContentValidationResult {
  canPublish: boolean;
  missingRequired: string[];
  warnings: string[];
}

const requiredFieldsForPublish: Array<keyof Launch10ResearchRecord> = [
  'name',
  'slug',
  'profileType',
  'seasonYear',
  'latestSourcePolicy',
  'ballName',
  'feature1',
  'feature2',
  'feature3',
  'summary',
  'driverBrand',
  'driverModel',
  'driverLoft',
  'driverShaftModel',
  'driverShaftFlex',
  'sourceType',
  'sourceUrl',
  'sourceTitle',
  'checkedAt',
];

const fullBagRequiredFields: Array<keyof Launch10ResearchRecord> = [
  'driverModel',
  'fairwayWoodModel',
  'utilityModel',
  'ironModel',
  'wedgeModel',
  'putterModel',
];

export const validateLaunch10Record = (record: Launch10ResearchRecord): ContentValidationResult => {
  const missingRequired = requiredFieldsForPublish.filter((field) => {
    const value = record[field];
    return value === null || value === '';
  }).map(String);

  const warnings: string[] = [];

  if (record.headSpeedMps === null) {
    warnings.push('headSpeedMps is blank');
  }

  if (record.averageScore === null) {
    warnings.push('averageScore is blank');
  }

  if (record.bestScore === null) {
    warnings.push('bestScore is blank');
  }

  if (record.sourceType === 'instagram' && !record.sourceUrl) {
    warnings.push('instagram source requires sourceUrl');
  }

  const missingFullBagFields = fullBagRequiredFields.filter((field) => {
    const value = record[field];
    return value === null || value === '';
  }).map(String);

  if (missingFullBagFields.length > 0) {
    warnings.push(`full bag is incomplete: ${missingFullBagFields.join(', ')}`);
  }

  return {
    canPublish: missingRequired.length === 0 && missingFullBagFields.length === 0,
    missingRequired,
    warnings,
  };
};
