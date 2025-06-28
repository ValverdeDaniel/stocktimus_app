import React, { useState } from 'react';
import WatchlistParamsForm from './WatchlistParamsForm';
import WatchlistTable from './WatchlistTable';
import WatchlistFilterControls from './WatchlistFilterControls';

function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [selectedTickers, setSelectedTickers] = useState([]);

  const handleAddToWatchlist = async (params) => {
    try {
      const response = await fetch('/api/run-watchlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contracts: [params] }),
      });

      if (!response.ok) throw new Error('Failed to fetch watchlist data.');
      const data = await response.json();
      setWatchlistItems((prev) => [...prev, ...data]);  // append results
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  return (
    <div className="p-4 text-text">
      <h2 className="heading-xl">📈 Watchlist Tool</h2>

      <WatchlistParamsForm onAdd={handleAddToWatchlist} />

      <WatchlistFilterControls
        data={watchlistItems}
        selectedTickers={selectedTickers}
        setSelectedTickers={setSelectedTickers}
      />

      <WatchlistTable
        items={watchlistItems}
        selectedTickers={selectedTickers}
      />
    </div>
  );
}

export default Watchlist;
