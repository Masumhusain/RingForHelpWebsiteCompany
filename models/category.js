// models/category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    name: String,
    slug: String,
    image: String,
    sub: Number,
    renew: Number,
    nonContract: String,
    contract: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);