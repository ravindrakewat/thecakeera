const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');
dotenv.config();

process.env.NODE_ENV = 'test';

const app = require('../app');
const { User, Session, Category, Product } = require('../models');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/authUtils');

const makeRequest = (server, options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json || data,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runRegressionSuite = async () => {
  console.log('====================================================');
  console.log('🧪 Focused Regression Tests: Auth 401 & Shop Catalog');
  console.log('====================================================');

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;

  let passed = 0;
  const total = 7;

  try {
    // Seed sample category and product
    const category = await Category.create({
      name: 'Herbal Infusions',
      slug: 'herbal-infusions',
      description: 'Organic wellness herbal infusions',
      isActive: true,
    });

    await Product.create({
      name: 'Ashwagandha Elixir',
      slug: 'ashwagandha-elixir',
      description: 'Pure Himalayan Ashwagandha organic restorative elixir',
      category: category._id,
      mrp: 699,
      sellingPrice: 499,
      costPrice: 200,
      stock: 50,
      sku: 'ASH-ELX-001',
      isActive: true,
    });

    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      email: 'regression@herbal.com',
      phone: '9876543210',
      password: 'HashedPassword123!',
      role: 'user',
      isActive: true,
    });

    // 1. Shop Catalog from localhost:5173
    console.log('\n▶ Test 1: GET /api/products accepts Origin http://localhost:5173');
    const resLocalhost = await makeRequest(testServer, {
      hostname: '127.0.0.1',
      port,
      path: '/api/products?page=1&limit=12',
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });
    if (resLocalhost.statusCode === 200 && resLocalhost.body.success && resLocalhost.body.data.length >= 1) {
      console.log('  ✅ Origin http://localhost:5173 receives 200 OK with product catalog.');
      passed++;
    } else {
      throw new Error(`Failed with status ${resLocalhost.statusCode}: ${JSON.stringify(resLocalhost.body)}`);
    }

    // 2. Shop Catalog from 127.0.0.1:5173
    console.log('\n▶ Test 2: GET /api/products accepts Origin http://127.0.0.1:5173');
    const resLoopback = await makeRequest(testServer, {
      hostname: '127.0.0.1',
      port,
      path: '/api/products?page=1&limit=12',
      method: 'GET',
      headers: { Origin: 'http://127.0.0.1:5173' },
    });
    if (resLoopback.statusCode === 200 && resLoopback.body.success && resLoopback.body.data.length >= 1) {
      console.log('  ✅ Origin http://127.0.0.1:5173 receives 200 OK with product catalog.');
      passed++;
    } else {
      throw new Error(`Failed with status ${resLoopback.statusCode}: ${JSON.stringify(resLoopback.body)}`);
    }

    // 3. CORS blocks unauthorized external origin
    console.log('\n▶ Test 3: CORS blocks unauthorized origin');
    const resBlocked = await makeRequest(testServer, {
      hostname: '127.0.0.1',
      port,
      path: '/api/products?page=1&limit=12',
      method: 'GET',
      headers: { Origin: 'http://unauthorized-origin.com' },
    });
    if (resBlocked.statusCode === 500 && JSON.stringify(resBlocked.body).includes('CORS: Origin')) {
      console.log('  ✅ Unauthorized origin correctly blocked by CORS.');
      passed++;
    } else {
      throw new Error(`Expected CORS block, got status ${resBlocked.statusCode}`);
    }

    // 4. GET /api/auth/me without token returns 401 with safe message
    console.log('\n▶ Test 4: Unauthenticated GET /api/auth/me returns 401');
    const resMeGuest = await makeRequest(testServer, {
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });
    if (resMeGuest.statusCode === 401 && resMeGuest.body.message === 'Authentication token required') {
      console.log('  ✅ Guest GET /api/auth/me safely returns 401: Authentication token required.');
      passed++;
    } else {
      throw new Error(`Expected 401, got ${resMeGuest.statusCode}`);
    }

    // 5. POST /api/auth/refresh without cookie returns 401 with safe message
    console.log('\n▶ Test 5: Guest POST /api/auth/refresh returns 401');
    const resRefreshGuest = await makeRequest(testServer, {
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/refresh',
      method: 'POST',
      headers: {
        Origin: 'http://localhost:5173',
        'Content-Type': 'application/json',
      },
    });
    if (resRefreshGuest.statusCode === 401 && resRefreshGuest.body.message === 'Refresh token missing') {
      console.log('  ✅ Guest POST /api/auth/refresh safely returns 401: Refresh token missing.');
      passed++;
    } else {
      throw new Error(`Expected 401, got ${resRefreshGuest.statusCode}`);
    }

    // 6. Valid token accesses /api/auth/me
    console.log('\n▶ Test 6: Authenticated user accesses /api/auth/me with Bearer token');
    const validAccessToken = generateAccessToken(testUser);
    const resMeAuth = await makeRequest(testServer, {
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173',
        Authorization: `Bearer ${validAccessToken}`,
      },
    });
    if (resMeAuth.statusCode === 200 && resMeAuth.body.data.user.email === testUser.email) {
      console.log('  ✅ Authenticated GET /api/auth/me returns 200 OK with correct user profile.');
      passed++;
    } else {
      throw new Error(`Expected 200, got ${resMeAuth.statusCode}`);
    }

    // 7. Atomic refresh with valid cookie
    console.log('\n▶ Test 7: Valid refresh token cookie rotates atomically');
    const rawRefresh = generateRefreshToken();
    const tokenHash = hashToken(rawRefresh);
    await Session.create({
      user: testUser._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
    });

    const resRefreshValid = await makeRequest(testServer, {
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/refresh',
      method: 'POST',
      headers: {
        Origin: 'http://localhost:5173',
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${rawRefresh}`,
      },
    });

    if (
      resRefreshValid.statusCode === 200 &&
      resRefreshValid.body.data?.accessToken &&
      resRefreshValid.headers['set-cookie']
    ) {
      console.log('  ✅ Valid refresh token rotated successfully with new accessToken and Set-Cookie.');
      passed++;
    } else {
      throw new Error(`Refresh failed: ${resRefreshValid.statusCode}`);
    }

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passed}/${total} FOCUSED REGRESSION TESTS PASSED!`);
    console.log('====================================================\n');
  } finally {
    testServer.close();
    await mongoose.disconnect();
    await mongod.stop();
  }
};

runRegressionSuite().catch((err) => {
  console.error('❌ Regression suite failed:', err);
  process.exit(1);
});
