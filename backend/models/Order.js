const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true },
  store: { type: String, default: 'Instamart' },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Delivered', 'Processing', 'Shipped', 'Cancelled'], default: 'Processing' },
  total: { type: Number, required: true },
  items: [{
    name: { type: String, required: true },
    qty: { type: Number, default: 1 }
  }]
});

// Nicer JSON output
orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.dateFormatted = new Date(ret.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Order', orderSchema);
