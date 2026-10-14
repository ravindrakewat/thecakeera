const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Product.updateOne(
    { slug: 'pure-himalayan-ashwagandha-extract' },
    {
      $set: {
        thumbnail: '/images/ashwagandha.jpg',
        images: [
          {
            url: '/images/ashwagandha.jpg',
            alt: 'Pure Himalayan Ashwagandha Extract Jar - Studio View',
            sortOrder: 0,
            width: 800,
            height: 800,
          },
          {
            url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800',
            alt: 'Raw Organic Ashwagandha Roots & Herbal Powder',
            sortOrder: 1,
            width: 800,
            height: 800,
          },
        ],
      },
    }
  );

  await Product.updateOne(
    { slug: 'chamomile-tulsi-sleep-tea' },
    {
      $set: {
        thumbnail: '/images/chamomile-tea.jpg',
        images: [
          {
            url: '/images/chamomile-tea.jpg',
            alt: 'Chamomile & Tulsi Sleep Tea Eco-Pouch',
            sortOrder: 0,
            width: 800,
            height: 800,
          },
          {
            url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800',
            alt: 'Freshly Brewed Chamomile Herbal Infusion',
            sortOrder: 1,
            width: 800,
            height: 800,
          },
        ],
      },
    }
  );

  await Product.updateOne(
    { slug: 'wild-lavender-therapeutic-essential-oil' },
    {
      $set: {
        thumbnail: '/images/lavender-oil.jpg',
        images: [
          {
            url: '/images/lavender-oil.jpg',
            alt: 'Wild Lavender Therapeutic Essential Oil Bottle',
            sortOrder: 0,
            width: 800,
            height: 800,
          },
          {
            url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800',
            alt: 'Steam-Distilled Pure Wild Lavender Botanicals',
            sortOrder: 1,
            width: 800,
            height: 800,
          },
        ],
      },
    }
  );

  await Product.updateOne(
    { slug: 'kumkumadi-radiance-facial-glow-oil' },
    {
      $set: {
        thumbnail: '/images/kumkumadi-oil.jpg',
        images: [
          {
            url: '/images/kumkumadi-oil.jpg',
            alt: 'Kumkumadi Radiance Facial Glow Oil Dropper Bottle',
            sortOrder: 0,
            width: 800,
            height: 800,
          },
          {
            url: '/images/kumkumadi-oil-2.jpg',
            alt: 'Pure Kashmiri Saffron & Herbal Extracts - Botanical Macro Angle',
            sortOrder: 1,
            width: 800,
            height: 800,
          },
        ],
      },
    }
  );

  console.log('All products successfully enriched with multi-angle gallery images in MongoDB!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
