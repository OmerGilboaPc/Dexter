import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page" style={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: '80vh' }}>
      <div>
        <div className="display" style={{ fontSize: 'clamp(120px, 20vw, 300px)', color: 'var(--blood-bright)', lineHeight: 0.8 }}>
          404
        </div>
        <div className="serif" style={{ fontSize: 34, fontStyle: 'italic', marginTop: 20 }}>
          No body. No evidence. No page.
        </div>
        <p className="muted">Someone cleaned up very thoroughly.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
          Back home
        </Link>
      </div>
    </div>
  );
}
