// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Category = require('../models/category');
const Booking = require('../models/booking');
const { isLoggedIn, isAdmin } = require('../middleware/auth');

// ===== WRAP ASYNC HELPER =====
const wrapAsync = function(fn) {
  return function(req, res, next) {
    fn(req, res, next).catch(next);
  };
};

// ============================================
// ===== ADMIN DASHBOARD =====
// ============================================
router.get('/admin/dashboard', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  // Get counts
  const totalUsers = await User.countDocuments();
  const totalProviders = await User.countDocuments({ role: 'provider' });
  const totalBookings = await Booking.countDocuments();
  const totalCategories = await Category.countDocuments();
  const pendingProviders = await User.countDocuments({ 
    role: 'provider',
    'providerProfile.verificationStatus': 'pending'
  });
  const pendingBookings = await Booking.countDocuments({ status: 'pending' });
  
  // Recent bookings
  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'name email');
  
  // Recent users
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5);
  
  // Monthly stats (last 6 months)
  const monthlyStats = await Booking.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        total: { $sum: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 6 }
  ]);

  res.render('admin/dashboard', {
    user: req.user,
    stats: {
      totalUsers,
      totalProviders,
      totalBookings,
      totalCategories,
      pendingProviders,
      pendingBookings
    },
    recentBookings,
    recentUsers,
    monthlyStats
  });
}));

// ============================================
// ===== USERS MANAGEMENT =====
// ============================================
router.get('/admin/users', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  
  res.render('admin/users', {
    user: req.user,
    users: users
  });
}));

// Delete User
router.delete('/admin/users/:id', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted successfully' });
}));

// Update User Role
router.put('/admin/users/:id/role', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const { role } = req.body;
  
  if (!role || !['user', 'provider', 'admin'].includes(role)) {
    const err = new Error('Invalid role provided');
    err.status = 400;
    throw err;
  }
  
  const user = await User.findById(req.params.id);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  
  await User.findByIdAndUpdate(req.params.id, { role: role });
  res.json({ success: true, message: 'User role updated successfully' });
}));

// ============================================
// ===== PROVIDERS MANAGEMENT =====
// ============================================
router.get('/admin/providers', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const providers = await User.find({ role: 'provider' }).sort({ createdAt: -1 });
  
  res.render('admin/providers', {
    user: req.user,
    providers: providers
  });
}));

// Verify Provider
router.put('/admin/providers/:id/verify', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const { status } = req.body; // 'approved' or 'rejected'
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    const err = new Error('Invalid verification status');
    err.status = 400;
    throw err;
  }
  
  const provider = await User.findById(req.params.id);
  if (!provider) {
    const err = new Error('Provider not found');
    err.status = 404;
    throw err;
  }
  
  if (provider.role !== 'provider') {
    const err = new Error('User is not a provider');
    err.status = 400;
    throw err;
  }
  
  await User.findByIdAndUpdate(req.params.id, {
    'providerProfile.verificationStatus': status,
    'providerProfile.isVerified': status === 'approved'
  });
  
  res.json({ 
    success: true, 
    message: `Provider ${status === 'approved' ? 'approved' : 'rejected'} successfully` 
  });
}));

// Delete Provider
router.delete('/admin/providers/:id', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const provider = await User.findById(req.params.id);
  if (!provider) {
    const err = new Error('Provider not found');
    err.status = 404;
    throw err;
  }
  
  if (provider.role !== 'provider') {
    const err = new Error('User is not a provider');
    err.status = 400;
    throw err;
  }
  
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Provider deleted successfully' });
}));

// ============================================
// ===== BOOKINGS MANAGEMENT =====
// ============================================
router.get('/admin/bookings', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'name email phone');
  
  res.render('admin/bookings', {
    user: req.user,
    bookings: bookings
  });
}));

// Update Booking Status
router.put('/admin/bookings/:id/status', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const { status } = req.body;
  
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    const err = new Error('Invalid booking status');
    err.status = 400;
    throw err;
  }
  
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  
  await Booking.findByIdAndUpdate(req.params.id, { status: status });
  res.json({ success: true, message: 'Booking status updated successfully' });
}));

// Delete Booking
router.delete('/admin/bookings/:id', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  
  await Booking.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Booking deleted successfully' });
}));

// ============================================
// ===== CATEGORIES MANAGEMENT =====
// ============================================
router.get('/admin/categories', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const categories = await Category.find().sort({ createdAt: -1 });
  
  res.render('admin/categories', {
    user: req.user,
    categories: categories
  });
}));

// Delete Category
router.delete('/admin/categories/:id', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted successfully' });
}));

// ===== GET CUSTOMER DETAILS =====
router.get('/admin/customer/:userId', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const userId = req.params.userId;
  
  // Get customer details
  const customer = await User.findById(userId).select('-password');
  if (!customer) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }
  
  // Get all bookings for this customer
  const bookings = await Booking.find({ userId: userId })
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    customer: customer,
    bookings: bookings,
    totalBookings: bookings.length
  });
}));

// ===== GET SINGLE BOOKING DETAILS =====
router.get('/admin/booking/:id', isLoggedIn, isAdmin, wrapAsync(async function(req, res) {
  const booking = await Booking.findById(req.params.id)
    .populate('userId', 'name email phone');
  
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  
  res.json({
    success: true,
    booking: booking
  });
}));

module.exports = router;