import React, { useState } from 'react';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

const LazyImage = ({ src, alt, width, height, className = '', style = {}, quality = 80 }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const optimizedSrc = getOptimizedImageUrl(src, { width, quality, format: 'webp' });

  return (
    <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#e2e8e4', borderRadius: 'inherit', ...style }}>
      <img
        src={optimizedSrc}
        alt={alt || 'Herbal Product'}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.4s ease, filter 0.4s ease',
          opacity: isLoaded ? 1 : 0,
          filter: isLoaded ? 'blur(0)' : 'blur(8px)',
        }}
        className={className}
      />
    </div>
  );
};

export default LazyImage;
