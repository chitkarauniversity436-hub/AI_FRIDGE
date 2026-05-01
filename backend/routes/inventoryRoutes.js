const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all inventory routes
router.use(authMiddleware);

// GET all items for logged in user
router.get('/', async (req, res) => {
  try {
    const items = await Item.find({ user: req.user.id });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST a new item
router.post('/', async (req, res) => {
  try {
    const item = new Item({ ...req.body, user: req.user.id });
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add item', details: err.message });
  }
});

// PUT (update) an item (ensure user owns it)
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Item.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update item' });
  }
});

// DELETE an item
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedItem) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
