export const CATEGORY_ICONS = {
  Dairy:      '🥛',
  Vegetables: '🥦',
  Fruits:     '🍎',
  Protein:    '🍗',
  Grains:     '🌾',
  Frozen:     '🧊',
  Beverages:  '🥤',
  Other:      '📦',
};

export const CATEGORIES = Object.keys(CATEGORY_ICONS);

export const getScaledNutrient = (value, quantity, unit) => {
  const q = parseFloat(quantity) || 1;
  const v = parseFloat(value) || 0;
  
  // Logic: AI gives values per 100g or 100ml.
  // If unit is 'g' or 'ml', we divide quantity by 100.
  // If unit is 'kg' or 'L', we multiply quantity by 10 (since 1kg = 10 * 100g).
  if (unit === 'g' || unit === 'ml') return (v * q) / 100;
  if (unit === 'kg' || unit === 'L' || unit === 'Litre' || unit === 'Kilogram') return (v * q * 10);
  
  // For 'pcs' or other units, we assume the AI value is per 1 unit.
  return v * q;
};

export const getTotalNutrition = (items) =>
  items.reduce(
    (acc, item) => ({
      calories: acc.calories + getScaledNutrient(item.calories, item.quantity, item.unit),
      protein:  acc.protein  + getScaledNutrient(item.protein,  item.quantity, item.unit),
      carbs:    acc.carbs    + getScaledNutrient(item.carbs,    item.quantity, item.unit),
      fat:      acc.fat      + getScaledNutrient(item.fat,      item.quantity, item.unit),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

export const formatNutrient = (val) => Math.round(val);

export const getCategoryBreakdown = (items) => {
  const map = {};
  items.forEach(item => {
    if (!map[item.category]) map[item.category] = 0;
    map[item.category] += 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

export const HEALTH_MODES = [
  { id: 'none',       label: 'No Filter',   icon: '🍽️' },
  { id: 'diabetic',   label: 'Diabetic',    icon: '💉' },
  { id: 'gym',        label: 'Gym / Bulk',  icon: '💪' },
  { id: 'weightloss', label: 'Weight Loss', icon: '⚖️' },
  { id: 'vegan',      label: 'Vegan',       icon: '🌱' },
];
