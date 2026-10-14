import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AnnouncementBar from './components/layout/AnnouncementBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import PageLoader from './components/common/PageLoader';
import ProtectedRoute from './components/common/ProtectedRoute';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Route-based code splitting for Customer Storefront
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Category = lazy(() => import('./pages/Category'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Route-based code splitting for Admin Panel
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductCreate = lazy(() => import('./pages/admin/AdminProductCreate'));
const AdminProductEdit = lazy(() => import('./pages/admin/AdminProductEdit'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/AdminCustomerDetail'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminShipments = lazy(() => import('./pages/admin/AdminShipments'));
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices'));

function CustomerLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-cream)' }}>
      <AnnouncementBar />
      <Header />
      <main style={{ flex: 1 }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Admin Area (Protected & Separated Layout) */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'ADMIN']}>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductCreate />} />
                    <Route path="products/:id/edit" element={<AdminProductEdit />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:orderNumber" element={<AdminOrderDetail />} />
                    <Route path="shipments" element={<AdminShipments />} />
                    <Route path="invoices" element={<AdminInvoices />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="customers/:id" element={<AdminCustomerDetail />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="banners" element={<AdminBanners />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* Customer Storefront Area */}
                  <Route
                    path="*"
                    element={
                      <CustomerLayout>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/category/:slug" element={<Category />} />
                          <Route path="/product/:slug" element={<ProductDetails />} />
                          <Route path="/product/:id" element={<ProductDetails />} />
                          <Route path="/search" element={<SearchResults />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />

                          <Route
                            path="/checkout"
                            element={
                              <ProtectedRoute>
                                <Checkout />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/order-success/:orderNumber"
                            element={
                              <ProtectedRoute>
                                <OrderSuccess />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/payment-failed"
                            element={
                              <ProtectedRoute>
                                <PaymentFailed />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/profile"
                            element={
                              <ProtectedRoute>
                                <Profile />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/orders"
                            element={
                              <ProtectedRoute>
                                <OrderHistory />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/orders/:orderNumber"
                            element={
                              <ProtectedRoute>
                                <OrderDetail />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/notifications"
                            element={
                              <ProtectedRoute>
                                <Notifications />
                              </ProtectedRoute>
                            }
                          />

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </CustomerLayout>
                    }
                  />
                </Routes>
              </Suspense>
              <Toast />
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
