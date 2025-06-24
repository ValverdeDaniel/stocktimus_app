import React from 'react';
import './App.css';
import ScreenerResults from './components/ScreenerResults';  // ✅ only import needed

function App() {
  return (
    <div className="App dark">
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-5xl font-extrabold text-[#1DB954] mb-8 tracking-tight">
          Stocktimus
        </h1>

        {/* 🎯 Main Screener Logic and Saved Scenarios */}
        <ScreenerResults />

        {/* If you want a footer or another section, you can add it here later */}
      </div>
    </div>
  );
}

export default App;
