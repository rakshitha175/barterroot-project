const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { protect } = require('../middleware/auth');

// GET /api/listings  — browse all active listings (with optional category filter)
router.get('/', protect, async (req, res) => {
  try {
    const filter = { status: 'active' };
    if (req.query.category) filter.category = req.query.category;

    const listings = await Listing.find(filter)
      .populate('user', 'name location rating')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: listings.length, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/listings/mine  — get current user's listings
router.get('/mine', protect, async (req, res) => {
  try {
    const listings = await Listing.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/listings/match  — find matching listings for current user's total SVU
router.get('/match', protect, async (req, res) => {
  try {
    // Get requester's active listings total SVU
    const myListings = await Listing.find({ user: req.user._id, status: 'active' });
    const mySVU = myListings.reduce((sum, l) => sum + l.svuValue, 0);

    if (mySVU === 0) {
      return res.status(400).json({ success: false, message: 'You have no active listings to match.' });
    }

    // Find all OTHER users' active listings
    const others = await Listing.find({ user: { $ne: req.user._id }, status: 'active' })
      .populate('user', 'name location rating');

    // Group by user
    const byUser = {};
    others.forEach(l => {
      const uid = l.user._id.toString();
      if (!byUser[uid]) byUser[uid] = { user: l.user, listings: [], totalSVU: 0 };
      byUser[uid].listings.push(l);
      byUser[uid].totalSVU += l.svuValue;
    });

    // Calculate match quality for each user
    const matches = Object.values(byUser).map(partner => {
      const diff = Math.abs(mySVU - partner.totalSVU);
      const maxSVU = Math.max(mySVU, partner.totalSVU);
      const pct = parseFloat(((diff / maxSVU) * 100).toFixed(1));
      let label = pct <= 5 ? 'fair' : pct <= 15 ? 'near' : 'imbalanced';
      return { ...partner, mySVU, theirSVU: partner.totalSVU, diff, pct, label };
    });

    // Sort by closest match first, only return fair + near matches
    const good = matches
      .filter(m => m.pct <= 30)
      .sort((a, b) => a.pct - b.pct);

    res.json({ success: true, mySVU, matches: good });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/listings  — create a new listing
router.post('/', protect, async (req, res) => {
  try {
    const { name, category, quantity, unit, location, description, exchangeMethod } = req.body;

    if (!name || !category || !quantity || !location) {
      return res.status(400).json({ success: false, message: 'Name, category, quantity, and location are required.' });
    }

    const listing = await Listing.create({
      user: req.user._id,
      name, category, quantity: parseFloat(quantity),
      unit: unit || 'kg',
      location, description: description || '',
      exchangeMethod: exchangeMethod || 'Any method'
    });

    res.status(201).json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/listings/:id  — delete a listing
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
    if (listing.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing.' });
    }
    await listing.deleteOne();
    res.json({ success: true, message: 'Listing removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
