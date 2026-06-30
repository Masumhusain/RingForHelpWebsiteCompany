// create-admin.js
const mongoose = require('mongoose');
const User = require('./models/user'); // ✅ अपना User model import करें

async function createAdmin() {
  try {
    await mongoose.connect('mongodb+srv://codedreamz1_db_user:VeA8JTOhjiQhzVSd@cluster0.gelj4e3.mongodb.net/?appName=Cluster0');
    console.log('✅ Database connected');

    // Delete existing admin
    await User.deleteOne({ email: 'admin@ring4help.com' });
    console.log('🗑️ Existing admin deleted');

    // ✅ Passport ke register method se admin create करें
    const adminData = {
      name: 'Admin',
      email: 'admin@ring4help.com',
      phone: '7004297975',
      role: 'admin',
      isActive: true
    };

    const newAdmin = await User.register(adminData, 'aftab123');
    console.log('✅ Admin created successfully!');
    console.log('📧 Email: admin@ring4help.com');
    console.log('🔑 Password: aftab123');
    
    process.exit();
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit();
  }
}

createAdmin();