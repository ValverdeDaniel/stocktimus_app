import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-background border-b border-muted p-4 flex justify-between items-center container-wide">
      <div className="text-primary text-2xl font-bold">Options Leveling</div>
      <div className="flex gap-6">
        <Link
          to="/"
          className={`text-text hover:text-primary transition ${
            location.pathname === '/' ? 'text-primary' : ''
          }`}
        >
          Screener
        </Link>
        <Link
          to="/watchlist"
          className={`text-text hover:text-primary transition ${
            location.pathname === '/watchlist' ? 'text-primary' : ''
          }`}
        >
          Watchlist
        </Link>
        {/* Add more links here as needed */}
      </div>
    </nav>
  );
}

export default Navbar;
