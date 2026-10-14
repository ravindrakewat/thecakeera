import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#1b4332' }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: '#5c6e63', marginBottom: '2rem' }}>
        The herbal sanctuary page you are looking for does not exist.
      </p>
      <Link to="/" className="btn btn-primary">Return to Home</Link>
    </div>
  );
};

export default NotFound;
