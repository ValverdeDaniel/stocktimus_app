import React, { useState } from 'react';

function WatchlistGroups({ groups, onRunGroup, fetchGroups, selectedContracts, setSelectedContracts, handleRunSelected, handleBulkDelete, handleBulkAssign }) {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name!');
      return;
    }
    try {
      const response = await fetch('/api/watchlist-groups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (!response.ok) throw new Error('Failed to create group');
      alert('Group created successfully!');
      setNewGroupName('');
      await fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="heading-lg">📂 Watchlist Groups</h3>

      {/* Group creation form */}
      <div className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="New group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <button onClick={handleCreateGroup} className="btn-primary">
          Create Group
        </button>
      </div>

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
                  <div key={c.id} className="flex items-center gap-2">
                    {/* ✅ Checkbox to select contract for bulk actions */}
                    <input
                      type="checkbox"
                      checked={selectedContracts.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedContracts((prev) => [...prev, c.id]);
                        } else {
                          setSelectedContracts((prev) => prev.filter((id) => id !== c.id));
                        }
                      }}
                    />
                    <span className="text-sm">
                      {c.ticker} {c.option_type} {c.strike}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted pl-1 italic">
                (No contracts assigned)
              </div>
            )}

            {/* ✅ Group-level bulk toolbar: shows when contracts are selected */}
            {selectedContracts.length > 0 && (
              <div className="flex gap-2 mt-2">
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
                <button onClick={() => handleBulkAssign(selectedGroups)} className="btn-primary">Assign to Groups</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WatchlistGroups;
