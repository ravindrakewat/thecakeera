const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { User } = require('../models');

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];
  const firstName = args[2] || 'Store';
  const lastName = args[3] || 'Admin';

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is not defined in server/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('⚡ Connected to MongoDB.');

    if (!email) {
      console.log('\n======================================================');
      console.log('📌 CURRENT ADMIN USERS IN DATABASE:');
      console.log('======================================================');
      const admins = await User.find({ role: 'admin' }).select('firstName lastName email role createdAt').lean();
      if (admins.length === 0) {
        console.log('No admin users found.');
      } else {
        admins.forEach((a, idx) => {
          console.log(`${idx + 1}. ${a.firstName} ${a.lastName} | Email: ${a.email} | Role: ${a.role}`);
        });
      }
      console.log('\n💡 USAGE TO CREATE OR PROMOTE AN ADMIN:');
      console.log('   node src/utils/createAdmin.js <email> <password> [firstName] [lastName]');
      console.log('\nExample:');
      console.log('   node src/utils/createAdmin.js myadmin@herbal.com MyPassword123 "Vikram" "Singh"\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      console.log(`\n🔍 User found with email: ${normalizedEmail}`);
      user.role = 'admin';
      if (password) {
        user.password = password; // pre-save hook will hash it automatically
      }
      if (firstName) user.firstName = firstName.trim();
      if (lastName) user.lastName = lastName.trim();
      user.isVerified = true;
      await user.save();
      console.log(`✅ User "${normalizedEmail}" has been PROMOTED to ADMIN successfully!`);
    } else {
      if (!password) {
        console.error('❌ Error: Password is required to create a new admin account.');
        console.log('Usage: node src/utils/createAdmin.js <email> <password> [firstName] [lastName]');
        process.exit(1);
      }
      user = await User.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: normalizedEmail,
        password, // pre-save hook will hash it
        role: 'admin',
        phone: '9876543210',
        isVerified: true,
      });
      console.log(`\n🎉 New ADMIN user created successfully!`);
    }

    console.log('------------------------------------------------------');
    console.log(`Name:     ${user.firstName} ${user.lastName}`);
    console.log(`Email:    ${user.email}`);
    console.log(`Role:     ${user.role}`);
    console.log('------------------------------------------------------');
    console.log(`👉 You can now log in at http://localhost:5173/login\n`);

  } catch (err) {
    console.error('❌ Failed to create/update admin user:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
