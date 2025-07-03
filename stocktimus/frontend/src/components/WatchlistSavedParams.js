import React, { useState } from 'react';

function WatchlistSavedParams({
  savedParams,
  selectedContracts,
  setSelectedContracts,
  handleRunSelected,
  onLoad,
  onDelete,
  groups = [],
  fetchGroups,
  fetchSavedContracts,
}) {
  // Store which contract’s assign dropdown is open
  const [assignDropdownVisible, setAssignDropdownVisible] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);

  const handleAssignToGroup = async (contractId) => {
    if (selectedGroups.length === 0) {
      alert('Please select at least one group!');
      return;
    }
    try {
      for (const groupId of selectedGroups) {
        const response = await fetch(`/api/watchlist-groups/${groupId}/assign/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contract_ids: [contractId] }),
        });
        if (!response.ok) throw new Error(`Failed to assign to group ID ${groupId}`);
      }
      alert('Contract assigned to selected groups!');
      setAssignDropdownVisible(null);  // close dropdown
      setSelectedGroups([]);           // reset selection
      await fetchGroups();
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error assigning contract:', error);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="heading-lg">💾 Saved Watchlist Items</h3>

      <div className="space-y-4">
        {savedParams.map((param) => (
          <div key={param.id} className="card card-hover">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedContracts.includes(param.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedContracts((prev) => [...prev, param.id]);
                    } else {
                      setSelectedContracts((prev) => prev.filter((id) => id !== param.id));
                    }
                  }}
                />
                <span className="text-sm font-bold text-text">
                  {param.ticker} {param.option_type}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onLoad(param)} className="btn-blue">Load</button>
                <button onClick={() => onDelete(param.id)} className="btn-red">Delete</button>
                <button
                  onClick={() => {
                    setAssignDropdownVisible(assignDropdownVisible === param.id ? null : param.id);
                    setSelectedGroups([]);  // reset on open
                  }}
                  className="btn-primary text-xs"
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Assign dropdown */}
            {assignDropdownVisible === param.id && (
              <div className="flex flex-col gap-2 mb-3">
                <label className="text-xs text-muted">Select groups:</label>
                <select
                  className="input"
                  multiple
                  value={selectedGroups}
                  onChange={(e) =>
                    setSelectedGroups(
                      Array.from(e.target.selectedOptions, (option) => option.value)
                    )
                  }
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssignToGroup(param.id)}
                  className="btn-primary text-xs mt-2"
                >
                  Confirm Assign
                </button>
              </div>
            )}

            <div className="text-sm text-muted flex flex-wrap gap-x-8 gap-y-1 pl-1">
              {Object.entries(param).map(([k, v]) => (
                !['id', 'created_at', 'user'].includes(k) && (
                  <div key={k}><strong>{k}:</strong> {v}</div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedContracts.length > 0 && (
        <div className="mt-4">
          <button onClick={handleRunSelected} className="btn-primary">
            Run Selected Contracts
          </button>
        </div>
      )}
    </div>
  );
}

export default WatchlistSavedParams;
