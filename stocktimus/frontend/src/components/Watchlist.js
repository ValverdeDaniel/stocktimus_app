import React, { useState, useEffect } from 'react';
import WatchlistParamsForm from './WatchlistParamsForm';
import WatchlistTable from './WatchlistTable';
import WatchlistFilterControls from './WatchlistFilterControls';
import WatchlistGroups from './WatchlistGroups';
import {
  getSavedContracts,
  getWatchlistGroups,
  runBulkWatchlist,
  deleteSavedContract,
  assignContractsToGroup,
} from '../services/api'; // ✅ Import centralized API functions

function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchSavedContracts();
    fetchGroups();
  }, []);

  // --- Fetch Saved Contracts ---
  const fetchSavedContracts = async () => {
    try {
      const response = await getSavedContracts();
      console.log('Saved Contracts:', response.data);
      setWatchlistItems(response.data); // ✅ Store saved contracts in watchlistItems
    } catch (error) {
      console.error('Error loading saved contracts:', error.response?.data || error.message);
    }
  };

  // --- Fetch Groups ---
  const fetchGroups = async () => {
    try {
      const response = await getWatchlistGroups();
      setGroups(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading groups:', error.response?.data || error.message);
    }
  };

  // --- Run Selected Contracts ---
  const handleRunSelected = async () => {
    try {
      const response = await runBulkWatchlist({ contract_ids: selectedContracts });
      const data = response.data;

      if (Array.isArray(data)) {
        setWatchlistItems((prev) => [...prev, ...data]);
      } else {
        console.error('Unexpected response running selected contracts:', data);
        alert(`Server returned unexpected response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Error running selected contracts:', error.response?.data || error.message);
      alert(`Failed to run selected contracts: ${error.message}`);
    }
  };

  // --- Run a Group ---
  const handleRunGroup = async (groupId) => {
    try {
      const group = groups.find((g) => g.id === groupId);
      if (!group || !Array.isArray(group.contracts)) {
        console.error('Unexpected group data:', group);
        alert('Invalid group data received from server.');
        return;
      }

      const contractIds = group.contracts.map((c) => c.id);
      const runResponse = await runBulkWatchlist({ contract_ids: contractIds });
      const data = runResponse.data;

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
      console.error('Error running group:', error.response?.data || error.message);
      alert(`Failed to run group: ${error.message}`);
    }
  };

  // --- Delete Contract ---
  const handleDeleteContract = async (id) => {
    try {
      await deleteSavedContract(id);
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error deleting contract:', error.response?.data || error.message);
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
        onSimulationComplete={(results) => {
          console.log('✅ simulation results:', results);
          setWatchlistItems(results);
        }}
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
            for (const groupId of selectedGroupIds) {
              await assignContractsToGroup(groupId, selectedContracts); // ✅ Use API helper
            }
            alert('Contracts assigned successfully!');
            setSelectedContracts([]);
            await fetchGroups();
            await fetchSavedContracts();
          } catch (error) {
            console.error('Error bulk assigning:', error.response?.data || error.message);
            alert(`Failed to assign contracts: ${error.message}`);
          }
        }}
      />

      <WatchlistFilterControls
        data={watchlistItems}
        selectedTickers={selectedTickers}
        setSelectedTickers={setSelectedTickers}
      />

      <WatchlistTable items={watchlistItems} selectedTickers={selectedTickers} />
    </div>
  );
}

export default Watchlist;
