import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/ui.css';
import Navbar from './components/Navbar';
import ScreenerResults from './components/ScreenerResults';
import Watchlist from './components/Watchlist';  // ✅ Watchlist component

function App() {
  return (
    <Router>
      <div className="App dark bg-background text-text min-h-screen">
        <Navbar />
        <div className="container-wide p-4">
          <Routes>
            <Route path="/" element={<ScreenerResults />} />
            <Route path="/watchlist" element={<Watchlist />} />  {/* ✅ This enables your watchlist page */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
