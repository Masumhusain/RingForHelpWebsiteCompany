// models/cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  categorySlug: {
    type: String,
    default: ''
  },
  serviceSlug: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 1
  },
  quantity: {
    type: Number,
    default: 1
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ===== NO PRE-SAVE HOOK - Direct calculation =====
// Instead of pre-save, we'll calculate in the route

module.exports = mongoose.model('Cart', cartSchema);