import React, { useState } from 'react';
import WatchlistAssignGroupsModal from './WatchlistAssignGroupsModal';

function WatchlistGroups({
  groups,
  onRunGroup,
  fetchGroups,
  selectedContracts,
  setSelectedContracts,
  handleRunSelected,
  handleBulkDelete,
  handleBulkAssign,
}) {
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [contractsForAssignment, setContractsForAssignment] = useState([]);

  const openAssignModalForContracts = (contracts) => {
    setContractsForAssignment(contracts);
    setAssignModalVisible(true);
  };

  // === 🛠️ PART 3: Create Handlers ===
  const handleResetDays = async (contractId) => {
    try {
      const res = await fetch(`/api/saved-contracts/${contractId}/reset-days/`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Reset failed');
      await fetchGroups(); // refresh the view
    } catch (err) {
      console.error("Error resetting countdown:", err);
      alert("Reset failed.");
    }
  };

  const handleRefresh = async (contractId) => {
    try {
      const res = await fetch(`/api/saved-contracts/${contractId}/refresh/`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Refresh failed');
      await fetchGroups(); // refresh the view
    } catch (err) {
      console.error("Error refreshing contract:", err);
      alert("Refresh failed.");
    }
  };

  return (
    <div className="mt-8">
      <h3 className="heading-lg">📂 Watchlist Groups</h3>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="card card-hover">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-primary">{group.name}</span>
              <button
                onClick={() => onRunGroup(group.id)}
                className="btn-primary text-xs"
              >
                Run Group
              </button>
            </div>

            {group.contracts.length > 0 ? (
              <div className="text-sm text-muted pl-1 space-y-1">
                {group.contracts.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedContracts.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContracts((prev) => [...prev, c.id]);
                        } else {
                          setSelectedContracts((prev) => prev.filter((id) => id !== c.id));
                        }
                      }}
                    />
                    <div className="flex-grow">
                      <div className="text-sm leading-snug">
                        <div><strong>{c.ticker}</strong> {c.option_type?.toUpperCase()} @ {c.strike}</div>
                        <div className="text-xs text-muted">
                          Exp: {c.expiration} • Qty: {c.number_of_contracts} • Cost: ${c.initial_cost_per_contract}
                        </div>
                        <div className="text-xs text-muted">
                          Added: {c.first_added_to_group_date?.slice(0, 10)} • Reset: {c.last_reset_date?.slice(0, 10)}
                        </div>
                        <div className="text-xs text-muted">
                          Days Left: {c.dynamic_days_to_gain} • Last Refresh: {c.last_refresh_date?.slice(0, 10)}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleResetDays(c.id)}
                          className="btn-blue text-xs"
                        >
                          Reset Countdown
                        </button>
                        <button
                          onClick={() => handleRefresh(c.id)}
                          className="btn-secondary text-xs"
                        >
                          Refresh Data
                        </button>
                        <button
                          onClick={() => openAssignModalForContracts([c.id])}
                          className="btn-blue text-xs"
                        >
                          Update Groups
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted pl-1 italic">
                (No contracts assigned)
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedContracts.length > 0 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={handleRunSelected} className="btn-primary">Run Selected</button>
          <button onClick={handleBulkDelete} className="btn-red">Delete Selected</button>
          <button
            onClick={() => openAssignModalForContracts(selectedContracts)}
            className="btn-primary"
          >
            Assign Selected to Groups
          </button>
        </div>
      )}

      <WatchlistAssignGroupsModal
        isOpen={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        groups={groups}
        fetchGroups={fetchGroups}
        contracts={contractsForAssignment}
        onAssign={async (selectedGroupIds, mode) => {
          try {
            for (const groupId of selectedGroupIds) {
              const response = await fetch(`/api/watchlist-groups/${groupId}/assign/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contract_ids: contractsForAssignment,
                  mode,
                }),
              });
              if (!response.ok) throw new Error(`Failed assigning contracts to group ${groupId}`);
            }
            alert('Contracts assigned successfully!');
            setAssignModalVisible(false);
            await fetchGroups();
          } catch (error) {
            console.error('Error assigning contracts:', error);
            alert('Failed to assign contracts to groups.');
          }
        }}
      />
    </div>
  );
}

export default WatchlistGroups;
