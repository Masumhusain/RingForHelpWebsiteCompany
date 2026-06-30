// ============================================
// ===== AUTH MIDDLEWARE =====
// ============================================

// ✅ Check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please login first');
  res.redirect('/login');
}

// ✅ Check if user is provider
function isProvider(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'provider') {
    return next();
  }
  req.flash('error_msg', 'Access denied. Provider only.');
  res.redirect('/');
}

// ✅ Check if user is admin
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  req.flash('error_msg', 'Access denied. Admin only.');
  res.redirect('/');
}

module.exports = {
  isLoggedIn,
  isProvider,
  isAdmin
};