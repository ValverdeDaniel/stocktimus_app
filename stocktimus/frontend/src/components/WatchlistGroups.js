import React, { useState } from 'react';

function WatchlistGroups({ groups, onRunGroup, fetchGroups }) {
  const [newGroupName, setNewGroupName] = useState('');

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
      await fetchGroups();  // 🔥 refresh groups list
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="heading-lg">📂 Watchlist Groups</h3>

      {/* 🔥 Group creation form */}
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

      {/* Existing groups */}
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
              <div className="text-sm text-muted pl-1">
                {group.contracts.map((c) => (
                  <div key={c.id}>
                    • {c.ticker} {c.option_type} {c.strike}
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
    </div>
  );
}

export default WatchlistGroups;
