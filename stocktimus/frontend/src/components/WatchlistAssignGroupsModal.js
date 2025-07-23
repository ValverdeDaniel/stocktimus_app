import React, { useState, useEffect } from 'react';
import { createWatchlistGroup } from '../services/api'; // ✅ Use named function from api.js

export default function WatchlistAssignGroupsModal({
  isOpen,
  onClose,
  onAssign,
  groups,
  fetchGroups,
  contracts = [], // selected contract IDs
}) {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false); // Track group creation
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedGroups([]);
    setError('');
  }, [isOpen]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Group name cannot be empty.');
      return;
    }
    setError('');
    setIsCreating(true);
    try {
      const response = await createWatchlistGroup({ name: newGroupName });
      const newGroup = response.data;

      setSelectedGroups((prev) => [...prev, newGroup.id]);
      setNewGroupName('');

      // Refresh group list
      await fetchGroups?.();
    } catch (error) {
      console.error('Error creating group:', error.response?.data || error.message);
      setError(`Failed to create group: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (contracts.some((id) => typeof id !== 'number')) {
      alert("One or more contracts haven't been saved yet.");
      return;
    }
    await onAssign(selectedGroups, 'append'); // 🔁 always append
    setSelectedGroups([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="card bg-surface p-6 max-w-md w-full space-y-4">
        <h3 className="heading-lg">Assign to Watchlist Contract Groups</h3>

        <div className="text-sm mb-2">
          <p className="text-text">
            <strong>
              Assigning {contracts.length} contract{contracts.length > 1 ? 's' : ''} to selected group
              {selectedGroups.length > 1 ? 's' : ''}.
            </strong>
          </p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto border rounded p-2">
          {groups?.map((group) => (
            <label key={group.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedGroups.includes(group.id)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...selectedGroups, group.id]
                    : selectedGroups.filter((id) => id !== group.id);
                  setSelectedGroups(updated);
                }}
              />
              {group.name}
            </label>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          <input
            className="input flex-1"
            placeholder="New Watchlist Contract Group"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button
            className="btn-primary text-xs"
            onClick={handleCreateGroup}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>

        <div className="flex gap-2 mt-4 justify-end">
          <button className="btn-secondary text-xs" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary text-xs"
            onClick={handleSave}
            disabled={selectedGroups.length === 0}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
