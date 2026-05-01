const express = require('express');
const router = express.Router();
const FamilyMember = require('../models/FamilyMember');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const members = await FamilyMember.find({ user: req.user.id });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

router.post('/', async (req, res) => {
  try {
    const member = new FamilyMember({ ...req.body, user: req.user.id });
    await member.save();
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add family member' });
  }
});

module.exports = router;
