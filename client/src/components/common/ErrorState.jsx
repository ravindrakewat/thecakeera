import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ message = 'Unable to load data. Please check your connection and try again.', onRetry }) => {
  const displayMessage = typeof message === 'string'
    ? message
    : (message?.message || message?.error || JSON.stringify(message) || 'Unable to load data. Please check your connection and try again.');

  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', backgroundColor: '#fff5f5', borderRadius: '14px', border: '1px solid #fecaca', margin: '2rem 0' }}>
      <AlertCircle size={40} color="#dc2626" style={{ marginBottom: '0.75rem' }} />
      <h3 style={{ fontSize: '1.2rem', color: '#991b1b', marginBottom: '0.5rem' }}>Something Went Wrong</h3>
      <p style={{ color: '#7f1d1d', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>{displayMessage}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline" style={{ borderColor: '#dc2626', color: '#dc2626' }}>
          <RefreshCw size={16} /> Retry Request
        </button>
      )}
    </div>
  );
};

export default ErrorState;
