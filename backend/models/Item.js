const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true, enum: ['Dairy', 'Vegetables', 'Fruits', 'Protein', 'Grains', 'Frozen', 'Beverages', 'Other'] },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  addedDate: { type: Date, default: Date.now },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  threshold: { type: Number, default: 1 }
});

// Format response nicely for frontend
itemSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject.expiryDate = returnedObject.expiryDate.toISOString().split('T')[0];
    returnedObject.addedDate = returnedObject.addedDate.toISOString().split('T')[0];
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('Item', itemSchema);
