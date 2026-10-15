import React from 'react';
import { Leaf, Truck, ShieldCheck, Sparkles, Clock, HeartHandshake } from 'lucide-react';

const AnnouncementBar = () => {
  const announcements = [
    { icon: <Sparkles size={14} color="#f9c74f" />, text: 'Freshly Baked Daily • 100% Hygienic & Pure' },
    { icon: <Truck size={14} color="#74c69d" />, text: 'Free Delivery on orders above ₹499' },
    { icon: <Sparkles size={14} color="#f9c74f" />, text: 'Custom Designer & Celebration Cakes Available' },
    { icon: <ShieldCheck size={14} color="#74c69d" />, text: '100% Eggless Options Available Across All Flavours' },
    { icon: <Clock size={14} color="#90e0ef" />, text: 'Express Same-Day Delivery for Special Moments' },
    { icon: <HeartHandshake size={14} color="#74c69d" />, text: 'Cash on Delivery & Secure Online Payments' },
  ];

  // Duplicate items for a seamless, gap-free infinite loop
  const marqueeItems = [...announcements, ...announcements];

  return (
    <div
      className="announcement-bar-wrapper"
      style={{
        backgroundColor: '#11291c',
        backgroundImage: 'linear-gradient(90deg, #0e2317 0%, #173726 50%, #0e2317 100%)',
        color: '#e4eee8',
        padding: '0.42rem 0',
        fontSize: '0.78rem',
        fontWeight: 500,
        letterSpacing: '0.25px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 50,
      }}
    >
      <style>{`
        @keyframes marqueeScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .announcement-marquee-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: marqueeScroll 28s linear infinite;
          will-change: transform;
        }

        .announcement-bar-wrapper:hover .announcement-marquee-track {
          animation-play-state: paused;
        }

        .marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 1.75rem;
          white-space: nowrap;
          user-select: none;
        }

        .marquee-separator {
          display: inline-block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(116, 198, 157, 0.5);
          margin-left: 1.75rem;
        }
      `}</style>

      <div className="announcement-marquee-track">
        {marqueeItems.map((item, index) => (
          <div key={index} className="marquee-item">
            {item.icon}
            <span style={{ color: index % 2 === 0 ? '#d8f3dc' : '#f0fdf4' }}>
              {item.text}
            </span>
            <span className="marquee-separator" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;

