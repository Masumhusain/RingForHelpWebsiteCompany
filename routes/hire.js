// routes/hire.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const { isLoggedIn } = require('../middleware/auth');

// ===== MULTER SETUP FOR FILE UPLOAD =====
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = 'public/uploads/documents/';
    // Create folder if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = function(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// ===== GET HIRED PAGE =====
router.get('/get-hired', isLoggedIn, async function(req, res) {
  try {
    // ✅ req.user use करें, req.session.userId नहीं
    const user = await User.findById(req.user._id);
    
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/login');
    }
    
    // If already provider, redirect to dashboard
    if (user.role === 'provider') {
      req.flash('info_msg', 'You are already a provider!');
      return res.redirect('/provider/dashboard');
    }
    
    res.render('hire/get-hired', {
      user: user,
      title: 'Get Hired - Become a Service Provider'
    });
    
  } catch (error) {
    console.error('Get hired page error:', error);
    req.flash('error_msg', 'Error loading page');
    res.redirect('/');
  }
});

// ===== SUBMIT HIRE APPLICATION =====
router.post('/get-hired', isLoggedIn, upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 },
  { name: 'certificate', maxCount: 5 }
]), async function(req, res) {
  try {
    console.log('📝 Application received');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

    const {
      companyName,
      businessType,
      description,
      hourlyRate,
      minimumCharge,
      serviceRadius,
      street,
      city,
      state,
      pincode,
      experience,
      specialization,
      weekdayStart,
      weekdayEnd,
      saturdayStart,
      saturdayEnd,
      sundayStart,
      sundayEnd,
      accountNumber,
      ifscCode,
      accountHolderName,
      bankName,
      upiId
    } = req.body;

    // ✅ req.user use करें
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/get-hired');
    }

    // Check if already provider
    if (user.role === 'provider') {
      req.flash('info_msg', 'You are already a provider!');
      return res.redirect('/provider/dashboard');
    }

    // ===== PROCESS DOCUMENTS =====
    const documents = [];
    
    if (req.files && req.files.aadhar && req.files.aadhar[0]) {
      documents.push({
        name: 'Aadhar Card',
        type: 'aadhar',
        url: '/uploads/documents/' + req.files.aadhar[0].filename,
        verified: false,
        uploadedAt: new Date()
      });
    }
    
    if (req.files && req.files.pan && req.files.pan[0]) {
      documents.push({
        name: 'PAN Card',
        type: 'pan',
        url: '/uploads/documents/' + req.files.pan[0].filename,
        verified: false,
        uploadedAt: new Date()
      });
    }
    
    if (req.files && req.files.certificate) {
      req.files.certificate.forEach(function(file) {
        documents.push({
          name: 'Certificate',
          type: 'certificate',
          url: '/uploads/documents/' + file.filename,
          verified: false,
          uploadedAt: new Date()
        });
      });
    }

    // ===== PROFILE IMAGE =====
    let profileImage = '';
    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      profileImage = '/uploads/documents/' + req.files.profileImage[0].filename;
    }

    // ===== UPDATE USER =====
    user.role = 'provider';
    user.providerProfile = {
      companyName: companyName || user.name || '',
      businessType: businessType || 'individual',
      description: description || '',
      hourlyRate: Number(hourlyRate) || 0,
      minimumCharge: Number(minimumCharge) || Number(hourlyRate) || 0,
      serviceRadius: Number(serviceRadius) || 10,
      experience: experience || '',
      specialization: specialization || '',
      address: {
        street: street || '',
        city: city || '',
        state: state || '',
        pincode: pincode || ''
      },
      documents: documents,
      bankDetails: {
        accountNumber: accountNumber || '',
        ifscCode: ifscCode || '',
        accountHolderName: accountHolderName || user.name || '',
        bankName: bankName || '',
        upiId: upiId || ''
      },
      availability: {
        weekdays: {
          start: weekdayStart || '09:00',
          end: weekdayEnd || '18:00'
        },
        saturday: {
          start: saturdayStart || '10:00',
          end: saturdayEnd || '16:00'
        },
        sunday: {
          start: sundayStart || '',
          end: sundayEnd || ''
        }
      },
      profileImage: profileImage,
      verificationStatus: 'pending',
      isVerified: false,
      appliedAt: new Date()
    };

    await user.save();
    console.log('✅ Provider profile created for:', user.email);

    req.flash('success_msg', 'Your application has been submitted successfully!');
    res.redirect('/get-hired/success');

  } catch (error) {
    console.error('❌ Hire application error:', error);
    req.flash('error_msg', 'Error submitting application: ' + error.message);
    res.redirect('/get-hired');
  }
});

// ===== SUCCESS PAGE =====
router.get('/get-hired/success', isLoggedIn, function(req, res) {
  res.render('hire/success', {
    user: req.user,
    title: 'Application Submitted!'
  });
});

module.exports = router;