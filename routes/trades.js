const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/trades  — get all trades for current user
router.get('/', protect, async (req, res) => {
  try {
    const trades = await Trade.find({
      $or: [{ requester: req.user._id }, { receiver: req.user._id }]
    })
      .populate('requester', 'name location rating')
      .populate('receiver', 'name location rating')
      .populate('requesterListings', 'name category quantity unit svuValue')
      .populate('receiverListings', 'name category quantity unit svuValue')
      .sort({ createdAt: -1 });

    res.json({ success: true, trades });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/trades/incoming  — pending requests received by current user
router.get('/incoming', protect, async (req, res) => {
  try {
    const trades = await Trade.find({ receiver: req.user._id, status: 'pending' })
      .populate('requester', 'name location rating')
      .populate('requesterListings', 'name category quantity unit svuValue')
      .populate('receiverListings', 'name category quantity unit svuValue')
      .sort({ createdAt: -1 });

    res.json({ success: true, trades });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trades  — send a trade request
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, receiverListingIds, message, exchangeMethod } = req.body;

    if (!receiverId || !receiverListingIds || receiverListingIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Receiver and their listings are required.' });
    }

    // Get requester's active listings
    const myListings = await Listing.find({ user: req.user._id, status: 'active' });
    if (myListings.length === 0) {
      return res.status(400).json({ success: false, message: 'You have no active listings to offer.' });
    }

    // Get receiver's selected listings
    const theirListings = await Listing.find({ _id: { $in: receiverListingIds }, user: receiverId });
    if (theirListings.length === 0) {
      return res.status(400).json({ success: false, message: 'Receiver listings not found.' });
    }

    const myTotalSVU    = myListings.reduce((s, l) => s + l.svuValue, 0);
    const theirTotalSVU = theirListings.reduce((s, l) => s + l.svuValue, 0);

    const trade = await Trade.create({
      requester: req.user._id,
      receiver: receiverId,
      requesterListings: myListings.map(l => l._id),
      receiverListings: receiverListingIds,
      requesterSVU: myTotalSVU,
      receiverSVU: theirTotalSVU,
      message: message || '',
      exchangeMethod: exchangeMethod || 'Any method'
    });

    res.status(201).json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/trades/:id/accept
router.patch('/:id/accept', protect, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found.' });
    if (trade.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the receiver can accept.' });
    }
    trade.status = 'accepted';
    await trade.save();
    res.json({ success: true, message: 'Trade accepted! Coordinate your exchange.', trade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/trades/:id/decline
router.patch('/:id/decline', protect, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found.' });
    trade.status = 'declined';
    await trade.save();
    res.json({ success: true, message: 'Trade declined.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/trades/:id/confirm  — confirm receipt (both must confirm to complete)
router.patch('/:id/confirm', protect, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found.' });

    const isRequester = trade.requester.toString() === req.user._id.toString();
    const isReceiver  = trade.receiver.toString()  === req.user._id.toString();

    if (!isRequester && !isReceiver) {
      return res.status(403).json({ success: false, message: 'Not part of this trade.' });
    }

    if (isRequester) trade.requesterConfirmed = true;
    if (isReceiver)  trade.receiverConfirmed  = true;

    // If both confirmed → complete the trade
    if (trade.requesterConfirmed && trade.receiverConfirmed) {
      trade.status = 'completed';
      // Update trade counts for both users
      await User.findByIdAndUpdate(trade.requester, { $inc: { totalTrades: 1 } });
      await User.findByIdAndUpdate(trade.receiver,  { $inc: { totalTrades: 1 } });
      // Mark listings as completed
      await Listing.updateMany({ _id: { $in: [...trade.requesterListings, ...trade.receiverListings] } }, { status: 'completed' });
    } else {
      trade.status = 'in_transit';
    }

    await trade.save();
    res.json({ success: true, message: trade.status === 'completed' ? 'Trade completed!' : 'Receipt confirmed. Waiting for other party.', trade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/trades/:id/dispute
router.patch('/:id/dispute', protect, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ success: false, message: 'Trade not found.' });
    trade.status = 'disputed';
    await trade.save();
    res.json({ success: true, message: 'Dispute raised. Admin will review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
