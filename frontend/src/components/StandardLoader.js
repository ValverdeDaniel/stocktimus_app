import React from 'react';
import '../styles/StandardLoader.css'; // Link to CSS in styles folder

export default function StandardLoader({ show = true, color = '#1DB954' }) {
  if (!show) return null;

  return (
    <div
      className="loader-overlay"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div className="lds-roller" style={{ color }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}></div>
        ))}
      </div>
    </div>
  );
}
