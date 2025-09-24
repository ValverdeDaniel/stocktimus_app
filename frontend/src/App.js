import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './styles/ui.css';

import Navbar from './components/Navbar';
import ScreenerResults from './components/ScreenerResults';
import Watchlist from './components/Watchlist';
import StockAnalyzerDashboard from './components/StockAnalyzer/StockAnalyzerDashboard';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import { logout } from './services/api';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <div className="App dark bg-background text-text min-h-screen">
        {isLoggedIn && <Navbar onLogout={handleLogout} />}
        <div className="container-wide p-4">
          <Routes>
            <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
            <Route path="/signup" element={<SignupForm onSignup={handleLogin} />} />
            <Route path="/" element={
              <RequireAuth>
                <ScreenerResults />
              </RequireAuth>
            } />
            <Route path="/watchlist" element={
              <RequireAuth>
                <Watchlist />
              </RequireAuth>
            } />
            <Route path="/stock-analyzer" element={
              <RequireAuth>
                <StockAnalyzerDashboard />
              </RequireAuth>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
