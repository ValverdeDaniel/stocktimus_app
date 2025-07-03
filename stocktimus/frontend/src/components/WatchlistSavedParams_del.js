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
  const [assignDropdownVisible, setAssignDropdownVisible] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showSavedItems, setShowSavedItems] = useState(true);

  const handleBulkDelete = async () => {
    for (const id of selectedContracts) {
      await onDelete(id);
    }
    setSelectedContracts([]);
  };

  const handleBulkAssign = async () => {
    try {
      for (const contractId of selectedContracts) {
        for (const groupId of selectedGroups) {
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
      setSelectedGroups([]);
      await fetchGroups();
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error bulk assigning:', error);
    }
  };

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
      setAssignDropdownVisible(null);
      setSelectedGroups([]);
      await fetchGroups();
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error assigning contract:', error);
    }
  };

  // ✅ NEW: Group contracts by ticker for visual organization
  const grouped = savedParams.reduce((acc, c) => {
    const key = c.ticker.toUpperCase();
    acc[key] = acc[key] || [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="mt-8">
      <h3 className="heading-lg">💾 Saved Watchlist Items</h3>

      <button
        onClick={() => setShowSavedItems(!showSavedItems)}
        className="btn-secondary mb-4"
      >
        {showSavedItems ? 'Hide Saved Watchlist Items' : 'Show Saved Watchlist Items'}
      </button>

      {showSavedItems && (
        <>
          {selectedContracts.length > 0 && (
            <div className="flex gap-2 mb-4 items-center">
              <button onClick={handleRunSelected} className="btn-primary">Run Selected</button>
              <button onClick={handleBulkDelete} className="btn-red">Delete Selected</button>
              <select
                className="input flex-1"
                multiple
                onChange={(e) => setSelectedGroups([...e.target.selectedOptions].map(opt => opt.value))}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button onClick={handleBulkAssign} className="btn-primary">Assign to Groups</button>
            </div>
          )}

          {/* ✅ NEW: Render grouped contracts by ticker */}
          <div className="space-y-6">
            {Object.entries(grouped).map(([ticker, contracts]) => (
              <div key={ticker}>
                <h4 className="heading-lg">{ticker} Contracts</h4>
                <div className="space-y-4">
                  {contracts.map((param) => (
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
        </>
      )}
    </div>
  );
}

export default WatchlistSavedParams;
