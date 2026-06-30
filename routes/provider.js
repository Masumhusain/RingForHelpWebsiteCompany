// routes/provider.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Booking = require('../models/booking');
const { isLoggedIn, isProvider } = require('../middleware/auth');

// ===== PROVIDER REGISTRATION PAGE =====
router.get('/provider/register', isLoggedIn, async function(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    
    // If already provider, redirect to dashboard
    if (user.role === 'provider') {
      return res.redirect('/provider/dashboard');
    }
    
    res.render('Provider/register', { user });
  } catch (error) {
    console.error('Provider registration page error:', error);
    res.status(500).send('Error loading registration');
  }
});

// ===== PROVIDER REGISTRATION SUBMIT =====
router.post('/provider/register', isLoggedIn, async function(req, res) {
  try {
    const {
      companyName,
      businessType,
      description,
      hourlyRate,
      street,
      city,
      state,
      pincode,
      weekdayStart,
      weekdayEnd
    } = req.body;

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Update user with provider details
    user.role = 'provider';
    user.providerProfile = {
      companyName: companyName || '',
      businessType: businessType || 'individual',
      description: description || '',
      hourlyRate: Number(hourlyRate) || 0,
      address: {
        street: street || '',
        city: city || '',
        state: state || '',
        pincode: pincode || ''
      },
      availability: {
        weekdays: {
          start: weekdayStart || '09:00',
          end: weekdayEnd || '18:00'
        }
      },
      verificationStatus: 'pending',
      isVerified: false
    };

    await user.save();
    
    res.redirect('/provider/dashboard?success=Provider registration submitted!');
    
  } catch (error) {
    console.error('Provider registration error:', error);
    res.status(500).send('Error submitting provider application');
  }
});

// ===== PROVIDER DASHBOARD =====
router.get('/provider/dashboard', isLoggedIn, isProvider, async function(req, res) {
  try {
    const user = await User.findById(req.session.userId);
    
    // Get provider's bookings
    const bookings = await Booking.find({ providerId: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.render('Provider/dashboard', {
      user: user,
      bookings: bookings,
      provider: user.providerProfile
    });
    
  } catch (error) {
    console.error('Provider dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

module.exports = router;