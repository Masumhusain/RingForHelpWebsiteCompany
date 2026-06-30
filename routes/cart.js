// routes/cart.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Booking = require('../models/booking');
const User = require('../models/user');
const { isLoggedIn } = require('../middleware/auth');

// ===== WRAP ASYNC HELPER =====
const wrapAsync = function(fn) {
  return function(req, res, next) {
    fn(req, res, next).catch(next);
  };
};

// ===== ADD TO CART =====
router.post('/cart/add', isLoggedIn, wrapAsync(async function(req, res) {
  const {
    serviceId,
    serviceName,
    categorySlug,
    serviceSlug,
    image,
    price,
    duration,
    quantity,
    notes
  } = req.body;

  // Validation
  if (!serviceId) {
    const err = new Error('Service ID is required');
    err.status = 400;
    throw err;
  }

  if (!price || price === 0) {
    const err = new Error('Price is required');
    err.status = 400;
    throw err;
  }

  // Find or create cart
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = new Cart({
      userId: req.user._id,
      items: []
    });
  }

  // Check if item exists
  const existingItemIndex = cart.items.findIndex(function(item) {
    return item.serviceId === serviceId;
  });

  if (existingItemIndex !== -1) {
    // Update existing item
    const existingItem = cart.items[existingItemIndex];
    existingItem.quantity += parseInt(quantity) || 1;
    existingItem.duration = parseInt(duration) || existingItem.duration;
    existingItem.totalPrice = existingItem.quantity * existingItem.duration * parseFloat(price);
    existingItem.notes = notes || existingItem.notes;
  } else {
    // Add new item
    cart.items.push({
      serviceId: serviceId,
      serviceName: serviceName || 'Unknown Service',
      categorySlug: categorySlug || '',
      serviceSlug: serviceSlug || '',
      image: image || '',
      price: parseFloat(price),
      duration: parseInt(duration) || 1,
      quantity: parseInt(quantity) || 1,
      totalPrice: (parseInt(quantity) || 1) * (parseInt(duration) || 1) * parseFloat(price),
      notes: notes || ''
    });
  }

  // Calculate total
  let totalAmount = 0;
  for (var i = 0; i < cart.items.length; i++) {
    totalAmount += cart.items[i].totalPrice || 0;
  }
  cart.totalAmount = totalAmount;

  await cart.save();

  res.json({
    success: true,
    message: 'Service added to cart! 🛒',
    cartCount: cart.items.length,
    cartTotal: cart.totalAmount
  });
}));

// ===== VIEW CART =====
router.get('/cart', isLoggedIn, wrapAsync(async function(req, res) {
  const cart = await Cart.findOne({ userId: req.user._id });

  if (cart) {
    let total = 0;
    for (var i = 0; i < cart.items.length; i++) {
      total += cart.items[i].totalPrice || 0;
    }
    cart.totalAmount = total;
  }

  res.render('cart/index', {
    cart: cart || { items: [], totalAmount: 0 },
    user: req.user
  });
}));

// ===== UPDATE CART ITEM =====
router.post('/cart/update/:itemId', isLoggedIn, wrapAsync(async function(req, res) {
  const { quantity, duration } = req.body;
  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    const err = new Error('Cart not found');
    err.status = 404;
    throw err;
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    const err = new Error('Item not found');
    err.status = 404;
    throw err;
  }

  // Validate quantity
  if (quantity && parseInt(quantity) < 1) {
    const err = new Error('Quantity must be at least 1');
    err.status = 400;
    throw err;
  }

  // Validate duration
  if (duration && parseInt(duration) < 1) {
    const err = new Error('Duration must be at least 1');
    err.status = 400;
    throw err;
  }

  if (quantity) item.quantity = parseInt(quantity);
  if (duration) item.duration = parseInt(duration);

  item.totalPrice = item.quantity * item.duration * item.price;

  // Calculate total
  let total = 0;
  for (var i = 0; i < cart.items.length; i++) {
    total += cart.items[i].totalPrice || 0;
  }
  cart.totalAmount = total;

  await cart.save();

  res.json({
    success: true,
    itemTotal: item.totalPrice,
    cartTotal: cart.totalAmount
  });
}));

// ===== REMOVE FROM CART =====
router.delete('/cart/remove/:itemId', isLoggedIn, wrapAsync(async function(req, res) {
  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    const err = new Error('Cart not found');
    err.status = 404;
    throw err;
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    const err = new Error('Item not found');
    err.status = 404;
    throw err;
  }

  cart.items.pull(req.params.itemId);

  // Calculate total
  let total = 0;
  for (var i = 0; i < cart.items.length; i++) {
    total += cart.items[i].totalPrice || 0;
  }
  cart.totalAmount = total;

  await cart.save();

  res.json({
    success: true,
    message: 'Item removed from cart',
    cartCount: cart.items.length,
    cartTotal: cart.totalAmount
  });
}));

