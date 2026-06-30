require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const flash = require('connect-flash');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // ✅ Fixed import
const methodOverride = require('method-override');

const engine = require('ejs-mate');
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");

const app = express();
const port = process.env.PORT || 3000;

// ===== MODELS =====
const User = require('./models/user');
const Category = require('./models/category');
const Booking = require('./models/booking');
const Cart = require('./models/cart');

// ===== MIDDLEWARE =====
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ===== DATABASE =====
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ringForHelpCompany';
const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret';

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000
})
  .then(function() {
    console.log('✅ Database connected successfully');
  })
  .catch(function(err) {
    console.log('❌ Database connection error:', err);
  });

const store = MongoStore.create({
  mongoUrl: mongoUri,
  crypto: {
    secret: sessionSecret
  },
  touchAfter: 24 * 3600
});

store.on('error', function(err) {
  console.log('error in mongoStore', err);
});

// ===== SESSION =====
app.use(session({
  store: store,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

// ===== FLASH MIDDLEWARE =====
app.use(flash());

// ===== PASSPORT INITIALIZATION =====
app.use(passport.initialize());
app.use(passport.session());

// ===== PASSPORT CONFIGURATION =====
// ✅ Fixed: Use User.authenticate() from passport-local-mongoose with email field
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ===== AUTH MIDDLEWARE =====
app.use(async function(req, res, next) {
  // ✅ Fixed: Use req.user instead of req.session.userId
  if (req.user) {
    res.locals.currUser = req.user;
  } else {
    res.locals.currUser = null;
  }
  next();
});

// ===== FLASH MESSAGES - GLOBAL VARIABLES =====
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// ============================================
// ===== HOME ROUTE =====
// ============================================
app.get('/', async function(req, res) {
  try {
    const categories = await Category.find({});
    console.log('📦 Categories found:', categories.length);
    res.render('Home/home', { categories: categories });
  } catch (error) {
    console.error('Home page error:', error);
    req.flash('error_msg', 'Error loading home page');
    res.status(500).send('Error loading home page');
  }
});


app.get("/demoUser", async(req, res)=> {
  let newUser =  {
    name: "Demo",
    email: "demo@gmail.com",
    phone: "707003123",
    role: "costomer"
  };
 
  let registeredUser = await User.register(newUser, "helloworld");
  res.send(registeredUser);

})
// ============================================
// ===== ROUTES =====
// ============================================
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

const hireRoutes = require('./routes/hire');
app.use('/', hireRoutes);

// ===== VIEW PROFILE =====
app.get('/profile', async function(req, res) {
  try {
    if (!req.user) {
      req.flash('error_msg', 'Please login first');
      return res.redirect('/login');
    }
    
    const user = await User.findById(req.user._id);
    const bookings = await Booking.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.render('User/profile', {
      user: user,
      bookings: bookings,
      title: 'My Profile'
    });
    
  } catch (error) {
    console.error('❌ Profile page error:', error);
    res.status(500).send('Error loading profile');
  }
});

const providerRoutes = require('./routes/provider');
app.use('/', providerRoutes);

const servicesRoutes = require('./routes/services');
app.use('/', servicesRoutes);

const cartRoutes = require('./routes/cart');
app.use('/', cartRoutes);

const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);

// ============================================
// ===== ERROR HANDLING =====
// ============================================
// ✅ Catch all undefined routes (404)
app.all('/*splat', (req, res, next) => {
  next(new ExpressError(404, "Page not found"));
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong!" } = err;
  res.status(status).render("includes/error.ejs", { err });
});

// ============================================
// ===== START SERVER =====
// ============================================
app.listen(port, function() {
  console.log('✅ Server is running on http://localhost:' + port);
});