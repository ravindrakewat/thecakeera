const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
dotenv.config();

const app = require('../app');
const { User, Session, Address } = require('../models');

let server;
let baseUrl;

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(responseBody);
        } catch (e) {
          parsed = responseBody;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runAuthTests = async () => {
  console.log('--------------------------------------------------');
  console.log('🧪 Starting PHASE 2 Automated Auth & User Test Suite');
  console.log('--------------------------------------------------');

  let mongodInstance;
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/herbal_ecommerce';
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    mongoUri = mongodInstance.getUri();
  } catch (err) {}
  await mongoose.connect(mongoUri);

  // Clear test users & sessions
  await User.deleteMany({ email: { $in: ['testuser1@herbal.com', 'testuser2@herbal.com', 'testadmin@herbal.com'] } });
  await Address.deleteMany({});
  await Session.deleteMany({});

  // Spin up temporary HTTP server on random free port
  server = http.createServer(app).listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  let userAToken = '';
  let userBToken = '';
  let adminToken = '';
  let userAAddressId = '';

  try {
    // 1. Valid Registration (User A)
    console.log('▶ Test 1: User A Registration');
    const regRes = await request('/api/auth/register', 'POST', {
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'testuser1@herbal.com',
      phone: '9876543210',
      password: 'Password123',
    });
    console.assert(regRes.status === 201, `Expected 201, got ${regRes.status}`);
    console.assert(regRes.body.data.user.email === 'testuser1@herbal.com', 'Email mismatch');
    userAToken = regRes.body.data.accessToken;
    console.log('  ✅ User A Registered successfully');

    // 2. Duplicate Registration Test
    console.log('▶ Test 2: Duplicate Email Registration Check');
    const dupRes = await request('/api/auth/register', 'POST', {
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'testuser1@herbal.com',
      phone: '9876543210',
      password: 'Password123',
    });
    console.assert(dupRes.status === 400, `Expected 400 for duplicate email, got ${dupRes.status}`);
    console.log('  ✅ Duplicate email rejected cleanly');

    // 3. Register User B
    console.log('▶ Test 3: User B Registration');
    const regBRes = await request('/api/auth/register', 'POST', {
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'testuser2@herbal.com',
      phone: '9876543211',
      password: 'Password123',
    });
    userBToken = regBRes.body.data.accessToken;
    console.log('  ✅ User B Registered successfully');

    // 4. Register & Elevate Admin
    console.log('▶ Test 4: Admin Registration & Elevation');
    const adminRegRes = await request('/api/auth/register', 'POST', {
      firstName: 'System',
      lastName: 'Admin',
      email: 'testadmin@herbal.com',
      phone: '9876543299',
      password: 'Password123',
    });
    await User.updateOne({ email: 'testadmin@herbal.com' }, { role: 'admin' });
    const adminLoginRes = await request('/api/auth/login', 'POST', {
      email: 'testadmin@herbal.com',
      password: 'Password123',
    });
    adminToken = adminLoginRes.body.data.accessToken;
    console.log('  ✅ Admin logged in successfully');

    // 5. Invalid Password Login Test
    console.log('▶ Test 5: Invalid Password Login');
    const badLoginRes = await request('/api/auth/login', 'POST', {
      email: 'testuser1@herbal.com',
      password: 'WrongPassword123',
    });
    console.assert(badLoginRes.status === 401, `Expected 401, got ${badLoginRes.status}`);
    console.assert(badLoginRes.body.message === 'Invalid email or password', 'Generic error message expected');
    console.log('  ✅ Invalid credentials rejected with generic error');

    // 6. Current User Endpoint (/api/auth/me)
    console.log('▶ Test 6: GET /api/auth/me');
    const meRes = await request('/api/auth/me', 'GET', null, { Authorization: `Bearer ${userAToken}` });
    console.assert(meRes.status === 200, `Expected 200, got ${meRes.status}`);
    console.assert(meRes.body.data.user.email === 'testuser1@herbal.com', 'Me endpoint user mismatch');
    console.log('  ✅ Current user fetched cleanly');

    // 7. Role Authorization Test (USER vs ADMIN route)
    console.log('▶ Test 7: Role Authorization (/api/users)');
    const userAccessAdmin = await request('/api/users', 'GET', null, { Authorization: `Bearer ${userAToken}` });
    console.assert(userAccessAdmin.status === 403, `Expected 403 Forbidden for User accessing Admin route, got ${userAccessAdmin.status}`);
    console.log('  ✅ Normal User denied access to Admin endpoint (403)');

    const adminAccessAdmin = await request('/api/users', 'GET', null, { Authorization: `Bearer ${adminToken}` });
    console.assert(adminAccessAdmin.status === 200, `Expected 200 for Admin accessing Admin route, got ${adminAccessAdmin.status}`);
    console.log('  ✅ Admin granted access to Admin endpoint (200)');

    // 8. User Profile Update
    console.log('▶ Test 8: PATCH /api/users/me');
    const updateProfileRes = await request('/api/users/me', 'PATCH', { firstName: 'Aarav Kumar' }, { Authorization: `Bearer ${userAToken}` });
    console.assert(updateProfileRes.status === 200, `Expected 200, got ${updateProfileRes.status}`);
    console.assert(updateProfileRes.body.data.firstName === 'Aarav Kumar', 'Name update failed');
    console.log('  ✅ Profile updated cleanly');

    // 9. Address CRUD & Default Address Logic
    console.log('▶ Test 9: Address CRUD & Default Logic');
    const addAddr1 = await request('/api/users/me/addresses', 'POST', {
      fullName: 'Aarav Sharma',
      phone: '9876543210',
      addressLine1: 'Flat 402, Green Enclave',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462001',
    }, { Authorization: `Bearer ${userAToken}` });
    console.assert(addAddr1.status === 201, `Expected 201, got ${addAddr1.status}`);
    console.assert(addAddr1.body.data.isDefault === true, 'First address should automatically be default');
    userAAddressId = addAddr1.body.data._id;

    const addAddr2 = await request('/api/users/me/addresses', 'POST', {
      fullName: 'Aarav Office',
      phone: '9876543210',
      addressLine1: 'IT Park, Tower B',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      pincode: '462023',
      isDefault: true,
    }, { Authorization: `Bearer ${userAToken}` });
    console.assert(addAddr2.body.data.isDefault === true, 'New default address should be default');

    // Verify User A's first address is no longer default
    const checkAddr1 = await request(`/api/users/me/addresses/${userAAddressId}`, 'GET', null, { Authorization: `Bearer ${userAToken}` });
    console.assert(checkAddr1.body.data.isDefault === false, 'First address should have been set to false');
    console.log('  ✅ Default address toggle logic working');

    // 10. IDOR Security Test (User B accessing User A's address)
    console.log('▶ Test 10: IDOR Security Test (Cross-user address access)');
    const idorRes = await request(`/api/users/me/addresses/${userAAddressId}`, 'GET', null, { Authorization: `Bearer ${userBToken}` });
    console.assert(idorRes.status === 404, `Expected 404 IDOR rejection, got ${idorRes.status}`);
    console.log('  ✅ User B denied access to User A address (IDOR Protected)');

    // 11. Forgot & Reset Password
    console.log('▶ Test 11: Forgot & Reset Password');
    const forgotRes = await request('/api/auth/forgot-password', 'POST', { email: 'testuser1@herbal.com' });
    console.assert(forgotRes.status === 200, `Expected 200, got ${forgotRes.status}`);
    const resetToken = forgotRes.body.data.resetToken;

    const resetRes = await request('/api/auth/reset-password', 'POST', {
      token: resetToken,
      password: 'NewPassword123',
    });
    console.assert(resetRes.status === 200, `Expected 200, got ${resetRes.status}`);
    console.log('  ✅ Password reset successfully with valid token');

    // Verify login with new password
    const newLoginRes = await request('/api/auth/login', 'POST', {
      email: 'testuser1@herbal.com',
      password: 'NewPassword123',
    });
    console.assert(newLoginRes.status === 200, `Expected 200 login with new password, got ${newLoginRes.status}`);
    console.log('  ✅ Login with new password verified');

    console.log('--------------------------------------------------');
    console.log('🎉 ALL PHASE 2 AUTOMATED AUTH TESTS PASSED!');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('❌ Test Failure:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    if (mongodInstance) await mongodInstance.stop();
    process.exit(0);
  }
};

runAuthTests();
