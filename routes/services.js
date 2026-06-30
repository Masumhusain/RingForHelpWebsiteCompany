// routes/services.js
const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const { isLoggedIn , isAdmin} = require('../middleware/auth');

// ===== WRAP ASYNC HELPER =====
const WrapAsync = function(fn) {
  return function(req, res, next) {
    fn(req, res, next).catch(next);
  };
};

// ===== HOME PAGE =====
router.get('/', WrapAsync(async function(req, res) {
  const categories = await Category.find({});
  res.render('Home/home.ejs', { categories });
}));

// ===== ALL SERVICES =====
router.get('/services',isLoggedIn, WrapAsync(async function(req, res) {
  const services = await Category.find({});
  res.render('Services/services', { services });
}));

// ===== CATEGORY SPECIFIC SERVICES =====
router.get('/category/:slug', isLoggedIn, WrapAsync(async function(req, res) {
  const { slug } = req.params;
  const category = await Category.findOne({ slug });
  
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  
  res.render('Services/showSpecificService', { category });
}));

// ===== SERVICE DETAIL =====
router.get('/service/:categorySlug/:serviceSlug',isLoggedIn, WrapAsync(async function(req, res) {
  const { categorySlug, serviceSlug } = req.params;
  
  const category = await Category.findOne({ slug: categorySlug });
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  
  const service = category.items.find(function(item) {
    return item.slug === serviceSlug;
  });
  
  if (!service) {
    const err = new Error('Service not found');
    err.status = 404;
    throw err;
  }
  
  res.render('Services/serviceDetail', {
    categorySlug: categorySlug,
    service: service
  });
}));

// ===== ADD CATEGORY PAGE =====
router.get('/addCategory', isLoggedIn, isAdmin, function(req, res) {
  res.render('Services/createService');
});

// ===== ADD CATEGORY SUBMIT =====
router.post('/addCategory' , WrapAsync(async function(req, res) {
  const { categoryName, categorySlug, items } = req.body;

  if (!categoryName || !categorySlug) {
    const err = new Error('Category name and slug are required');
    err.status = 400;
    throw err;
  }

  // Process items
  let processedItems = Array.isArray(items) ? items : Object.values(items);
  const mappedItems = processedItems.map(function(item) {
    return {
      name: item.name,
      slug: item.slug || item.name.toLowerCase().replace(/\s+/g, "-"),
      image: item.image,
      sub: item.sub || 0,
      renew: item.renew || 0,
      nonContract: item.nonContract || "20%",
      contract: item.contract || "12"
    };
  });

  // Check if category exists
  let category = await Category.findOne({ categoryName });
  
  if (category) {
    // Add new items to existing category
    const existingSlugs = category.items.map(function(i) { 
      return i.slug; 
    });
    
    const newItems = mappedItems.filter(function(i) {
      return !existingSlugs.includes(i.slug);
    });
    
    category.items.push.apply(category.items, newItems);
  } else {
    // Create new category
    category = new Category({
      categoryName: categoryName,
      slug: categorySlug,
      items: mappedItems
    });
  }

  await category.save();
  res.redirect('/category/' + category.slug);
}));

// ===== ABOUT =====
router.get('/about',isLoggedIn, WrapAsync(async function(req, res) {
  const categories = await Category.find({});
  res.render('About/about', { categories });
}));

// ===== CONNECT =====
router.get('/connect', WrapAsync(async function(req, res) {
  const categories = await Category.find({});
  res.render('Connect/connectUs', { categories });
}));

// ===== WEB DEV SERVICES =====
router.get('/webdevServices', function(req, res) {
  res.render('Services/webDev');
});

module.exports = router;