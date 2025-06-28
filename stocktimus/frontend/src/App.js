import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';            // ✅ Your base/global styles or Tailwind resets
import './styles/ui.css';      // ✅ Your reusable UI design system classes
import Navbar from './components/Navbar';  // ✅ Your new navbar component
import ScreenerResults from './components/ScreenerResults';  // ✅ Screener page
// Future Watchlist page placeholder:
// import WatchlistResults from './components/Watchlist/WatchlistResults';

function App() {
  return (
    <Router>
      <div className="App dark bg-background text-text min-h-screen">
        <Navbar />

        <div className="container-wide p-4">
          <Routes>
            <Route path="/" element={<ScreenerResults />} />
            {/* Uncomment this once you build your watchlist tool:
            <Route path="/watchlist" element={<WatchlistResults />} />
            */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
