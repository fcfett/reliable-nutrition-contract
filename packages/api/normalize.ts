// Consistent schema for nutrition entries
export interface NormalizedEntry {
  id: string;
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
  calories: number | null;
  metadata?: Record<string, unknown>;
  issues?: {
    invalid?: Array<keyof NormalizedEntry>;
    unkown?: Array<keyof NormalizedEntry>;
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
const VALID_SERVING_UNITS = ['ml', 'g', 'tbsp'] as const;

// Helper function to validate serving unit
function isValidServingUnit(unit: string): boolean {
  return VALID_SERVING_UNITS.includes(unit.toLowerCase() as typeof VALID_SERVING_UNITS[number]);
}

// Helper function to validate and populate issues for a normalized entry
function validateEntry(entry: Omit<NormalizedEntry, 'issues'>): NormalizedEntry {
  const invalid: Array<keyof NormalizedEntry> = [];
  const unkown: Array<keyof NormalizedEntry> = [];
  const inconsistent: Array<keyof NormalizedEntry> = [];

  // Validate serving unit
  if (!isValidServingUnit(entry.serving.unit)) {
    invalid.push('serving');
  }

  // Validate calories consistency if calories are provided
  if (entry.calories !== null && typeof entry.calories === 'number') {
    const calculatedCalories = calcCalories(
      entry.macros.protein_g,
      entry.macros.carbs_g,
      entry.macros.fat_g
    );
    if (!validateCalories(entry.calories, entry.macros.protein_g, entry.macros.carbs_g, entry.macros.fat_g)) {
      inconsistent.push('calories');
    }
  }

  // Validate that macros are non-negative
  if (entry.macros.protein_g < 0 || entry.macros.carbs_g < 0 || entry.macros.fat_g < 0) {
    invalid.push('macros');
  }

  // Validate serving amount is positive
  if (entry.serving.amount <= 0 || !isFinite(entry.serving.amount)) {
    invalid.push('serving');
  }

  // Build issues object only with non-empty arrays
  const issues: NormalizedEntry['issues'] = {
    ...(invalid.length > 0 && {invalid}),
    ...(unkown.length > 0 && {unkown}),
    ...(inconsistent.length > 0 && {inconsistent}),
  };

  return {
    ...entry,
    ...(Object.keys(issues).length > 0 && {issues})
  };
}

// Normalize Source A entries
function normalizeSourceA(entry: SourceAEntry): NormalizedEntry {
  const normalized = {
    id: entry.entryId,
    timestamp: entry.timestamp,
    foodName: entry.foodName,
    serving: entry.serving,
    macros: {
      protein_g: entry.macros.protein_g,
      carbs_g: entry.macros.carbs_g,
      fat_g: entry.macros.fat_g,
    },
    calories: entry.calories_kcal,
  };
  return validateEntry(normalized);
}

// Normalize Source B entries
function normalizeSourceB(entry: SourceBEntry): NormalizedEntry {
  const serving = parseServingSize(entry.servingSize);
  
  const normalized = {
    id: entry.id,
    timestamp: entry.loggedAt,
    foodName: entry.name,
    serving,
    macros: {
      protein_g: toNumber(entry.macros.protein),
      carbs_g: toNumber(entry.macros.carbs),
      fat_g: toNumber(entry.macros.fat),
    },
    calories: toNumberOrNull(entry.calories),
    metadata: entry.extra ? { extra: entry.extra } : undefined,
  };
  return validateEntry(normalized);
}

// Normalize Source C entries
function normalizeSourceC(entry: SourceCEntry): NormalizedEntry {
  // Extract macros from nutrients array
  const macros = {
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };
  
  let calories_kcal: number | null = null;
  
  // Process nutrients array - handle duplicates by summing
  const nutrientMap = new Map<string, number>();
  for (const nutrient of entry.nutrients) {
    const key = nutrient.key.toLowerCase();
    if (key === 'protein') {
      nutrientMap.set('protein', (nutrientMap.get('protein') || 0) + nutrient.value);
    } else if (key === 'carbohydrate' || key === 'carbs') {
      nutrientMap.set('carbs', (nutrientMap.get('carbs') || 0) + nutrient.value);
    } else if (key === 'fat') {
      nutrientMap.set('fat', (nutrientMap.get('fat') || 0) + nutrient.value);
    } else if (key === 'energy') {
      calories_kcal = nutrient.value;
    }
  }
  
  macros.protein_g = nutrientMap.get('protein') || 0;
  macros.carbs_g = nutrientMap.get('carbs') || 0;
  macros.fat_g = nutrientMap.get('fat') || 0;
  
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
  return validateEntry(normalized);
}

// Normalize Source D entries
function normalizeSourceD(entry: SourceDEntry): NormalizedEntry {
  const metadata: Record<string, unknown> = {};
  if (entry.macros_basis) metadata.macros_basis = entry.macros_basis;
  
  const normalized = {
    id: entry.id,
    timestamp: entry.time,
    foodName: entry.food,
    serving: entry.serving,
    macros: {
      protein_g: entry.macros.protein_g,
      carbs_g: entry.macros.carbs_g,
      fat_g: entry.macros.fat_g,
    },
    calories: entry.calories_kcal,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
  return validateEntry(normalized);
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

export function calculateCalories(macros: { protein_g: number; carbs_g: number; fat_g: number }): number {
  return macros.protein_g * 4 + macros.carbs_g * 4 + macros.fat_g * 9;
}

export function calcCalories(p = 0, c = 0, f = 0) {
  return (p * 4) + (c * 4) + (f * 9);
}

export function validateCalories(givenCalories: number | undefined = undefined, p = 0, c = 0, f = 0) {
  if (typeof givenCalories !== 'number') return false;
  const calculatedCalories = calcCalories(p, c, f);
  return (calculatedCalories/3) >= Math.abs(calculatedCalories - givenCalories);
}
