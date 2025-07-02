import React, { useState, useEffect } from 'react';
import WatchlistParamsForm from './WatchlistParamsForm';
import WatchlistTable from './WatchlistTable';
import WatchlistFilterControls from './WatchlistFilterControls';
import WatchlistSavedParams from './WatchlistSavedParams';

function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [selectedTickers, setSelectedTickers] = useState([]);

  // Saved contracts and selected contracts state
  const [savedContracts, setSavedContracts] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);

  // Load saved contracts when component mounts
  useEffect(() => {
    fetchSavedContracts();
  }, []);

  const fetchSavedContracts = async () => {
    try {
      const response = await fetch('/api/saved-contracts/');
      if (!response.ok) throw new Error('Failed to fetch saved contracts');
      const data = await response.json();
      setSavedContracts(data);
    } catch (error) {
      console.error('Error loading saved contracts:', error);
    }
  };

  // Add single contract to watchlist and run simulation
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

  // Run selected saved contracts in bulk
  const handleRunSelected = async () => {
    try {
      const response = await fetch('/api/run-bulk-watchlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_ids: selectedContracts }),
      });
      if (!response.ok) throw new Error('Failed to run selected contracts');
      const data = await response.json();
      setWatchlistItems((prev) => [...prev, ...data]);  // append combined results
    } catch (error) {
      console.error('Error running selected contracts:', error);
    }
  };

  // Load saved contract into WatchlistParamsForm
  const handleLoadContract = (param) => {
    document.querySelectorAll('input').forEach((input) => {
      const key = input.name;
      if (key && param[key] !== undefined) {
        input.value = param[key];
      }
    });
  };

  // Delete saved contract and refresh
  const handleDeleteContract = async (id) => {
    try {
      const response = await fetch(`/api/saved-contracts/${id}/`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contract');
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  return (
    <div className="p-4 text-text">
      <h2 className="heading-xl">📈 Watchlist Tool</h2>

      <WatchlistParamsForm onAdd={handleAddToWatchlist} />

      <WatchlistSavedParams
        savedParams={savedContracts}
        selectedContracts={selectedContracts}
        setSelectedContracts={setSelectedContracts}
        handleRunSelected={handleRunSelected}
        onLoad={handleLoadContract}
        onDelete={handleDeleteContract}
      />

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
