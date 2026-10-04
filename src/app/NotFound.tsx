import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary-600, #2563eb)', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
        Go Back Home
      </Link>
    </div>
  );
}
