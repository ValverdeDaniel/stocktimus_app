import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-background border-b border-muted p-4 flex justify-between items-center container-wide">
      <div className="text-primary text-2xl font-bold">Options Leveling</div>

      <div className="flex gap-6 items-center">
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

        {!isAuthenticated ? (
          <Link
            to="/login"
            className="text-text hover:text-primary transition"
          >
            Login
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="text-text hover:text-red-500 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
