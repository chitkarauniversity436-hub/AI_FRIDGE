export const seedInventory = [
  { id: '1', name: 'Whole Milk', category: 'Dairy', quantity: 1, unit: 'L', expiryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, threshold: 1 },
  { id: '2', name: 'Cheddar Cheese', category: 'Dairy', quantity: 200, unit: 'g', expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 403, protein: 25, carbs: 1.3, fat: 33, threshold: 50 },
  { id: '3', name: 'Eggs', category: 'Protein', quantity: 6, unit: 'pcs', expiryDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 155, protein: 13, carbs: 1.1, fat: 11, threshold: 3 },
  { id: '4', name: 'Spinach', category: 'Vegetables', quantity: 150, unit: 'g', expiryDate: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, threshold: 50 },
  { id: '5', name: 'Tomatoes', category: 'Vegetables', quantity: 4, unit: 'pcs', expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, threshold: 2 },
  { id: '6', name: 'Chicken Breast', category: 'Protein', quantity: 500, unit: 'g', expiryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 165, protein: 31, carbs: 0, fat: 3.6, threshold: 100 },
  { id: '7', name: 'Greek Yogurt', category: 'Dairy', quantity: 400, unit: 'g', expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 59, protein: 10, carbs: 3.6, fat: 0.4, threshold: 100 },
  { id: '8', name: 'Apple', category: 'Fruits', quantity: 5, unit: 'pcs', expiryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 52, protein: 0.3, carbs: 14, fat: 0.2, threshold: 2 },
  { id: '9', name: 'Orange Juice', category: 'Beverages', quantity: 1, unit: 'L', expiryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 45, protein: 0.7, carbs: 10, fat: 0.2, threshold: 1 },
  { id: '10', name: 'Butter', category: 'Dairy', quantity: 100, unit: 'g', expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 717, protein: 0.9, carbs: 0.1, fat: 81, threshold: 20 },
  { id: '11', name: 'Carrot', category: 'Vegetables', quantity: 3, unit: 'pcs', expiryDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 41, protein: 0.9, carbs: 10, fat: 0.2, threshold: 2 },
  { id: '12', name: 'Frozen Peas', category: 'Frozen', quantity: 500, unit: 'g', expiryDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 81, protein: 5.4, carbs: 14, fat: 0.4, threshold: 100 },
  { id: '13', name: 'Basmati Rice', category: 'Grains', quantity: 1, unit: 'kg', expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 130, protein: 2.7, carbs: 28, fat: 0.3, threshold: 200 },
  { id: '14', name: 'Banana', category: 'Fruits', quantity: 4, unit: 'pcs', expiryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 89, protein: 1.1, carbs: 23, fat: 0.3, threshold: 2 },
  { id: '15', name: 'Almond Milk', category: 'Beverages', quantity: 1, unit: 'L', expiryDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], addedDate: new Date().toISOString().split('T')[0], calories: 17, protein: 0.6, carbs: 0.6, fat: 1.1, threshold: 1 },
];

export const seedOrders = [
  { id: 'ORD001', date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], items: [{ name: 'Whole Milk', qty: 2, price: 60 }, { name: 'Eggs', qty: 12, price: 80 }], total: 140, status: 'Delivered', store: 'BigBasket' },
  { id: 'ORD002', date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], items: [{ name: 'Chicken Breast', qty: 1, price: 200 }, { name: 'Spinach', qty: 2, price: 40 }], total: 240, status: 'Delivered', store: 'Blinkit' },
  { id: 'ORD003', date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], items: [{ name: 'Greek Yogurt', qty: 2, price: 90 }, { name: 'Banana', qty: 6, price: 50 }], total: 140, status: 'In Transit', store: 'Zepto' },
];

export const seedFamilyMembers = [
  { id: 'u1', name: 'You (Admin)', avatar: '👤', role: 'Admin', email: 'admin@home.com' },
  { id: 'u2', name: 'Mom', avatar: '👩', role: 'Member', email: 'mom@home.com' },
  { id: 'u3', name: 'Dad', avatar: '👨', role: 'Member', email: 'dad@home.com' },
];
