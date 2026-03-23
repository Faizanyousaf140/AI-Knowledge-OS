require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/auth/auth.model');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await User.updateMany({ interests: { $exists: false } }, { $set: { interests: [] } });
  console.log('Migration result:', res.nModified || res.modifiedCount || res);
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
