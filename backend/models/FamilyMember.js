const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: { type: String, default: '👤' },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' }
});

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
