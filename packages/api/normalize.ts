const VALID_SERVING_UNITS = ['ml', 'g', 'tbsp'] as const;

// Consistent schema for nutrition entries
export type NormalizedEntry = {
  id: string;
  timestamp: string;
  foodName: string;
  serving: {
    amount: number;
    unit: string;
  };
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  calories: number | null;
  metadata?: Record<string, unknown>;
  issues?: {
    invalid?: Array<keyof NormalizedEntry>;
    unknown?: Array<keyof NormalizedEntry>;
    inconsistent?: Array<keyof NormalizedEntry>;
  }
}

// Source A type
interface SourceAEntry {
  entryId: string;
  timestamp: string;
  foodName: string;
  serving: {
    amount: number;
    unit: string;
  };
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  calories_kcal: number;
}

// Source B type
interface SourceBEntry {
  id: string;
  loggedAt: string;
  name: string;
  servingSize: string;
  macros: {
    protein: string;
    carbs: string;
    fat: string;
  };
  calories: string | null;
  extra?: Record<string, unknown>;
}

// Source C type
interface SourceCEntry {
  source?: string;
  item: {
    label: string;
    brand?: string;
  };
  logged_at: string;
  serving_grams: number;
  nutrients: Array<{
    key: string;
    value: number;
    unit: string;
  }>;
}

// Source D type
interface SourceDEntry {
  id: string;
  time: string;
  food: string;
  serving: {
    amount: number;
    unit: string;
  };
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  calories_kcal: number;
  macros_basis: string;
}

// Helper function to parse serving size string (e.g., "2 tbsp", "500ml")
function parseServingSize(servingSize: string): { amount: number; unit: string } {
  const match = servingSize.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  if (match && match[1] && match[2]) {
    return {
      amount: parseFloat(match[1]),
      unit: match[2].trim()
    };
  }
  // Fallback: try to extract number
  const numMatch = servingSize.match(/\d+(?:\.\d+)?/);
  if (numMatch) {
    return {
      amount: parseFloat(numMatch[0]),
      unit: servingSize.replace(numMatch[0], '').trim() || 'unit'
    };
  }
  return { amount: 1, unit: servingSize };
}

// Helper function to convert string to number, handling null/undefined
function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to convert string to number or null
function toNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
}

// Valid serving units


// Helper function to validate serving unit
function isValidServingUnit(unit: string): boolean {
  return VALID_SERVING_UNITS.includes(unit.toLowerCase() as typeof VALID_SERVING_UNITS[number]);
}

// Helper function to validate and populate issues for a normalized entry
function validateEntry(
  entry: Omit<NormalizedEntry, 'issues'>,
  unknownFields: Array<keyof NormalizedEntry> = []
): NormalizedEntry {
  const invalid: Array<keyof NormalizedEntry> = [];
  const unknown: Array<keyof NormalizedEntry> = [...unknownFields];
  const inconsistent: Array<keyof NormalizedEntry> = [];

  // Validate serving unit
  if (!isValidServingUnit(entry.serving.unit)) {
    invalid.push('serving');
  }

  // Validate calories consistency if calories are provided
  if (typeof entry.calories === 'number') {
    // Validate that calories are non-negative
    if (entry.calories < 0) {
      invalid.push('calories');
    }

    // Validate that calories are consistent
    if (!validateCalories(entry.calories, entry.macros.protein, entry.macros.carbs, entry.macros.fat)) {
      inconsistent.push('calories');
    }
  }

  // Validate that macros are non-negative
  if (entry.macros.protein < 0 || entry.macros.carbs < 0 || entry.macros.fat < 0) {
    invalid.push('macros');
  }

  // Validate serving amount is positive
  if (entry.serving.amount <= 0 || !isFinite(entry.serving.amount)) {
    invalid.push('serving');
  }

  // Build issues object only with non-empty arrays
  const issues: NormalizedEntry['issues'] = {
    ...(invalid.length > 0 && {invalid}),
    ...(unknown.length > 0 && {unknown}),
    ...(inconsistent.length > 0 && {inconsistent}),
  };

  return {
    ...entry,
    ...(Object.keys(issues).length > 0 && {issues})
  };
}

// Normalize Source A entries
function normalizeSourceA(entry: SourceAEntry): NormalizedEntry {
  const unknownFields: Array<keyof NormalizedEntry> = [];
  
  // Check for null/undefined values (runtime safety check)
  if (Object.values(entry.macros).some(val => typeof (+val) !== 'number')) {
    unknownFields.push('macros');
  }
  
  if (typeof entry.calories_kcal !== 'number') {
    unknownFields.push('calories');
  }
  
  const normalized = {
    id: entry.entryId,
    timestamp: entry.timestamp,
    foodName: entry.foodName,
    serving: entry.serving,
    macros: {
      protein: entry.macros.protein_g,
      carbs: entry.macros.carbs_g,
      fat: entry.macros.fat_g,
    },
    calories: entry.calories_kcal,
  };
  return validateEntry(normalized, unknownFields);
}

