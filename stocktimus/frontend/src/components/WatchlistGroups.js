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

  const handleCreateGroup = async (name) => {
    try {
      const response = await fetch('/api/watchlist-groups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to create group');
      await fetchGroups();
      alert('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group');
    }
  };

  const openAssignModalForContracts = (contracts) => {
    setContractsForAssignment(contracts);
    setAssignModalVisible(true);
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
                  <div key={c.id} className="flex items-center gap-2">
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
                    <button
                      onClick={() => openAssignModalForContracts([c.id])}
                      className="btn-blue text-xs"
                    >
                      Update Groups
                    </button>
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
        <div className="flex gap-2 mt-4">
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
        onAssign={async (selectedGroupIds) => {
          try {
            await handleBulkAssign(selectedGroupIds, contractsForAssignment);
            setAssignModalVisible(false);
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
