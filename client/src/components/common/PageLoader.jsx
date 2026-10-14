import React from 'react';

const PageLoader = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
      <div 
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #d8f3dc',
          borderTop: '3px solid #2d6a4f',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#5c6e63', fontSize: '0.9rem', fontWeight: 500 }}>Loading Herbal Sanctuary...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
