const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Item = require('./models/Item');
const User = require('./models/User');
const Order = require('./models/Order');
const FamilyMember = require('./models/FamilyMember');

const seedData = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ai_fridge');
    console.log('Connected to DB. Clearing old data...');
    
    await Item.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    await FamilyMember.deleteMany({});

    console.log('Creating Admin User...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@home.com',
      password: hashedPassword,
      role: 'Admin'
    });
    await adminUser.save();

    console.log('Inserting seed items...');
    const seedItems = [
      { user: adminUser._id, name: 'Whole Milk', category: 'Dairy', quantity: 1, unit: 'L', expiryDate: new Date(Date.now() + 2 * 86400000), calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, threshold: 1 },
      { user: adminUser._id, name: 'Cheddar Cheese', category: 'Dairy', quantity: 0.5, unit: 'kg', expiryDate: new Date(Date.now() + 14 * 86400000), calories: 403, protein: 25, carbs: 1.3, fat: 33, threshold: 0.2 },
      { user: adminUser._id, name: 'Eggs', category: 'Protein', quantity: 2, unit: 'pcs', expiryDate: new Date(Date.now() + 20 * 86400000), calories: 155, protein: 13, carbs: 1.1, fat: 11, threshold: 6 },
      { user: adminUser._id, name: 'Spinach', category: 'Vegetables', quantity: 50, unit: 'g', expiryDate: new Date(Date.now() + 1 * 86400000), calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, threshold: 200 },
      { user: adminUser._id, name: 'Chicken Breast', category: 'Protein', quantity: 500, unit: 'g', expiryDate: new Date(Date.now() + 3 * 86400000), calories: 165, protein: 31, carbs: 0, fat: 3.6, threshold: 100 },
    ];
    await Item.insertMany(seedItems);

    console.log('Inserting seed orders...');
    const seedOrders = [
      { 
        user: adminUser._id, 
        orderNumber: 'ORD-8291', 
        store: 'BigBasket',
        status: 'Delivered', 
        total: 1245.50, 
        items: [{ name: 'Milk', qty: 2 }, { name: 'Eggs', qty: 12 }, { name: 'Chicken', qty: 1 }], 
        date: new Date(Date.now() - 5 * 86400000) 
      },
      { 
        user: adminUser._id, 
        orderNumber: 'ORD-9302', 
        store: 'Instamart',
        status: 'Processing', 
        total: 412.20, 
        items: [{ name: 'Spinach', qty: 2 }, { name: 'Cheddar Cheese', qty: 1 }], 
        date: new Date(Date.now() - 1 * 3600000) 
      },
      { 
        user: adminUser._id, 
        orderNumber: 'ORD-7104', 
        store: 'Amazon Fresh',
        status: 'Shipped', 
        total: 2150.00, 
        items: [{ name: 'Greek Yogurt', qty: 4 }, { name: 'Avocado', qty: 6 }], 
        date: new Date(Date.now() - 24 * 3600000) 
      },
    ];
    await Order.insertMany(seedOrders);

    console.log('Inserting seed family members...');
    const seedMembers = [
      { user: adminUser._id, name: 'Sarah Smith', email: 'sarah@home.com', avatar: '👩‍🍳', role: 'Admin' },
      { user: adminUser._id, name: 'John Doe', email: 'john@home.com', avatar: '👨‍💻', role: 'Member' },
    ];
    await FamilyMember.insertMany(seedMembers);
    
    console.log('✅ Database seeded successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding DB:', err);
    mongoose.connection.close();
  }
};

seedData();
