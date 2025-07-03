import React, { useState, useEffect } from 'react';
import WatchlistParamsForm from './WatchlistParamsForm';
import WatchlistTable from './WatchlistTable';
import WatchlistFilterControls from './WatchlistFilterControls';
import WatchlistGroups from './WatchlistGroups';

function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [selectedTickers, setSelectedTickers] = useState([]);

  const [selectedContracts, setSelectedContracts] = useState([]); // still used for group-level actions
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchSavedContracts();
    fetchGroups();
  }, []);

  const fetchSavedContracts = async () => {
    try {
      const response = await fetch('/api/saved-contracts/');
      if (!response.ok) throw new Error('Failed to fetch saved contracts');
      await response.json(); // no longer storing the contracts in state
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
        groups={groups}
        fetchGroups={fetchGroups}
        fetchSavedContracts={fetchSavedContracts}
        onSimulationComplete={(results) => setWatchlistItems(results)}
      />

      <WatchlistGroups
        groups={groups}
        onRunGroup={handleRunGroup}
        fetchGroups={fetchGroups}
        selectedContracts={selectedContracts}
        setSelectedContracts={setSelectedContracts}
        handleRunSelected={handleRunSelected}
        handleBulkDelete={handleDeleteContract}
        handleBulkAssign={async (selectedGroupIds) => {
          try {
            for (const contractId of selectedContracts) {
              for (const groupId of selectedGroupIds) {
                const response = await fetch(`/api/watchlist-groups/${groupId}/assign/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contract_ids: [contractId] }),
                });
                if (!response.ok) throw new Error(`Failed to assign contract ${contractId} to group ${groupId}`);
              }
            }
            alert('Contracts assigned successfully!');
            setSelectedContracts([]);
            await fetchGroups();
            await fetchSavedContracts();
          } catch (error) {
            console.error('Error bulk assigning:', error);
          }
        }}
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
