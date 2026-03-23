require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/modules/auth/auth.model');

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  let existing = await User.findOne({ email: 'admin@aios.com' });
  if (existing) {
    // Update password to known value (will be hashed by pre-save hook)
    existing.password = 'admin123';
    existing.role = 'admin';
    await existing.save();
    console.log('Admin user updated with default password');
    process.exit(0);
  }

  // Create new admin (store plain password; model pre-save will hash it)
  const admin = new User({
    name: 'Super Admin',
    email: 'admin@aios.com',
    password: 'admin123',
    role: 'admin',
  });

  await admin.save();

  console.log('Admin created');
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Failed to create admin', err);
  process.exit(1);
});
