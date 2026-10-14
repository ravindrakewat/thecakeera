# The Cake Era

A modern, production-ready full-stack Bakery & Cake E-Commerce platform built with React, Vite, Node.js, Express, and MongoDB.

## Tech Stack

- **Frontend:** React, Vite, Vanilla CSS Design System, React Router, Axios, Lucide Icons
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, Cookie Parser, Compression, Helmet, Rate Limiter

## Phase 6 Checkout, Orders & Razorpay Architecture

### 1. Security & Price Authority Rules
- **Server-Side Price Authority:** Frontend-submitted prices or totals are completely ignored. Checkout calculation (`/api/orders/preview`), internal order creation (`/api/orders`), and Razorpay order amount (`/api/payment/razorpay/create-order`) fetch current product prices directly from the MongoDB `Product` model.
- **Razorpay Amount:** Razorpay payment amount is generated server-side in paise (`Math.round(grandTotal * 100)`).
- **HMAC Signature Verification:** Razorpay online payment verification uses HMAC-SHA256 signature verification with `RAZORPAY_KEY_SECRET`. No order is marked as paid based only on frontend success callbacks.
- **Webhook Raw Body & Verification:** Webhook signatures are verified using `x-razorpay-signature` against `RAZORPAY_WEBHOOK_SECRET` with preserved raw request body (`req.rawBody`).
- **IDOR Protection:** Order detail (`GET /api/orders/:orderNumber`), cancellation, and address selection strictly enforce `user: req.user._id` ownership.

### 2. Idempotency & Inventory Strategy
- **Single Stock Deduction:** Inventory is deducted atomically (`$inc: { stockQuantity: -quantity }`) only upon verified payment confirmation or COD order placement.
- **Duplicate Verification / Webhook Prevention:** Webhook events are tracked in `WebhookEvent` model. Payment verification checks if payment/order is already `PAID` before processing.
- **Cart Clearing:** Cart items are cleared post-confirmation without affecting subsequent cart additions.

---

## API Endpoints

### Checkout & Order APIs (`/api/orders`) - Authenticated
* `POST /api/orders/preview` — Calculate checkout summary without creating order (`{ addressId }`)
* `POST /api/orders` — Create order (`{ addressId, paymentMethod: 'COD' }`)
* `GET /api/orders` — Fetch current user's order history (Paginated)
* `GET /api/orders/:orderNumber` — Fetch single order details (Strict IDOR Protected)
* `POST /api/orders/:orderNumber/cancel` — Cancel order & restore inventory (`{ reason }`)

### Razorpay Payment APIs (`/api/payment`)
* `POST /api/payment/razorpay/create-order` — Create Razorpay order & pending internal Order (`{ addressId }`) [Protected]
* `POST /api/payment/razorpay/verify` — Verify Razorpay signature & confirm order (`{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`) [Protected]
* `POST /api/payment/razorpay/webhook` — Process Razorpay webhook events (`payment.captured`, `payment.failed`, `order.paid`) [Public Signature-Authenticated]

### Cart APIs (`/api/cart`) - Authenticated
* `GET /api/cart` - Fetch current user's cart with calculated subtotals
* `POST /api/cart/items` - Add product to cart or increase quantity
* `PATCH /api/cart/items/:productId` - Update item quantity in cart
* `DELETE /api/cart/items/:productId` - Remove item from cart
* `DELETE /api/cart` - Clear authenticated user's cart
* `POST /api/cart/merge` - Merge guest localStorage cart items into server cart

### Wishlist APIs (`/api/wishlist`) - Authenticated
* `GET /api/wishlist` - Fetch current user's wishlist products
* `POST /api/wishlist/items/:productId` - Add product to wishlist (Idempotent)
* `DELETE /api/wishlist/items/:productId` - Remove product from wishlist
* `DELETE /api/wishlist` - Clear authenticated user's wishlist
* `POST /api/wishlist/merge` - Merge guest localStorage wishlist into server wishlist

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or MongoDB Atlas URI)

### Backend Setup
```bash
cd server
npm install
npm run dev
```

### Run Test Suites
```bash
cd server
npm run test:auth     # Phase 2 Auth Tests
npm run test:catalog  # Phase 3 Product & Category Catalog Tests
npm run test:cart     # Phase 5 Cart & Wishlist Tests
npm run test:phase6   # Phase 6 Checkout, Orders & Razorpay Tests
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Environment Variables (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/herbal_ecommerce
JWT_SECRET=herbal_jwt_secret_key_production_2026_super_secure
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
PASSWORD_RESET_EXPIRES_MINUTES=20
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
FREE_SHIPPING_THRESHOLD=999
DEFAULT_SHIPPING_CHARGE=50
```
