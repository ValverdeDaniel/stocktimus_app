import React from 'react';
import './App.css';
import ScreenerTable from './components/ScreenerTable';
import ScreenerResults from './components/ScreenerResults';  // ✅ new import

function App() {
  return (
    <div className="App dark">
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-5xl font-extrabold text-[#1DB954] mb-8 tracking-tight">
          Stocktimus
        </h1>

        {/* 🔎 Live Screener */}
        <ScreenerResults />

        <hr className="my-10 border-gray-700" />

        {/* 📋 Previously Saved Screener Params */}
        <ScreenerTable />
      </div>
    </div>
  );
}

export default App;
