const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterListings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  }],
  receiverListings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  }],
  requesterSVU: {
    type: Number,
    required: true
  },
  receiverSVU: {
    type: Number,
    required: true
  },
  svuDifferencePercent: {
    type: Number
  },
  exchangeMethod: {
    type: String,
    default: 'Any method'
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'in_transit', 'confirmed_requester', 'confirmed_receiver', 'completed', 'declined', 'disputed']
  },
  requesterConfirmed: { type: Boolean, default: false },
  receiverConfirmed:  { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-calculate SVU difference %
TradeSchema.pre('save', function (next) {
  const maxSVU = Math.max(this.requesterSVU, this.receiverSVU);
  if (maxSVU > 0) {
    this.svuDifferencePercent = parseFloat(
      ((Math.abs(this.requesterSVU - this.receiverSVU) / maxSVU) * 100).toFixed(1)
    );
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Trade', TradeSchema);