// ===== CLEAR CART =====
router.delete('/cart/clear', isLoggedIn, wrapAsync(async function(req, res) {
  const cart = await Cart.findOne({ userId: req.user._id });
  
  if (!cart) {
    const err = new Error('Cart not found');
    err.status = 404;
    throw err;
  }
  
  await Cart.findOneAndDelete({ userId: req.user._id });
  res.json({ success: true, message: 'Cart cleared' });
}));

// ============================================
// ===== CHECKOUT ROUTES =====
// ============================================

// ===== CHECKOUT PAGE =====
router.get('/cart/checkout', isLoggedIn, wrapAsync(async function(req, res) {
  const cart = await Cart.findOne({ userId: req.user._id });
  
  if (!cart || cart.items.length === 0) {
    return res.redirect('/cart');
  }

  res.render('cart/checkout', {
    cart: cart,
    user: req.user
  });
}));

// ===== PLACE ORDER =====
router.post('/cart/checkout', isLoggedIn, wrapAsync(async function(req, res) {
  const { 
    name, phone, email, address, city, state, pincode,
    date, time, instructions 
  } = req.body;

  // ===== VALIDATION =====
  if (!name || !phone || !address || !date || !time) {
    const err = new Error('Please fill all required fields');
    err.status = 400;
    throw err;
  }

  // Validate phone number
  if (!/^\d{10}$/.test(phone)) {
    const err = new Error('Please enter a valid 10-digit phone number');
    err.status = 400;
    throw err;
  }

  // Validate date (should not be in the past)
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    const err = new Error('Date cannot be in the past');
    err.status = 400;
    throw err;
  }

  // ===== GET CART =====
  const cart = await Cart.findOne({ userId: req.user._id });
  
  if (!cart || cart.items.length === 0) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  // ===== CREATE BOOKINGS =====
  const bookings = [];
  const fullAddress = `${address}, ${city || ''}, ${state || ''}, ${pincode || ''}`;

  for (var i = 0; i < cart.items.length; i++) {
    const item = cart.items[i];
    
    const booking = new Booking({
      userId: req.user._id,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      categorySlug: item.categorySlug,
      serviceSlug: item.serviceSlug,
      date: date,
      time: time,
      duration: item.duration,
      quantity: item.quantity,
      address: fullAddress,
      instructions: instructions || '',
      customerName: name,
      customerPhone: phone,
      customerEmail: email || req.user.email,
      totalAmount: item.totalPrice,
      notes: item.notes || '',
      status: 'pending',
      paymentStatus: 'pending'
    });

    await booking.save();
    bookings.push(booking);
  }

  // ===== CALCULATE TOTAL =====
  const subtotal = cart.totalAmount;
  const serviceFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + serviceFee;

  // ===== CLEAR CART =====
  await Cart.findOneAndDelete({ userId: req.user._id });

  // ===== SEND NOTIFICATIONS (Optional) =====
  // sendEmailNotification(bookings, user);
  // sendSMSNotification(bookings, user);

  // ===== SHOW SUCCESS =====
  res.render('cart/success', {
    bookings: bookings,
    subtotal: subtotal,
    serviceFee: serviceFee,
    totalAmount: totalAmount,
    user: req.user,
    bookingCount: bookings.length
  });
}));

// ===== MY BOOKINGS =====
router.get('/my-bookings', isLoggedIn, wrapAsync(async function(req, res) {
  const bookings = await Booking.find({ userId: req.session.userId })
    .sort({ createdAt: -1 });

  res.render('bookings/my-bookings', {
    bookings: bookings,
    user: req.user
  });
}));

// ===== VIEW BOOKING DETAILS =====
router.get('/booking/:id', isLoggedIn, wrapAsync(async function(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.id,
    userId: req.session.userId
  });

  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  res.render('bookings/booking-detail', {
    booking: booking,
    user: req.user
  });
}));

// ===== CANCEL BOOKING =====
router.put('/booking/cancel/:id', isLoggedIn, wrapAsync(async function(req, res) {
  const booking = await Booking.findOne({
    _id: req.params.id,
    userId: req.session.userId
  });

  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  // Check if booking can be cancelled
  if (booking.status === 'completed') {
    const err = new Error('Completed bookings cannot be cancelled');
    err.status = 400;
    throw err;
  }

  if (booking.status === 'cancelled') {
    const err = new Error('Booking is already cancelled');
    err.status = 400;
    throw err;
  }

  booking.status = 'cancelled';
  await booking.save();

  res.json({ 
    success: true, 
    message: 'Booking cancelled successfully' 
  });
}));

module.exports = router;