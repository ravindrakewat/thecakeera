const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const Product = require('../models/Product');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await Product.updateMany({ isActive: true }, { $set: { isFeatured: true } });
  console.log('Successfully set isFeatured=true on products:', res.modifiedCount);
  await mongoose.disconnect();
}

run();
