import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

// Helper to safely extract products array from any server response shape
const extractProducts = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data) {
    if (Array.isArray(response.data)) return response.data;
    if (response.data.products && Array.isArray(response.data.products)) {
      return response.data.products;
    }
  }
  if (response.products && Array.isArray(response.products)) {
    return response.products;
  }
  return [];
};

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, authStatus } = useAuth();

  const [guestWishlist, setGuestWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('herbal_guest_wishlist');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [serverWishlist, setServerWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync guest wishlist to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem('herbal_guest_wishlist', JSON.stringify(guestWishlist));
      } catch (e) {
        console.error('Failed to save guest wishlist to localStorage', e);
      }
    }
  }, [guestWishlist, isAuthenticated]);

  const fetchServerWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await wishlistService.getWishlist();
      setServerWishlist(extractProducts(res));
    } catch (err) {
      console.error('Failed to fetch server wishlist', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Handle Login Wishlist Merge
  const handleLoginWishlistMerge = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const savedGuest = localStorage.getItem('herbal_guest_wishlist');
      const guestItems = savedGuest ? JSON.parse(savedGuest) : [];

      if (guestItems && guestItems.length > 0) {
        const productIds = guestItems.map((item) => item?._id || item?.id || item).filter(Boolean);
        const res = await wishlistService.mergeWishlist(productIds);
        setServerWishlist(extractProducts(res));
        localStorage.removeItem('herbal_guest_wishlist');
        setGuestWishlist([]);
      } else {
        await fetchServerWishlist();
      }
    } catch (err) {
      console.error('Failed to merge guest wishlist', err);
      await fetchServerWishlist();
    }
  }, [isAuthenticated, fetchServerWishlist]);

  useEffect(() => {
    if (authStatus === 'AUTHENTICATED') {
      handleLoginWishlistMerge();
    } else if (authStatus === 'UNAUTHENTICATED') {
      setServerWishlist([]);
    }
  }, [authStatus, handleLoginWishlistMerge]);

  const activeWishlist = Array.isArray(isAuthenticated ? serverWishlist : guestWishlist)
    ? (isAuthenticated ? serverWishlist : guestWishlist)
    : [];

  const isInWishlist = useCallback((productId) => {
    if (!productId || !Array.isArray(activeWishlist)) return false;
    const targetId = String(productId);
    return activeWishlist.some((item) => {
      const id = item?._id || item?.id || (typeof item === 'string' ? item : null);
      return id && String(id) === targetId;
    });
  }, [activeWishlist]);

  const toggleWishlist = async (product) => {
    if (!product) return false;
    const productId = product._id || product.id || (typeof product === 'string' ? product : null);
    if (!productId) return false;

    const currentlyInWishlist = isInWishlist(productId);

    if (isAuthenticated) {
      try {
        if (currentlyInWishlist) {
          const res = await wishlistService.removeFromWishlist(productId);
          setServerWishlist(extractProducts(res));
          return false;
        } else {
          const res = await wishlistService.addToWishlist(productId);
          setServerWishlist(extractProducts(res));
          return true;
        }
      } catch (err) {
        console.error('Failed to toggle server wishlist', err);
        return currentlyInWishlist;
      }
    } else {
      if (currentlyInWishlist) {
        setGuestWishlist((prev) => prev.filter((item) => {
          const id = item?._id || item?.id || item;
          return String(id) !== String(productId);
        }));
        return false;
      } else {
        setGuestWishlist((prev) => [...prev, product]);
        return true;
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!productId) return;
    const targetId = String(productId);

    if (isAuthenticated) {
      try {
        const res = await wishlistService.removeFromWishlist(targetId);
        setServerWishlist(extractProducts(res));
      } catch (err) {
        console.error('Failed to remove from server wishlist', err);
      }
    } else {
      setGuestWishlist((prev) => prev.filter((item) => {
        const id = item?._id || item?.id || item;
        return String(id) !== targetId;
      }));
    }
  };

  const clearWishlist = async () => {
    if (isAuthenticated) {
      try {
        const res = await wishlistService.clearWishlist();
        setServerWishlist(extractProducts(res));
      } catch (err) {
        console.error('Failed to clear server wishlist', err);
      }
    } else {
      setGuestWishlist([]);
      localStorage.removeItem('herbal_guest_wishlist');
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist: activeWishlist,
        wishlistItems: activeWishlist,
        wishlistCount: activeWishlist.length,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