// Normalize Source B entries
function normalizeSourceB(entry: SourceBEntry): NormalizedEntry {
  const serving = parseServingSize(entry.servingSize);
  const unknownFields: Array<keyof NormalizedEntry> = [];
  
  if (Object.values(entry.macros).some(val => typeof (+val) !== 'number')) {
    unknownFields.push('macros');
  }
  // Track undefined calories (null is allowed, strings get converted)
  if (!entry.calories) {
    unknownFields.push('calories');
  }
  
  const normalized = {
    id: entry.id,
    timestamp: entry.loggedAt,
    foodName: entry.name,
    serving,
    macros: {
      protein: toNumber(entry.macros.protein),
      carbs: toNumber(entry.macros.carbs),
      fat: toNumber(entry.macros.fat),
    },
    calories: toNumberOrNull(entry.calories),
    metadata: entry.extra ? { extra: entry.extra } : undefined,
  };
  return validateEntry(normalized, unknownFields);
}

// Normalize Source C entries
function normalizeSourceC(entry: SourceCEntry): NormalizedEntry {
  // Extract macros from nutrients array
  const macros = {
    protein: 0,
    carbs: 0,
    fat: 0,
  };
  
  let calories_kcal: number | null = null;
  const unknownFields: Array<keyof NormalizedEntry> = [];
  
  let hasProtein = false;
  let hasCarbs = false;
  let hasFat = false;
  let hasEnergy = false;
  
  // Process nutrients array - use last value for duplicates
  for (const nutrient of entry.nutrients) {
    const key = nutrient.key.toLowerCase();
    if (key === 'protein') {
      macros.protein = nutrient.value;
      hasProtein = true;
    } else if (key === 'carbohydrate' || key === 'carbs') {
      macros.carbs = nutrient.value;
      hasCarbs = true;
    } else if (key === 'fat') {
      macros.fat = nutrient.value;
      hasFat = true;
    } else if (key === 'energy') {
      calories_kcal = nutrient.value;
      hasEnergy = true;
    }
  }
  
  // Track missing nutrients
  if ([hasProtein, hasCarbs, hasFat].some(val => !val)) {
    unknownFields.push('macros');
  }
  if ([hasEnergy].some(val => !val)) {
    unknownFields.push('calories');
  }
  
  const metadata: Record<string, unknown> = {};
  if (entry.source) metadata.source = entry.source;
  if (entry.item.brand) metadata.brand = entry.item.brand;
  
  const normalized = {
    id: `c-${entry.logged_at}-${entry.item.label}`.replace(/[^a-zA-Z0-9-]/g, '-'),
    timestamp: entry.logged_at,
    foodName: entry.item.label,
    serving: {
      amount: entry.serving_grams,
      unit: 'g',
    },
    macros,
    calories: calories_kcal,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
  return validateEntry(normalized, unknownFields);
}

// Normalize Source D entries
function normalizeSourceD(entry: SourceDEntry): NormalizedEntry {
  const metadata: Record<string, unknown> = {};
  if (entry.macros_basis) metadata.macros_basis = entry.macros_basis;
  
  const unknownFields: Array<keyof NormalizedEntry> = [];
  
  // Check for null/undefined values (runtime safety check)
  if (Object.values(entry.macros).some(val => typeof (+val) !== 'number')) {
    unknownFields.push('macros');
  }
  if (typeof entry.calories_kcal !== 'number') {
    unknownFields.push('calories');
  }
  
  const normalized = {
    id: entry.id,
    timestamp: entry.time,
    foodName: entry.food,
    serving: entry.serving,
    macros: {
      protein: entry.macros.protein_g,
      carbs: entry.macros.carbs_g,
      fat: entry.macros.fat_g,
    },
    calories: entry.calories_kcal,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
  return validateEntry(normalized, unknownFields);
}

// Main normalization function that detects source type and normalizes accordingly
export function normalizeEntries(data: unknown[]): NormalizedEntry[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // Detect source type based on first entry's structure
  const firstEntry = data[0] as Record<string, unknown>;
  
  // Source A: has entryId and foodName
  if ('entryId' in firstEntry && 'foodName' in firstEntry) {
    return data.map(entry => normalizeSourceA(entry as SourceAEntry));
  }
  
  // Source B: has loggedAt and servingSize (string)
  if ('loggedAt' in firstEntry && 'servingSize' in firstEntry && typeof firstEntry.servingSize === 'string') {
    return data.map(entry => normalizeSourceB(entry as SourceBEntry));
  }
  
  // Source C: has item.label and nutrients array
  if ('item' in firstEntry && 'nutrients' in firstEntry && Array.isArray(firstEntry.nutrients)) {
    return data.map(entry => normalizeSourceC(entry as SourceCEntry));
  }
  
  // Source D: has time and food (and macros_basis)
  if ('time' in firstEntry && 'food' in firstEntry) {
    return data.map(entry => normalizeSourceD(entry as SourceDEntry));
  }
  
  // Unknown format - return empty array or throw error
  throw new Error('Unknown data source format');
}

function calcCalories(p = 0, c = 0, f = 0) {
  return (p * 4) + (c * 4) + (f * 9);
}

function validateCalories(givenCalories: number | undefined = undefined, p = 0, c = 0, f = 0) {
  if (typeof givenCalories !== 'number') return false;
  const calculatedCalories = calcCalories(p, c, f);
  return Math.abs(calculatedCalories)/3 >= Math.abs(Math.abs(calculatedCalories) - Math.abs(givenCalories));
}
