import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import ProductGrid from '../components/product/ProductGrid';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import { Heart } from 'lucide-react';

const Wishlist = () => {
  const { wishlistItems } = useWishlist();

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <Breadcrumbs items={[{ label: 'My Wishlist' }]} />
        <EmptyState title="Your Wishlist is Empty" message="Save your favorite Himalayan teas and Ayurvedic supplements to view them here." actionText="Explore Products" actionLink="/shop" />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <Breadcrumbs items={[{ label: 'My Wishlist' }]} />

      <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '2rem', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Heart size={24} color="#e63946" fill="#e63946" />
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#1b4332' }}>My Wishlist ({wishlistItems.length} items)</h1>
          <p style={{ color: '#5c6e63', fontSize: '0.88rem' }}>Your personal collection of saved cakes, pastries &amp; bakery favourites.</p>
        </div>
      </div>

      <ProductGrid products={wishlistItems} />
    </div>
  );
};

export default Wishlist;
