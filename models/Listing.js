const mongoose = require('mongoose');

// SVU rates per kg/unit by category
const SVU_RATES = {
  grain:      50,
  fruit:      120,
  vegetable:  40,
  dairy:      80,
  pharma:     800,
  other:      60
};

const ListingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['grain', 'fruit', 'vegetable', 'dairy', 'pharma', 'other']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.1, 'Quantity must be greater than 0']
  },
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'litre', 'dozen', 'box', 'unit']
  },
  svuValue: {
    type: Number
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  description: {
    type: String,
    default: ''
  },
  exchangeMethod: {
    type: String,
    default: 'Any method',
    enum: ['Meet locally', 'Delivery service', 'Warehouse hub', 'Any method']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'in_trade', 'completed']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-calculate SVU value before save
ListingSchema.pre('save', function (next) {
  const rate = SVU_RATES[this.category] || 60;
  this.svuValue = Math.round(rate * this.quantity);
  next();
});

module.exports = mongoose.model('Listing', ListingSchema);
