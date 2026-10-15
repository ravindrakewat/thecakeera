import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated, authStatus } = useAuth();
  
  const [guestCart, setGuestCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cakeera_guest_cart');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [serverCart, setServerCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync guest cart to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem('cakeera_guest_cart', JSON.stringify(guestCart));
      } catch (e) {
        console.error('Failed to save guest cart to localStorage', e);
      }
    }
  }, [guestCart, isAuthenticated]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Fetch server cart for authenticated users
  const fetchServerCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await cartService.getCart();
      if (res.data) {
        setServerCart(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch server cart', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Handle Login Cart Merge
  const handleLoginCartMerge = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const savedGuest = localStorage.getItem('cakeera_guest_cart');
      const guestItems = savedGuest ? JSON.parse(savedGuest) : [];

      if (guestItems && guestItems.length > 0) {
        const payload = guestItems.map((item) => ({
          productId: item.product,
          quantity: item.quantity,
        }));

        const res = await cartService.mergeCart(payload);
        setServerCart(res.data);
        localStorage.removeItem('cakeera_guest_cart');
        setGuestCart([]);
        showToast('Guest cart merged with your account!');
      } else {
        await fetchServerCart();
      }
    } catch (err) {
      console.error('Failed to merge guest cart', err);
      await fetchServerCart();
    }
  }, [isAuthenticated, fetchServerCart]);

  useEffect(() => {
    if (authStatus === 'AUTHENTICATED') {
      handleLoginCartMerge();
    } else if (authStatus === 'UNAUTHENTICATED') {
      setServerCart({ items: [], subtotal: 0, itemCount: 0 });
    }
  }, [authStatus, handleLoginCartMerge]);

  // Add to Cart
  const addToCart = async (product, quantity = 1) => {
    const productId = product._id || product.id;

    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await cartService.addToCart(productId, quantity);
        setServerCart(res.data);
        showToast(`Added "${product.name}" to your cart`);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to add item to cart');
      } finally {
        setLoading(false);
      }
    } else {
      // Guest localStorage cart
      setGuestCart((prev) => {
        const idx = prev.findIndex((i) => i.product === productId);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx].quantity += quantity;
          return updated;
        }
        const sellingPrice = product.sellingPrice || product.price || 0;
        const mrp = product.mrp || product.originalPrice || sellingPrice;
        return [
          ...prev,
          {
            product: productId,
            name: product.name,
            slug: product.slug,
            price: sellingPrice,
            mrp,
            image: product.thumbnail || product.images?.[0]?.url || '',
            quantity,
            stockStatus: product.stockStatus || 'IN_STOCK',
          },
        ];
      });
      showToast(`Added "${product.name}" to your cart`);
    }
  };

  // Update Item Quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await cartService.updateCartItem(productId, newQuantity);
        setServerCart(res.data);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to update quantity');
      } finally {
        setLoading(false);
      }
    } else {
      setGuestCart((prev) =>
        prev.map((item) => (item.product === productId ? { ...item, quantity: newQuantity } : item))
      );
    }
  };

  // Remove Item from Cart
  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await cartService.removeCartItem(productId);
        setServerCart(res.data);
        showToast('Item removed from cart');
      } catch (err) {
        showToast('Failed to remove item');
      } finally {
        setLoading(false);
      }
    } else {
      const itemToRemove = guestCart.find((i) => i.product === productId);
      setGuestCart((prev) => prev.filter((i) => i.product !== productId));
      if (itemToRemove) showToast(`Removed "${itemToRemove.name}" from cart`);
    }
  };

  // Clear Cart
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await cartService.clearCart();
        setServerCart(res.data);
        showToast('Cart cleared');
      } catch (err) {
        showToast('Failed to clear cart');
      } finally {
        setLoading(false);
      }
    } else {
      setGuestCart([]);
      localStorage.removeItem('cakeera_guest_cart');
      showToast('Cart cleared');
    }
  };

  // Formatted items & subtotals
  const safeGuestCart = Array.isArray(guestCart) ? guestCart : [];
  const safeServerItems = Array.isArray(serverCart?.items) ? serverCart.items : [];

  const activeItems = isAuthenticated
    ? safeServerItems.map((i) => ({
        product: i.product?._id || i.product,
        name: i.product?.name || 'Bakery Product',
        slug: i.product?.slug || '',
        price: i.product?.sellingPrice || i.price || 0,
        mrp: i.product?.mrp || i.mrp || 0,
        image: i.product?.thumbnail || i.product?.images?.[0]?.url || '',
        quantity: i.quantity || 1,
        stockStatus: i.product?.stockStatus || 'IN_STOCK',
      }))
    : safeGuestCart;

  const cartCount = isAuthenticated
    ? (serverCart?.itemCount || 0)
    : safeGuestCart.reduce((acc, item) => acc + (item.quantity || 0), 0);

  const cartSubtotal = isAuthenticated
    ? (serverCart?.subtotal || 0)
    : safeGuestCart.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems: activeItems,
        cartCount,
        cartSubtotal,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
