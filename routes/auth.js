const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');


// ============================================
// ===== SIGNUP PAGE =====
// ============================================
router.get('/signup', function(req, res, next) {
  res.render('User/signup');
});

// ============================================
// ===== SIGNUP SUBMIT =====
router.post('/signup', async(req, res, next) => {  // ✅ next added
  try {
    const { name, email, phone, role, password } = req.body;
    const newUser = {
      name: name,
      email: email,
      phone: phone,
      role: role || 'customer'  // ✅ सही role
    };

    
    console.log(newUser);
    let newRegister = await User.register(newUser, password);
    console.log(newRegister);
    
    req.login(newRegister, (err) => {
      if(err) {
        return next(err);
      } else {
        req.flash('success_msg', 'You have successfully registered!');
        return res.redirect('/');
      }
    });
  } catch(err) {
    console.error('Signup error:', err);  // ✅ debugging के लिए
    req.flash('error_msg', err.message);  // ✅ सही error message
    res.redirect('/signup');
  }
});

// ============================================
// ===== LOGIN PAGE =====
// ============================================
router.get('/login', function(req, res, next) {
  res.render('User/login');
});

// ============================================
// ===== LOGIN SUBMIT =====
// ============================================

// routes/user.js
router.post("/login", (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error_msg', info.message || 'Invalid email or password');
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      console.log('User logged in:', user.email, 'Role:', user.role); // Debug
      req.flash('success_msg', 'You have successfully logged in!');
      
      // ✅ Redirect based on role
      if (user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
      return res.redirect('/');
    });
  })(req, res, next);
});



// ============================================
// ===== LOGOUT =====
// ============================================
router.get('/logout', function(req, res) {
  req.logout(function(err) {
    if (err) {
      console.error('Logout error:', err);
      req.flash('error_msg', 'Logout failed');
      return res.redirect('/');
    }
    req.flash('error_msg', 'You have been logged out successfully');
    res.redirect('/');
  });
});

module.exports = router;