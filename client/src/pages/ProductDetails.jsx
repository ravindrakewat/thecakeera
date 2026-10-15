import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import reviewService from '../services/reviewService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import ProductCarousel from '../components/product/ProductCarousel';
import PaymentTrustStrip from '../components/common/PaymentTrustStrip';
import ComplianceBadges from '../components/common/ComplianceBadges';
import BotanicalAnatomyShowcase from '../components/product/BotanicalAnatomyShowcase';
import ProductPromoSlider from '../components/product/ProductPromoSlider';
import { siteConfig } from '../config/siteConfig';
import { getProductImage } from '../utils/imageUtils';
import {
  Star,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  RefreshCw,
  Minus,
  Plus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  X,
  Leaf,
  AlertCircle,
  Sparkles,
  Clock,
  Award,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';

const ProductDetails = () => {
  const { id, slug } = useParams();
  const identifier = slug || id;

  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCart(product, quantity);
    navigate('/checkout');
  };

  // Primary product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Accordion state
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    ingredients: true,
    benefits: true,
    howToUse: false,
    safety: false,
    shipping: false,
    reviews: true,
  });

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  // Review submission state
  const [eligibility, setEligibility] = useState({ eligible: false });
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState(null);

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Sticky mobile bar state
  const [showStickyBar, setShowStickyBar] = useState(false);
  const mainBuyBoxRef = useRef(null);

  // 1. Fetch Product Details
  useEffect(() => {
    if (identifier) {
      fetchProductDetails();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [identifier]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productService.getProductBySlug(identifier);
      const prodData = res.data?.data || res.data || res;
      setProduct(prodData);

      // Collect images safely and remove duplicates
      const localPrimary = getProductImage(prodData);
      const rawList = [];

      if (localPrimary) rawList.push({ url: localPrimary, alt: prodData.name });

      if (Array.isArray(prodData.images) && prodData.images.length > 0) {
        prodData.images.forEach((img) => {
          if (img && img.url && !rawList.some((r) => r.url === img.url)) {
            rawList.push({ url: img.url, alt: img.alt || prodData.name });
          }
        });
      }

      if (prodData.thumbnail && !rawList.some((r) => r.url === prodData.thumbnail)) {
        rawList.push({ url: prodData.thumbnail, alt: prodData.name });
      }

      const finalImages = rawList.length > 0 ? rawList : [{ url: '/images/hero-banner.jpg', alt: prodData.name }];
      setGalleryImages(finalImages);
      setSelectedImageIndex(0);

      // Fetch related products from same category
      fetchRelatedProducts(prodData);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      const statusCode = err.response?.status;
      if (statusCode === 404) {
        setError('Product not found. The herbal formulation you are looking for may have been retired or moved.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Unable to load product information. Please verify your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Related Products
  const fetchRelatedProducts = async (currProduct) => {
    if (!currProduct) return;
    try {
      setRelatedLoading(true);
      const catParam = currProduct.category?._id || currProduct.category?.slug || currProduct.category;
      const res = await productService.getProducts({
        category: typeof catParam === 'string' ? catParam : undefined,
        limit: 8,
      });
      const list = res.data?.products || res.data || [];
      if (Array.isArray(list)) {
        // Filter out current product
        const filtered = list.filter((p) => (p._id || p.id) !== (currProduct._id || currProduct.id));
        setRelatedProducts(filtered);
      }
    } catch (err) {
      console.warn('Could not fetch related products:', err);
    } finally {
      setRelatedLoading(false);
    }
  };

  // 3. Fetch Reviews
  useEffect(() => {
    if (product?._id) {
      fetchProductReviews(1);
    }
  }, [product?._id]);

  const fetchProductReviews = async (page = 1) => {
    if (!product?._id) return;
    try {
      setReviewsLoading(true);
      const res = await reviewService.getProductReviews(product._id, { page, limit: 10 });
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.reviews) ? res.reviews : (Array.isArray(res) ? res : []));

      if (page === 1) {
        setReviews(list);
      } else {
        setReviews((prev) => [...prev, ...list]);
      }

      const totalPages = res?.pagination?.pages || res?.pagination?.totalPages || 1;
      setHasMoreReviews(page < totalPages);
      setReviewPage(page);
    } catch (err) {
      console.error('Failed to fetch product reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // 4. Check Review Eligibility
  useEffect(() => {
    if (user && product?._id) {
      checkEligibility();
    }
  }, [user, product?._id]);

  const checkEligibility = async () => {
    if (!product?._id) return;
    try {
      const res = await reviewService.checkEligibility(product._id);
      const data = res.data?.data || res.data;
      setEligibility(data || { eligible: false });
    } catch (err) {
      setEligibility({ eligible: false, message: 'You must purchase this herbal remedy to submit a verified review.' });
    }
  };

  // 5. Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!product?._id) return;
    if (newComment.trim().length < 10) {
      setReviewMsg({ type: 'error', text: 'Review comment must be at least 10 characters long.' });
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewMsg(null);

      await reviewService.createReview(product._id, {
        rating: newRating,
        title: newTitle,
        comment: newComment,
      });

      setReviewMsg({ type: 'success', text: 'Thank you! Your verified review has been submitted for moderation.' });
      setNewComment('');
      setNewTitle('');
      setEligibility({ eligible: false, message: 'You have submitted a review for this product.' });
      fetchProductReviews(1);
    } catch (err) {
      setReviewMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit review. Please try again.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  // 6. Sticky Mobile Add-to-Cart Observer
  useEffect(() => {
    const handleScroll = () => {
      if (!mainBuyBoxRef.current) return;
      const rect = mainBuyBoxRef.current.getBoundingClientRect();
      // Show sticky bar once bottom of buy button scrolls out of view
      setShowStickyBar(rect.bottom < 60);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 7. Lightbox Keyboard Navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
    },
    [isLightboxOpen, galleryImages.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const scrollToReviews = (e) => {
    e.preventDefault();
    setExpandedSections((prev) => ({ ...prev, reviews: true }));
    const elem = document.getElementById('reviews-accordion');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Loading State
  if (loading) {
    return (
      <div style={{ backgroundColor: '#faf7f2', minHeight: '80vh', padding: '5rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              width: '48px',
              height: '48px',
              border: '3px solid #e2ddd4',
              borderTopColor: '#1b4332',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '1.25rem',
            }}
          />
          <h2 style={{ color: '#1b4332', fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Preparing Ayurvedic Formulation...
          </h2>
          <p style={{ color: '#647369', fontSize: '0.95rem' }}>Loading authentic product details, certifications & herbal wisdom.</p>
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !product) {
    return (
      <div style={{ backgroundColor: '#faf7f2', minHeight: '80vh', padding: '5rem 0' }}>
        <div className="container" style={{ maxWidth: '640px', textAlign: 'center', margin: '0 auto' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={36} />
          </div>
          <h1 style={{ color: '#1b4332', fontFamily: 'var(--font-serif)', fontSize: '2.2rem', marginBottom: '0.75rem' }}>
            Product Unavailable
          </h1>
          <p style={{ color: '#647369', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {error || 'The requested herbal remedy could not be located in our catalog.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/shop"
              style={{
                backgroundColor: '#1b4332',
                color: '#ffffff',
                padding: '0.85rem 2rem',
                borderRadius: '999px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              Browse All Herbal Products <ArrowRight size={16} />
            </Link>
            <Link
              to="/"
              style={{
                backgroundColor: '#ffffff',
                color: '#1b4332',
                border: '1.5px solid #dcd5ca',
                padding: '0.85rem 2rem',
                borderRadius: '999px',
                fontWeight: 600,
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculations
  const isLiked = isInWishlist(product?._id || product?.id);
  const mrp = Number(product.mrp || product.pricing?.mrp || 0);
  const sellingPrice = Number(product.sellingPrice || product.pricing?.sellingPrice || product.price || 0);
  const isDiscounted = mrp > sellingPrice;
  const discountPercent = isDiscounted && mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const isOutOfStock = product.stockStatus === 'OUT_OF_STOCK' || product.stockQuantity === 0;
  const isLowStock = product.stockStatus === 'LOW_STOCK' || (product.stockQuantity > 0 && product.stockQuantity <= 5);

  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0] || { url: '/images/hero-banner.jpg', alt: product.name };

  const averageRating = product.averageRating ? Number(product.averageRating).toFixed(1) : '5.0';
  const reviewCount = product.reviewCount || 0;
  const hasReviews = reviewCount > 0;

  return (
    <div style={{ backgroundColor: '#faf7f2', minHeight: '100vh', color: '#1a2e22', paddingBottom: '6rem' }}>
      {/* ── BREADCRUMB NAVIGATION ─────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #ebe5dc', backgroundColor: '#ffffff' }}>
        <Breadcrumbs
          items={[
            { label: 'Shop', link: '/shop' },
            {
              label: product.category?.name || 'Catalog',
              link: product.category?.slug ? `/category/${product.category.slug}` : '/shop',
            },
            { label: product.name },
          ]}
        />
      </div>

      <div className="container" style={{ paddingTop: '2.5rem' }}>
        {/* ── MAIN PRODUCT SECTION (TWO COLUMNS ON DESKTOP) ────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: 'clamp(2rem, 4vw, 4.5rem)',
            alignItems: 'start',
            marginBottom: '4.5rem',
          }}
        >
          {/* ═══════════ LEFT COLUMN: PREMIUM GALLERY ═══════════ */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '1.25rem',
              alignItems: 'flex-start',
            }}
            className="product-gallery-container"
          >
            {/* Desktop Vertical Thumbnail Rail (Horizontal on mobile via CSS class) */}
            {galleryImages.length > 1 && (
              <div
                className="gallery-thumbnails-rail"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  maxHeight: '560px',
                  overflowY: 'auto',
                  flexShrink: 0,
                }}
              >
                {galleryImages.map((img, idx) => {
                  const isSelected = selectedImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedImageIndex(idx);
                        }
                      }}
                      tabIndex={0}
                      aria-label={`View image ${idx + 1} of ${galleryImages.length}`}
                      style={{
                        width: '76px',
                        height: '76px',
                        padding: '4px',
                        borderRadius: '14px',
                        border: isSelected ? '2.5px solid #1b4332' : '1.5px solid #ebe5dc',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(27, 67, 50, 0.15)' : 'none',
                        outline: 'none',
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.alt || `Thumbnail ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '10px',
                        }}
                        onError={(e) => {
                          e.currentTarget.src = '/images/hero-banner.jpg';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Image Stage */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1px solid #ebe5dc',
                padding: '1.75rem',
                boxShadow: '0 8px 30px rgba(21, 50, 34, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '440px',
                maxHeight: '580px',
                overflow: 'hidden',
              }}
            >
              {/* Botanical badge over image */}
              <div
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  left: '1.25rem',
                  backgroundColor: 'rgba(244, 248, 245, 0.94)',
                  color: '#1b4332',
                  border: '1px solid #d8e6dc',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backdropFilter: 'blur(6px)',
                  zIndex: 2,
                }}
              >
                <Leaf size={14} color="#2d6a4f" />
                100% BOTANICAL
              </div>

              {/* Floating Action Buttons (Zoom & Wishlist) */}
              <div
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  display: 'flex',
                  gap: '0.6rem',
                  zIndex: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  aria-label="Zoom image in lightbox"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #ebe5dc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1b4332',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                >
                  <ZoomIn size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #ebe5dc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                >
                  <Heart size={20} color={isLiked ? '#dd5226' : '#1b4332'} fill={isLiked ? '#dd5226' : 'none'} />
                </button>
              </div>

              {/* Main Image Clickable to Lightbox */}
              <img
                src={activeImage.url}
                alt={activeImage.alt || product.name}
                onClick={() => setIsLightboxOpen(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '480px',
                  objectFit: 'contain',
                  cursor: 'zoom-in',
                  transition: 'transform 0.3s ease',
                }}
                onError={(e) => {
                  e.currentTarget.src = '/images/hero-banner.jpg';
                }}
              />

              {/* Image Counter Pill */}
              {galleryImages.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1.25rem',
                    backgroundColor: 'rgba(21, 50, 34, 0.75)',
                    color: '#ffffff',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                  }}
                >
                  {selectedImageIndex + 1} / {galleryImages.length}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════ RIGHT COLUMN: PRODUCT PURCHASE BOX ═══════════ */}
          <div
            ref={mainBuyBoxRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {/* Top Meta: Brand / Category & Stock Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.84rem',
                    color: '#2d6a4f',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}
                >
                  {product.brand || siteConfig.brandName}
                </span>
                <span style={{ color: '#d0c8bd' }}>•</span>
                <span style={{ fontSize: '0.84rem', color: '#647369', fontWeight: 600 }}>
                  {product.category?.name || 'Bakery & Cakes'}
                </span>
              </div>

              {/* Stock Status Badge */}
              {isOutOfStock ? (
                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fecaca',
                    padding: '0.25rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                  }}
                >
                  OUT OF STOCK
                </span>
              ) : isLowStock ? (
                <span
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '0.25rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Clock size={13} /> ONLY {product.stockQuantity || 'A FEW'} LEFT
                </span>
              ) : (
                <span
                  style={{
                    backgroundColor: '#e8f5e9',
                    color: '#1b4332',
                    border: '1px solid #c8e6c9',
                    padding: '0.25rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <CheckCircle2 size={13} color="#2d6a4f" /> IN STOCK & READY TO SHIP
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                color: '#153222',
                fontWeight: 700,
                lineHeight: 1.22,
                margin: 0,
              }}
            >
              {product.name}
            </h1>

            {/* Real Ratings & Reviews Anchor */}
            {hasReviews ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.92rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', color: '#f59e0b', gap: '0.2rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={17}
                      fill={star <= Math.round(Number(averageRating)) ? '#f59e0b' : 'none'}
                      color="#f59e0b"
                    />
                  ))}
                  <strong style={{ color: '#153222', marginLeft: '0.4rem', fontSize: '0.98rem' }}>{averageRating}</strong>
                </div>
                <span style={{ color: '#d0c8bd' }}>•</span>
                <a
                  href="#reviews-accordion"
                  onClick={scrollToReviews}
                  style={{
                    color: '#2d6a4f',
                    textDecoration: 'underline',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ({reviewCount} verified reviews)
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#647369', fontSize: '0.88rem' }}>
                <Sparkles size={16} color="#2d6a4f" />
                <span>Authentic Himalayan formulation • Verified purity guaranteed</span>
              </div>
            )}

            {/* Price Box with Genuine MRP & Discount */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #ebe5dc',
                borderRadius: '18px',
                padding: '1.25rem 1.75rem',
                boxShadow: '0 4px 16px rgba(21, 50, 34, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 'clamp(2rem, 3.5vw, 2.6rem)',
                    fontWeight: 800,
                    color: '#153222',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {siteConfig.currency}
                  {sellingPrice.toLocaleString('en-IN')}
                </span>

                {isDiscounted && (
                  <>
                    <span
                      style={{
                        fontSize: '1.25rem',
                        color: '#8e9e94',
                        textDecoration: 'line-through',
                        fontWeight: 500,
                      }}
                    >
                      {siteConfig.currency}
                      {mrp.toLocaleString('en-IN')}
                    </span>
                    <span
                      style={{
                        backgroundColor: '#dd5226',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        letterSpacing: '0.4px',
                      }}
                    >
                      SAVE {discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#647369' }}>
                Inclusive of all applicable GST taxes • Free standard delivery on orders above ₹499
              </div>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p
                style={{
                  color: '#4a5c51',
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {product.shortDescription}
              </p>
            )}

            {/* Product Attributes / Specifications Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#f5f0e6',
                borderRadius: '14px',
                border: '1px solid #e7ded2',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#7a8a80', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  SKU CODE
                </span>
                <strong style={{ fontSize: '0.88rem', color: '#153222' }}>{product.sku || 'AYU-NAT-001'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#7a8a80', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  FORM
                </span>
                <strong style={{ fontSize: '0.88rem', color: '#153222' }}>Pure Herbal Formulation</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#7a8a80', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  DISPATCH
                </span>
                <strong style={{ fontSize: '0.88rem', color: '#153222' }}>Within 24-48 Hours</strong>
              </div>
            </div>

            {/* Purchase Controls: Quantity & Add to Cart */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginTop: '0.5rem',
              }}
            >
              {/* Quantity Stepper */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #dcd5ca',
                  borderRadius: '999px',
                  padding: '0.35rem 0.5rem',
                }}
                aria-label="Quantity Selector"
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: quantity <= 1 ? '#c8c0b5' : '#1b4332',
                    padding: '0.4rem 0.75rem',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Minus size={16} />
                </button>
                <span
                  style={{
                    fontWeight: 700,
                    padding: '0 0.9rem',
                    fontSize: '1.05rem',
                    color: '#153222',
                    minWidth: '28px',
                    textAlign: 'center',
                  }}
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={isOutOfStock}
                  aria-label="Increase quantity"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isOutOfStock ? '#c8c0b5' : '#1b4332',
                    padding: '0.4rem 0.75rem',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={() => addToCart(product, quantity)}
                disabled={isOutOfStock || cartLoading}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  backgroundColor: '#ffffff',
                  color: isOutOfStock ? '#a8b3aa' : '#153222',
                  border: isOutOfStock ? '1.5px solid #dcd5ca' : '2px solid #153222',
                  borderRadius: '999px',
                  padding: '0.9rem 1.25rem',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isOutOfStock) {
                    e.currentTarget.style.backgroundColor = '#153222';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOutOfStock) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#153222';
                  }
                }}
              >
                <ShoppingBag size={18} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              {/* Buy Now (Direct Fast Checkout) */}
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock || cartLoading}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  backgroundColor: isOutOfStock ? '#d0c8bd' : '#dd5226',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.9rem 1.25rem',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  boxShadow: isOutOfStock ? 'none' : '0 6px 20px rgba(221, 82, 38, 0.26)',
                  transition: 'background-color 0.2s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isOutOfStock) e.currentTarget.style.backgroundColor = '#c5431b';
                }}
                onMouseLeave={(e) => {
                  if (!isOutOfStock) e.currentTarget.style.backgroundColor = '#dd5226';
                }}
              >
                <Zap size={18} />
                Buy Now
              </button>
            </div>

            {/* ── FSSAI & COUNTRY OF ORIGIN COMPLIANCE BADGES ── */}
            <ComplianceBadges
              fssaiNumber={product?.fssaiNumber || '12723055000162'}
              countryOfOrigin={product?.countryOfOrigin || 'INDIA'}
              style={{ marginTop: '1.15rem' }}
            />

            {/* ── ACCEPTED PAYMENTS TRUST BADGES (Amex, Mastercard, Visa, BHIM UPI, RuPay) ── */}
            <PaymentTrustStrip style={{ marginTop: '0.85rem' }} />

            {/* Store Guarantees / Trust Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1rem',
                borderTop: '1px solid #ebe5dc',
                paddingTop: '1.25rem',
                marginTop: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Leaf size={18} color="#2d6a4f" />
                </div>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#153222', display: 'block' }}>100% Herbal</strong>
                  <span style={{ fontSize: '0.74rem', color: '#647369' }}>Pure plant actives</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={18} color="#2d6a4f" />
                </div>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#153222', display: 'block' }}>AYUSH Tested</strong>
                  <span style={{ fontSize: '0.74rem', color: '#647369' }}>Safety certified</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Truck size={18} color="#2d6a4f" />
                </div>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#153222', display: 'block' }}>Express Delivery</strong>
                  <span style={{ fontSize: '0.74rem', color: '#647369' }}>Across all pin codes</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <RefreshCw size={18} color="#2d6a4f" />
                </div>
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#153222', display: 'block' }}>Easy Returns</strong>
                  <span style={{ fontSize: '0.74rem', color: '#647369' }}>7-day policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTANICAL ANATOMY & NOURISHMENT SHOWCASE (ANIMATED MOVING CENTER IMAGE) ── */}
        {product?.showBotanicalShowcase !== false && (
          <BotanicalAnatomyShowcase
            product={product}
            productName={product?.botanicalTitle || undefined}
            imageSrc={product?.botanicalAnimatedImage || undefined}
            subtitle={product?.botanicalSubtitle || undefined}
            style={{ marginBottom: '4.5rem' }}
          />
        )}

        {/* ── FEATURE PROMO HERO BANNER SLIDER (CAROUSEL) ── */}
        {product?.showPromoSlider !== false && (
          <ProductPromoSlider
            product={product}
            style={{ marginBottom: '4.5rem' }}
          />
        )}

        {/* ── EXPANDABLE PRODUCT INFORMATION SECTIONS (ACCORDIONS) ─────────── */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            border: '1px solid #ebe5dc',
            padding: 'clamp(1.5rem, 3vw, 2.5rem)',
            boxShadow: '0 8px 30px rgba(21, 50, 34, 0.04)',
            marginBottom: '4.5rem',
          }}
        >
          <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid #ebe5dc', paddingBottom: '1rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 2.5vw, 1.85rem)',
                color: '#153222',
                fontWeight: 700,
                margin: 0,
              }}
            >
              Formulation Details & Herbal Wisdom
            </h2>
            <p style={{ color: '#647369', fontSize: '0.92rem', marginTop: '0.35rem' }}>
              Explore the classical science, active ingredients, and verified guidance behind this remedy.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* 1. DESCRIPTION ACCORDION */}
            <div style={{ border: '1px solid #ebe5dc', borderRadius: '16px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('description')}
                aria-expanded={expandedSections.description}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  backgroundColor: expandedSections.description ? '#f6f2ec' : '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Layers size={20} color="#2d6a4f" />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#153222' }}>
                    Description & Botanical Heritage
                  </span>
                </div>
                {expandedSections.description ? <ChevronUp size={20} color="#153222" /> : <ChevronDown size={20} color="#647369" />}
              </button>

              {expandedSections.description && (
                <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#3d4d42', fontSize: '0.96rem', lineHeight: 1.75 }}>
                  <p style={{ marginBottom: '1rem' }}>{product.description}</p>
                  <p style={{ color: '#647369', fontStyle: 'italic', margin: 0 }}>
                    Crafted strictly adhering to classical Ayurvedic principles, preserved without unnecessary synthetic additives.
                  </p>
                </div>
              )}
            </div>

            {/* 2. INGREDIENTS ACCORDION */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div style={{ border: '1px solid #ebe5dc', borderRadius: '16px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => toggleSection('ingredients')}
                  aria-expanded={expandedSections.ingredients}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    backgroundColor: expandedSections.ingredients ? '#f6f2ec' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Leaf size={20} color="#2d6a4f" />
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#153222' }}>
                      100% Herbal Ingredients
                    </span>
                  </div>
                  {expandedSections.ingredients ? <ChevronUp size={20} color="#153222" /> : <ChevronDown size={20} color="#647369" />}
                </button>

                {expandedSections.ingredients && (
                  <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
                    <p style={{ fontSize: '0.92rem', color: '#647369', marginBottom: '1rem' }}>
                      Pure natural actives sourced directly from verified organic cultivators:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                      {product.ingredients.map((ing, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.75rem 1rem',
                            backgroundColor: '#f6fbf7',
                            border: '1px solid #d8ecde',
                            borderRadius: '12px',
                            fontSize: '0.92rem',
                            color: '#1b4332',
                            fontWeight: 600,
                          }}
                        >
                          <Leaf size={16} color="#2d6a4f" />
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. BENEFITS ACCORDION */}
            {product.benefits && product.benefits.length > 0 && (
              <div style={{ border: '1px solid #ebe5dc', borderRadius: '16px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => toggleSection('benefits')}
                  aria-expanded={expandedSections.benefits}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    backgroundColor: expandedSections.benefits ? '#f6f2ec' : '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={20} color="#2d6a4f" />
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#153222' }}>
                      Key Health & Wellness Benefits
                    </span>
                  </div>
                  {expandedSections.benefits ? <ChevronUp size={20} color="#153222" /> : <ChevronDown size={20} color="#647369" />}
                </button>

                {expandedSections.benefits && (
                  <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: 0, margin: 0 }}>
                      {product.benefits.map((b, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.95rem', color: '#1a2e22', lineHeight: 1.5 }}>
                          <CheckCircle2 size={18} color="#2d6a4f" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 4. HOW TO USE ACCORDION */}
            <div style={{ border: '1px solid #ebe5dc', borderRadius: '16px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('howToUse')}
                aria-expanded={expandedSections.howToUse}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  backgroundColor: expandedSections.howToUse ? '#f6f2ec' : '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Clock size={20} color="#2d6a4f" />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#153222' }}>
                    How to Use & Dosage Instructions
                  </span>
                </div>
                {expandedSections.howToUse ? <ChevronUp size={20} color="#153222" /> : <ChevronDown size={20} color="#647369" />}
              </button>

              {expandedSections.howToUse && (
                <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#3d4d42', fontSize: '0.95rem', lineHeight: 1.75 }}>
                  <p style={{ margin: 0 }}>
                    {product.howToUse || product.usageInstructions || 'Take as indicated on the product container or as advised by an Ayurvedic physician.'}
                  </p>
                </div>
              )}
            </div>

            {/* 5. SAFETY & ALLERGEN ACCORDION */}
            <div style={{ border: '1px solid #ebe5dc', borderRadius: '16px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('safety')}
                aria-expanded={expandedSections.safety}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  backgroundColor: expandedSections.safety ? '#f6f2ec' : '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={20} color="#2d6a4f" />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#153222' }}>
                    Safety Information & Storage
                  </span>
                </div>
                {expandedSections.safety ? <ChevronUp size={20} color="#153222" /> : <ChevronDown size={20} color="#647369" />}
              </button>

              {expandedSections.safety && (
                <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#3d4d42', fontSize: '0.95rem', lineHeight: 1.75 }}>
                  <p style={{ marginBottom: product.allergenInformation ? '0.75rem' : 0 }}>
                    {product.disclaimer || 'Consult a healthcare practitioner before use if pregnant, nursing, or undergoing prescribed medical treatments.'}
                  </p>
                  {product.allergenInformation && (
                    <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontWeight: 600 }}>
                      Allergen Note: {product.allergenInformation}
                    </div>
                  )}
                  <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: '#647369', margin: 0 }}>
                    Storage: Keep in a cool, dry place away from direct sunlight. Keep bottle securely fastened.
                  </p>
                </div>
              )}
            </div>

            {/* 6. SHIPPING & RETURNS ACCORDION */}
            <div style={{ border: '1px solid #ebe5dc', borderRadius: '16px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('shipping')}
                aria-expanded={expandedSections.shipping}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  backgroundColor: expandedSections.shipping ? '#f6f2ec' : '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Truck size={20} color="#2d6a4f" />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#153222' }}>
                    Shipping, Delivery & Returns
                  </span>
                </div>
                {expandedSections.shipping ? <ChevronUp size={20} color="#153222" /> : <ChevronDown size={20} color="#647369" />}
              </button>

              {expandedSections.shipping && (
                <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', color: '#3d4d42', fontSize: '0.95rem', lineHeight: 1.75 }}>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li><strong>Dispatch Timeline:</strong> Orders are securely processed and dispatched from our organic herbal facility within 24–48 business hours.</li>
                    <li><strong>Shipping Rates:</strong> Free standard shipping across India on orders over ₹499. A nominal fee of ₹50 applies on smaller orders.</li>
                    <li><strong>Tracking:</strong> Complete real-time SMS &amp; email tracking provided once dispatched.</li>
                    <li><strong>Hassle-Free Returns:</strong> Unopened, sealed packages are eligible for exchange or return within 7 days of delivery.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* 7. REVIEWS ACCORDION */}
            <div id="reviews-accordion" style={{ border: '1px solid #ebe5dc', borderRadius: '16px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => toggleSection('reviews')}
                aria-expanded={expandedSections.reviews}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  backgroundColor: expandedSections.reviews ? '#f6f2ec' : '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Star size={20} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#153222' }}>
                    Verified Customer Reviews ({reviewCount})
                  </span>
                </div>
                {expandedSections.reviews ? <ChevronUp size={20} color="#153222" /> : <ChevronDown size={20} color="#647369" />}
              </button>

              {expandedSections.reviews && (
                <div style={{ padding: '1.75rem', backgroundColor: '#ffffff' }}>
                  {/* Reviews Summary Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                      paddingBottom: '1.5rem',
                      marginBottom: '1.5rem',
                      borderBottom: '1px solid #ebe5dc',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#153222' }}>{averageRating}</span>
                        <div>
                          <div style={{ display: 'flex', color: '#f59e0b' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={18}
                                fill={star <= Math.round(Number(averageRating)) ? '#f59e0b' : 'none'}
                                color="#f59e0b"
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '0.85rem', color: '#647369' }}>Based on {reviewCount} customer reviews</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Eligibility & Submission Form */}
                  {user ? (
                    eligibility.eligible ? (
                      <div
                        style={{
                          backgroundColor: '#f6fbf7',
                          border: '1.5px solid #cce5d4',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          marginBottom: '2rem',
                        }}
                      >
                        <h4 style={{ color: '#1b4332', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                          Submit a Verified Customer Review
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#647369', marginBottom: '1.25rem' }}>
                          You received this remedy in order #{eligibility.orderNumber}. Share your personal results to help others!
                        </p>

                        {reviewMsg && (
                          <div
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              marginBottom: '1.25rem',
                              fontSize: '0.88rem',
                              backgroundColor: reviewMsg.type === 'error' ? '#fee2e2' : '#e8f5e9',
                              color: reviewMsg.type === 'error' ? '#991b1b' : '#1b4332',
                            }}
                          >
                            {reviewMsg.text}
                          </div>
                        )}

                        <form onSubmit={handleSubmitReview}>
                          <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.4rem' }}>
                              Your Experience Rating
                            </label>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setNewRating(star)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                                >
                                  <Star size={26} fill={star <= newRating ? '#f59e0b' : 'none'} color="#f59e0b" />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#1b4332', marginBottom: '0.4rem' }}>
                              Headline (Optional)
                            </label>
                            <input
                              type="text"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              placeholder="e.g. Noticeable improvement in morning energy"
                              maxLength={100}
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: '1.5px solid #dcd5ca',
                                fontSize: '0.92rem',
                                outline: 'none',
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1b4332' }}>Detailed Review *</label>
                              <span style={{ fontSize: '0.78rem', color: '#8e9e94' }}>{newComment.length}/1000</span>
                            </div>
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Describe freshness, aroma, packaging, and effects after regular use..."
                              rows={3}
                              maxLength={1000}
                              required
                              style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: '1.5px solid #dcd5ca',
                                fontSize: '0.92rem',
                                resize: 'vertical',
                                outline: 'none',
                              }}
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingReview}
                            style={{
                              backgroundColor: '#1b4332',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '999px',
                              padding: '0.75rem 1.85rem',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              cursor: submittingReview ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '1rem 1.25rem',
                          backgroundColor: '#f6f2ec',
                          borderRadius: '12px',
                          marginBottom: '2rem',
                          fontSize: '0.88rem',
                          color: '#647369',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                        }}
                      >
                        <ShieldCheck size={20} color="#2d6a4f" />
                        <span>{eligibility.message || 'Verified customer reviews can only be submitted by verified purchasers of this remedy.'}</span>
                      </div>
                    )
                  ) : (
                    <div
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#f6f2ec',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        fontSize: '0.88rem',
                        color: '#647369',
                      }}
                    >
                      Please <Link to="/login" style={{ color: '#1b4332', fontWeight: 700, textDecoration: 'underline' }}>Sign In</Link> to write a review if you have purchased this remedy.
                    </div>
                  )}

                  {/* Customer Reviews List */}
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#8e9e94' }}>
                      <p style={{ margin: 0 }}>Be the first verified customer to share an experience with this herbal remedy!</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {reviews.map((rev) => (
                        <div
                          key={rev._id}
                          style={{
                            borderBottom: '1px solid #ebe5dc',
                            paddingBottom: '1.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: '#1b4332',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                }}
                              >
                                {(rev.name || (rev.user?.firstName ? `${rev.user.firstName} ${rev.user.lastName || ''}`.trim() : 'Customer')).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <strong style={{ fontSize: '0.92rem', color: '#153222' }}>
                                    {rev.name || (rev.user?.firstName ? `${rev.user.firstName} ${rev.user.lastName || ''}`.trim() : 'Verified Buyer')}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      backgroundColor: '#e8f5e9',
                                      color: '#2d6a4f',
                                      fontWeight: 700,
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '999px',
                                    }}
                                  >
                                    ✓ Verified Buyer
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: '#8e9e94' }}>
                                  {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', color: '#f59e0b' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  fill={star <= rev.rating ? '#f59e0b' : 'none'}
                                  color="#f59e0b"
                                />
                              ))}
                            </div>
                          </div>

                          {rev.title && (
                            <h5 style={{ fontSize: '1rem', color: '#153222', margin: '0.4rem 0 0.3rem 0', fontWeight: 700 }}>
                              {rev.title}
                            </h5>
                          )}
                          <p style={{ fontSize: '0.93rem', color: '#3d4d42', margin: 0, lineHeight: 1.6 }}>{rev.comment}</p>
                        </div>
                      ))}

                      {hasMoreReviews && (
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => fetchProductReviews(reviewPage + 1)}
                            disabled={reviewsLoading}
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#1b4332',
                              border: '1.5px solid #dcd5ca',
                              borderRadius: '999px',
                              padding: '0.6rem 1.75rem',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              cursor: reviewsLoading ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── PREMIUM VERIFIED QUALITY & TRUST BANNER ──────────────────────── */}
        <div
          style={{
            backgroundColor: '#1b4332',
            color: '#ffffff',
            borderRadius: '24px',
            padding: 'clamp(2rem, 4vw, 3.5rem)',
            marginBottom: '4.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle background glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40%',
              right: '-20%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ maxWidth: '780px', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
            <span
              style={{
                color: '#d4af37',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              The Cake Era Bakery Promise
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
                color: '#ffffff',
                fontWeight: 700,
                lineHeight: 1.25,
                margin: '0 0 0.85rem 0',
              }}
            >
              Freshly Baked with Passion, Pure Butter &amp; Belgian Cocoa
            </h2>
            <p style={{ color: '#d8e6dc', fontSize: '1rem', lineHeight: 1.65, margin: 0 }}>
              Every cake and artisanal bake is handcrafted fresh on order under strict hygiene standards and packed with utmost love.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Sparkles size={24} color="#d4af37" style={{ marginBottom: '0.5rem' }} />
              <strong style={{ fontSize: '0.98rem', display: 'block', marginBottom: '0.25rem' }}>Freshly Baked On Order</strong>
              <span style={{ fontSize: '0.84rem', color: '#c5d8cc', lineHeight: 1.5 }}>Never pre-stored or frozen; baked fresh in our ovens right before your celebration.</span>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ShieldCheck size={24} color="#d4af37" style={{ marginBottom: '0.5rem' }} />
              <strong style={{ fontSize: '0.98rem', display: 'block', marginBottom: '0.25rem' }}>100% Pure Ingredients</strong>
              <span style={{ fontSize: '0.84rem', color: '#c5d8cc', lineHeight: 1.5 }}>Made with 54% real Belgian chocolate, pure dairy butter, and natural flavours.</span>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Truck size={24} color="#d4af37" style={{ marginBottom: '0.5rem' }} />
              <strong style={{ fontSize: '0.98rem', display: 'block', marginBottom: '0.25rem' }}>Express Temperature Care</strong>
              <span style={{ fontSize: '0.84rem', color: '#c5d8cc', lineHeight: 1.5 }}>Carefully delivered in insulated packaging with free knife, candles &amp; tag.</span>
            </div>
          </div>
        </div>

        {/* ── RELATED PRODUCTS CAROUSEL ────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <ProductCarousel
              products={relatedProducts}
              loading={relatedLoading}
              title="You May Also Like"
              subtitle={`More freshly baked treats from ${product.category?.name || 'our bakery oven'}`}
              viewAllLink="/shop"
            />
          </div>
        )}
      </div>

      {/* ── STICKY MOBILE ADD-TO-CART BAR (< 768px) ────────────────────────── */}
      {showStickyBar && (
        <div
          className="sticky-mobile-cart-bar"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderTop: '1px solid #ebe5dc',
            padding: '0.75rem 1.25rem',
            display: 'none', // Controlled via CSS media query below
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <img
              src={activeImage.url}
              alt={product.name}
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid #ebe5dc',
                flexShrink: 0,
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <strong
                style={{
                  fontSize: '0.88rem',
                  color: '#153222',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '160px',
                }}
              >
                {product.name}
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#dd5226', fontWeight: 700 }}>
                {siteConfig.currency}
                {sellingPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => addToCart(product, quantity)}
            disabled={isOutOfStock || cartLoading}
            style={{
              backgroundColor: isOutOfStock ? '#d0c8bd' : '#dd5226',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              padding: '0.65rem 1.35rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={16} />
            {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      )}

      {/* ── LIGHTBOX MODAL (KEYBOARD ACCESSIBLE) ─────────────────────────── */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image Lightbox"
          onClick={() => setIsLightboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 30, 22, 0.94)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close Lightbox"
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
          >
            <X size={24} />
          </button>

          {/* Navigation Previous */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }}
              aria-label="Previous Image"
              style={{
                position: 'absolute',
                left: '1.5rem',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Main Large Lightbox Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <img
              src={activeImage.url}
              alt={activeImage.alt || product.name}
              style={{
                maxWidth: '85vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            />
            <span style={{ color: '#d8e6dc', fontSize: '0.9rem', fontWeight: 600 }}>
              {activeImage.alt || product.name} — ({selectedImageIndex + 1} of {galleryImages.length})
            </span>
          </div>

          {/* Navigation Next */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
              }}
              aria-label="Next Image"
              style={{
                position: 'absolute',
                right: '1.5rem',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}

      {/* Inline styles for responsive gallery and sticky mobile cart */}
      <style>{`
        @media (max-width: 768px) {
          .product-gallery-container {
            flex-direction: column-reverse !important;
          }
          .gallery-thumbnails-rail {
            flex-direction: row !important;
            overflow-x: auto !important;
            max-height: none !important;
            width: 100% !important;
            padding-bottom: 0.5rem;
          }
          .sticky-mobile-cart-bar {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;
