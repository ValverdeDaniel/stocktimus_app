import React, { useState, useEffect } from 'react';
import WatchlistParamsForm from './WatchlistParamsForm';
import WatchlistTable from './WatchlistTable';
import WatchlistFilterControls from './WatchlistFilterControls';
import WatchlistSavedParams from './WatchlistSavedParams';
import WatchlistGroups from './WatchlistGroups';

function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [selectedTickers, setSelectedTickers] = useState([]);

  const [savedContracts, setSavedContracts] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);

  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchSavedContracts();
    fetchGroups();
  }, []);

  const fetchSavedContracts = async () => {
    try {
      const response = await fetch('/api/saved-contracts/');
      if (!response.ok) throw new Error('Failed to fetch saved contracts');
      const data = await response.json();
      setSavedContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading saved contracts:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/watchlist-groups/');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleAddToWatchlist = async (params) => {
    try {
      const response = await fetch('/api/run-watchlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contracts: [params] }),
      });
      if (!response.ok) throw new Error('Failed to add watchlist item');
      const data = await response.json();
      if (Array.isArray(data)) {
        setWatchlistItems((prev) => [...prev, ...data]);
      } else {
        console.error('Unexpected response adding to watchlist:', data);
        alert('Something went wrong adding to the watchlist.');
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert(`Failed to add to watchlist: ${error.message}`);
    }
  };

  const handleRunSelected = async () => {
    try {
      const response = await fetch('/api/run-bulk-watchlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_ids: selectedContracts }),
      });
      if (!response.ok) throw new Error('Failed to run selected contracts');
      const data = await response.json();
      if (Array.isArray(data)) {
        setWatchlistItems((prev) => [...prev, ...data]);
      } else {
        console.error('Unexpected response running selected contracts:', data);
        alert(`Server returned unexpected response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error running selected contracts:', error);
      alert(`Failed to run selected contracts: ${error.message}`);
    }
  };

  const handleRunGroup = async (groupId) => {
    try {
      const response = await fetch(`/api/watchlist-groups/${groupId}/`);
      if (!response.ok) throw new Error('Failed to load group');
      const group = await response.json();

      if (!group.contracts || !Array.isArray(group.contracts)) {
        console.error('Unexpected group data:', group);
        alert('Invalid group data received from server.');
        return;
      }

      const contractIds = group.contracts.map((c) => c.id);

      const runResponse = await fetch('/api/run-bulk-watchlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_ids: contractIds }),
      });
      if (!runResponse.ok) throw new Error('Failed to run group');
      const data = await runResponse.json();

      if (Array.isArray(data)) {
        setWatchlistItems((prev) => [...prev, ...data]);
      } else if (data.error) {
        console.error('Server error running group:', data);
        alert(`Server error: ${data.error}`);
      } else {
        console.error('Unexpected response running group:', data);
        alert(`Unexpected server response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error running group:', error);
      alert(`Failed to run group: ${error.message}`);
    }
  };

  const handleLoadContract = (param) => {
    document.querySelectorAll('input').forEach((input) => {
      const key = input.name;
      if (key && param[key] !== undefined) {
        input.value = param[key];
      }
    });
  };

  const handleDeleteContract = async (id) => {
    try {
      const response = await fetch(`/api/saved-contracts/${id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete contract');
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert(`Failed to delete contract: ${error.message}`);
    }
  };

  return (
    <div className="p-4 text-text">
      <h2 className="heading-xl">📈 Watchlist Tool</h2>

      <WatchlistParamsForm
        onAdd={handleAddToWatchlist}
        groups={groups}
        fetchGroups={fetchGroups}
        fetchSavedContracts={fetchSavedContracts}
      />

      <WatchlistSavedParams
        savedParams={savedContracts}
        selectedContracts={selectedContracts}
        setSelectedContracts={setSelectedContracts}
        handleRunSelected={handleRunSelected}
        onLoad={handleLoadContract}
        onDelete={handleDeleteContract}
        groups={groups}
        fetchGroups={fetchGroups}
        fetchSavedContracts={fetchSavedContracts}
      />

      <WatchlistGroups
        groups={groups}
        onRunGroup={handleRunGroup}
        fetchGroups={fetchGroups}
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
