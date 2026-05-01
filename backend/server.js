const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const inventoryRoutes = require('./routes/inventoryRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const familyRoutes = require('./routes/familyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});


// Database Connection
const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_fridge';
mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 })
.then(async () => {
  console.log(`✅ Connected to MongoDB (${dbUri.includes('mongodb+srv') ? 'Cloud/Atlas' : 'Local'})`);
  
  // Auto-Seed Admin User
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const adminExists = await User.findOne({ email: 'admin@home.com' });
  if (!adminExists) {
    console.log('🌱 Seeding default admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    await new User({ name: 'Smart Admin', email: 'admin@home.com', password: hashedPassword, role: 'Admin' }).save();
    console.log('✅ Admin user created!');
  }
})
.catch(err => {
  console.error('⚠️ MongoDB Connection Failed. Switching to MOCK MODE.');
  app.locals.isMock = true;
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/family', familyRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
