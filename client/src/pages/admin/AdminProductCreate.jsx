import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import categoryService from '../../services/categoryService';
import { ArrowLeft, Save, AlertCircle, Upload, Image, Trash2, Leaf } from 'lucide-react';

const AdminProductCreate = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    sku: '',
    category: '',
    shortDescription: '',
    description: '',
    mrp: 0,
    sellingPrice: 0,
    costPrice: 0,
    stockQuantity: 10,
    lowStockThreshold: 5,
    trackInventory: true,
    thumbnail: '',
    imageUrls: '',
    ingredients: '',
    benefits: '',
    howToUse: '',
    disclaimer: 'Consult an Ayurvedic physician before use.',
    seoTitle: '',
    seoDescription: '',
    isActive: true,
    isFeatured: false,
    fssaiNumber: '12723055000162',
    countryOfOrigin: 'INDIA',
    showBotanicalShowcase: true,
    botanicalSubtitle: 'ROOT TO FRUIT NOURISHMENT WITH',
    botanicalTitle: '',
    botanicalAnimatedImage: '',
    showPromoSlider: true,
    promoSliderImages: '',
  });

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNameBlur = () => {
    if (!form.slug && form.name) {
      setForm((prev) => ({
        ...prev,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  // Compress large uploaded images in browser to keep payload lightweight and fast
  const compressImageFile = (file, maxWidth = 1200, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle local file upload via FileReader with auto-compression
  const handleFileUpload = async (e, targetField) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (targetField === 'thumbnail') {
      const compressedDataUrl = await compressImageFile(files[0]);
      if (compressedDataUrl) {
        setForm((prev) => ({ ...prev, thumbnail: compressedDataUrl }));
      }
    } else if (targetField === 'botanical') {
      const compressedDataUrl = await compressImageFile(files[0]);
      if (compressedDataUrl) {
        setForm((prev) => ({ ...prev, botanicalAnimatedImage: compressedDataUrl }));
      }
    } else if (targetField === 'promoSlider') {
      const compressedUrls = await Promise.all(
        Array.from(files).map((f) => compressImageFile(f, 1600, 0.88))
      );
      setForm((prev) => {
        const currentList = prev.promoSliderImages
          ? prev.promoSliderImages.split('\n').filter(Boolean)
          : [];
        compressedUrls.filter(Boolean).forEach((url) => currentList.push(url));
        return {
          ...prev,
          promoSliderImages: currentList.join('\n'),
        };
      });
    } else if (targetField === 'gallery') {
      const compressedUrls = await Promise.all(
        Array.from(files).map((f) => compressImageFile(f))
      );
      setForm((prev) => {
        const currentList = prev.imageUrls
          ? prev.imageUrls.split('\n').filter(Boolean)
          : [];
        compressedUrls.filter(Boolean).forEach((url) => currentList.push(url));
        return {
          ...prev,
          imageUrls: currentList.join('\n'),
        };
      });
    }
  };

  // Remove a specific gallery image by index
  const handleRemoveGalleryImage = (indexToRemove) => {
    setForm((prev) => {
      const list = prev.imageUrls.split('\n').filter(Boolean);
      const updated = list.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        imageUrls: updated.join('\n'),
      };
    });
  };

  // Remove a specific slider banner image by index
  const handleRemoveSliderImage = (indexToRemove) => {
    setForm((prev) => {
      const list = prev.promoSliderImages.split('\n').filter(Boolean);
      const updated = list.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        promoSliderImages: updated.join('\n'),
      };
    });
  };

  const galleryList = form.imageUrls ? form.imageUrls.split('\n').filter(Boolean) : [];
  const sliderImagesList = form.promoSliderImages ? form.promoSliderImages.split('\n').filter(Boolean) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (Number(form.sellingPrice) > Number(form.mrp)) {
      setErrorMsg('Selling Price cannot exceed MRP.');
      return;
    }

    try {
      setLoading(true);
      const imagesPayload = form.imageUrls
        ? form.imageUrls.split('\n').filter(Boolean).map((url, idx) => ({
            url: url.trim(),
            alt: `${form.name} view ${idx + 1}`,
            sortOrder: idx,
          }))
        : [];

      const payload = {
        name: form.name,
        slug: form.slug,
        sku: form.sku,
        category: form.category,
        shortDescription: form.shortDescription,
        description: form.description,
        mrp: Number(form.mrp),
        sellingPrice: Number(form.sellingPrice),
        costPrice: Number(form.costPrice),
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        trackInventory: form.trackInventory,
        thumbnail: form.thumbnail || (imagesPayload[0]?.url || ''),
        images: imagesPayload,
        ingredients: form.ingredients ? form.ingredients.split(',').map((s) => s.trim()).filter(Boolean) : [],
        benefits: form.benefits ? form.benefits.split(',').map((s) => s.trim()).filter(Boolean) : [],
        howToUse: form.howToUse,
        disclaimer: form.disclaimer,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        fssaiNumber: form.fssaiNumber || '12723055000162',
        countryOfOrigin: form.countryOfOrigin || 'INDIA',
        showBotanicalShowcase: form.showBotanicalShowcase,
        botanicalSubtitle: form.botanicalSubtitle || 'ROOT TO FRUIT NOURISHMENT WITH',
        botanicalTitle: form.botanicalTitle || '',
        botanicalAnimatedImage: form.botanicalAnimatedImage || '',
        showPromoSlider: form.showPromoSlider,
        promoSliderImages: form.promoSliderImages
          ? form.promoSliderImages.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      await productService.createProduct(payload);
      navigate('/admin/products');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/admin/products" style={{ color: '#5c6e63', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back to Products
        </Link>
        <h1 style={{ fontSize: '1.8rem', color: '#1b4332', margin: 0 }}>Add New Herbal Product</h1>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Section 1: Basic Information */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8e4' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem' }}>1. Basic Specification</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Product Name *</label>
              <input type="text" name="name" required value={form.name} onChange={handleChange} onBlur={handleNameBlur} placeholder="e.g. Pure Himalayan Shilajit Resin" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Slug (URL identifier) *</label>
              <input type="text" name="slug" required value={form.slug} onChange={handleChange} placeholder="pure-himalayan-shilajit-resin" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>SKU Code *</label>
              <input type="text" name="sku" required value={form.sku} onChange={handleChange} placeholder="HERB-SHIL-005" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Category *</label>
              <select name="category" required value={form.category} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', backgroundColor: '#fff' }}>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Short Description</label>
            <input type="text" name="shortDescription" value={form.shortDescription} onChange={handleChange} placeholder="Brief summary of therapeutic action" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Full Description *</label>
            <textarea name="description" required rows={4} value={form.description} onChange={handleChange} placeholder="Detailed therapeutic properties, traditional background, and herbal qualities..." style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8e4' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1b4332', fontSize: '1.1rem' }}>2. Pricing & Inventory Control</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>MRP (₹) *</label>
              <input type="number" name="mrp" required min="0" value={form.mrp} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Selling Price (₹) *</label>
              <input type="number" name="sellingPrice" required min="0" value={form.sellingPrice} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Cost Price (₹ - Admin Private)</label>
              <input type="number" name="costPrice" min="0" value={form.costPrice} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Stock Quantity *</label>
              <input type="number" name="stockQuantity" required min="0" value={form.stockQuantity} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Low Stock Alert Threshold</label>
              <input type="number" name="lowStockThreshold" min="0" value={form.lowStockThreshold} onChange={handleChange} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
            </div>
          </div>
        </div>

        {/* Section 3: Product Images & Gallery Thumbnails */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Image size={20} color="#1b4332" />
            <h3 style={{ margin: 0, color: '#1b4332', fontSize: '1.1rem' }}>3. Product Images & Gallery Thumbnails</h3>
          </div>

          {/* Main Thumbnail */}
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #eef2ef' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.4rem' }}>
              Main Product Thumbnail (Used on Shop Catalog & Main View)
            </label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              {form.thumbnail ? (
                <img
                  src={form.thumbnail}
                  alt="Thumbnail preview"
                  style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: '10px', border: '1.5px solid #c8d6ce' }}
                  onError={(e) => { e.currentTarget.src = '/images/hero-banner.jpg'; }}
                />
              ) : (
                <div style={{ width: '84px', height: '84px', borderRadius: '10px', border: '1.5px dashed #c8d6ce', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e9e94', fontSize: '0.75rem', textAlign: 'center', padding: '0.25rem' }}>
                  No Thumbnail
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="thumbnail"
                  value={form.thumbnail}
                  onChange={handleChange}
                  placeholder="Image URL (e.g. /images/kumkumadi-oil.jpg or https://...)"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', backgroundColor: '#eef5f1', color: '#1b4332', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    <Upload size={15} /> Upload Thumbnail File
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(e, 'thumbnail')}
                    />
                  </label>
                  {form.thumbnail && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, thumbnail: '' }))}
                      style={{ padding: '0.45rem 0.9rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Images (The Left-Side Thumbnails on Product Page) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>
              Product Gallery Images (Left-Side Thumbnails on Product Details Page)
            </label>
            <p style={{ fontSize: '0.8rem', color: '#647369', marginBottom: '0.85rem' }}>
              These images appear as the clickable vertical thumbnails next to the main product image.
            </p>

            {/* Current Gallery Images Cards */}
            {galleryList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
                {galleryList.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '10px', border: '1px solid #c8d6ce', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
                    <img
                      src={url}
                      alt={`Gallery thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.src = '/images/hero-banner.jpg'; }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      title="Remove this thumbnail"
                      style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                    <div style={{ position: 'absolute', bottom: '2px', left: '4px', backgroundColor: 'rgba(27,67,50,0.85)', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px' }}>
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload or Add image URLs */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', backgroundColor: '#1b4332', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <Upload size={16} /> Upload Image File from Computer
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'gallery')}
                />
              </label>
              <span style={{ fontSize: '0.8rem', color: '#8e9e94' }}>or enter image URLs below (1 per line):</span>
            </div>

            <textarea
              name="imageUrls"
              rows={3}
              value={form.imageUrls}
              onChange={handleChange}
              placeholder="/images/kumkumadi-oil.jpg&#10;/images/kumkumadi-oil-2.jpg&#10;https://..."
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* Section 4: Herbal Specification */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Leaf size={20} color="#1b4332" />
            <h3 style={{ margin: 0, color: '#1b4332', fontSize: '1.1rem' }}>4. Herbal Information & Accordion Details</h3>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Ingredients (comma separated)</label>
            <input type="text" name="ingredients" value={form.ingredients} onChange={handleChange} placeholder="Amla, Haritaki, Bibhitaki" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>Key Benefits (comma separated)</label>
            <input type="text" name="benefits" value={form.benefits} onChange={handleChange} placeholder="Supports Digestion, Detoxification" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>How to Use</label>
            <input type="text" name="howToUse" value={form.howToUse} onChange={handleChange} placeholder="Take 1 tsp with warm water before bedtime." style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }} />
          </div>
        </div>

        {/* Section 5: Botanical Anatomy & Animated Showcase (Root-to-Fruit Section) */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Leaf size={20} color="#dd5226" />
              <h3 style={{ margin: 0, color: '#1b4332', fontSize: '1.1rem' }}>
                5. Botanical Anatomy & Animated Showcase (Root-to-Fruit)
              </h3>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#1b4332', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                name="showBotanicalShowcase"
                checked={form.showBotanicalShowcase}
                onChange={handleChange}
                style={{ accentColor: '#1b4332' }}
              />
              Enable Animated Showcase Section
            </label>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#647369', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            This section renders the interactive showcase below the product price & buy buttons on the storefront. The center image continuously floats, rotates, and tilts with mouse parallax!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>
                Showcase Top Subtitle
              </label>
              <input
                type="text"
                name="botanicalSubtitle"
                value={form.botanicalSubtitle}
                onChange={handleChange}
                placeholder="ROOT TO FRUIT NOURISHMENT WITH"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>
                Showcase Main Title (Plant Name)
              </label>
              <input
                type="text"
                name="botanicalTitle"
                value={form.botanicalTitle}
                onChange={handleChange}
                placeholder="SEA BUCKTHORN (Leave blank to use product name)"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>
              Animated Center Image (Botanical Branch / Fruit Cutout)
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                name="botanicalAnimatedImage"
                value={form.botanicalAnimatedImage}
                onChange={handleChange}
                placeholder="/images/sea-buckthorn-branch.jpg (or leave blank to use main product image)"
                style={{ flex: 1, minWidth: '240px', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.85rem' }}
              />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem', backgroundColor: '#1b4332', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Upload size={16} /> Upload Center Image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'botanical')}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 6: Feature Promo Banner Slider (Hero Banner Carousel) */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Image size={20} color="#1b4332" />
              <h3 style={{ margin: 0, color: '#1b4332', fontSize: '1.1rem' }}>
                6. Promotional Hero Banner Slider (Feature Carousel)
              </h3>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#1b4332', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                name="showPromoSlider"
                checked={form.showPromoSlider}
                onChange={handleChange}
                style={{ accentColor: '#1b4332' }}
              />
              Show Slider on Product Page
            </label>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#647369', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Displays wide cinematic feature banners with &lt; and &gt; navigation arrows (like &quot;Straight from Ladakh&quot;, &quot;Rarest Omega 7 Source&quot;). If left empty, default verified banners are automatically used for Sea Buckthorn.
          </p>

          {/* Current Slider Images Thumbnails */}
          {sliderImagesList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
              {sliderImagesList.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '160px', height: '90px', borderRadius: '10px', border: '1px solid #c8d6ce', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
                  <img
                    src={url}
                    alt={`Slider banner ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = '/images/sea-buckthorn-banner-1.jpg'; }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSliderImage(idx)}
                    title="Remove this banner"
                    style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={12} />
                  </button>
                  <div style={{ position: 'absolute', bottom: '2px', left: '4px', backgroundColor: 'rgba(27,67,50,0.85)', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px' }}>
                    Slide #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload or Add Banner URLs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', backgroundColor: '#1b4332', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
              <Upload size={16} /> Upload Banner Images
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, 'promoSlider')}
              />
            </label>
            <span style={{ fontSize: '0.8rem', color: '#8e9e94' }}>or enter banner image URLs (1 per line):</span>
          </div>

          <textarea
            name="promoSliderImages"
            rows={3}
            value={form.promoSliderImages}
            onChange={handleChange}
            placeholder="/images/sea-buckthorn-banner-1.jpg&#10;/images/sea-buckthorn-banner-2.jpg"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce', fontSize: '0.88rem' }}
          />
        </div>

        {/* Section 7: Compliance & Trust Credentials (FSSAI & Origin) */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🛡️</span>
            <h3 style={{ margin: 0, color: '#1b4332', fontSize: '1.1rem' }}>
              7. Compliance & Trust Badges (FSSAI License & Country of Origin)
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>
                FSSAI License Number
              </label>
              <input
                type="text"
                name="fssaiNumber"
                value={form.fssaiNumber}
                onChange={handleChange}
                placeholder="12723055000162"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#647369', marginTop: '0.25rem', display: 'block' }}>
                Displayed directly on the FSSAI badge under the Add to Cart / Buy Now buttons.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1b4332', marginBottom: '0.3rem' }}>
                Country of Origin
              </label>
              <input
                type="text"
                name="countryOfOrigin"
                value={form.countryOfOrigin}
                onChange={handleChange}
                placeholder="INDIA"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #c8d6ce' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#647369', marginTop: '0.25rem', display: 'block' }}>
                Displayed on the Country of Origin badge alongside the Indian Tiranga flag.
              </span>
            </div>
          </div>
        </div>

        {/* Section 7: Status Controls */}
        <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e2e8e4', display: 'flex', gap: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#1b4332' }}>
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} style={{ accentColor: '#1b4332' }} />
            Active (Visible on Customer Store)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#1b4332' }}>
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} style={{ accentColor: '#1b4332' }} />
            Featured Product
          </label>
        </div>

        <button type="submit" disabled={loading} style={{ backgroundColor: '#1b4332', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '10px', border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Save size={18} /> {loading ? 'Saving Product...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default AdminProductCreate;
