import React, { useState } from 'react';

function WatchlistParamsForm({ handleAddToPending, groups = [], fetchGroups, fetchSavedContracts }) {
  const [contracts, setContracts] = useState([
    {
      ticker: 'AAPL',
      option_type: 'call',
      strike: 220,
      expiration: '2025-12-19',
      days_to_gain: 30,
      number_of_contracts: 1,
      average_cost_per_contract: 5.0,
    },
  ]);

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');

  const handleContractChange = (index, e) => {
    const updated = [...contracts];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    setContracts(updated);
  };

  const handleAddContract = () => {
    setContracts((prev) => [
      ...prev,
      {
        ticker: '',
        option_type: 'call',
        strike: 0,
        expiration: '',
        days_to_gain: 0,
        number_of_contracts: 1,
        average_cost_per_contract: 0,
      },
    ]);
  };

  const handleRemoveContract = (index) => {
    setContracts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveContract = async (contract) => {
    try {
      const sanitized = {
        ...contract,
        strike: parseFloat(contract.strike),
        days_to_gain: parseInt(contract.days_to_gain),
        number_of_contracts: parseInt(contract.number_of_contracts),
        average_cost_per_contract: parseFloat(contract.average_cost_per_contract),
        label: "",
      };

      const response = await fetch('/api/saved-contracts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
      });
      if (!response.ok) throw new Error('Failed to save contract');
      alert('Contract saved successfully!');
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handleAssignAllToGroups = async () => {
    try {
      for (const contract of contracts) {
        const sanitized = {
          ...contract,
          strike: parseFloat(contract.strike),
          days_to_gain: parseInt(contract.days_to_gain),
          number_of_contracts: parseInt(contract.number_of_contracts),
          average_cost_per_contract: parseFloat(contract.average_cost_per_contract),
          label: "",
        };

        const response = await fetch('/api/saved-contracts/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitized),
        });
        if (!response.ok) throw new Error('Failed to save contract');

        const saved = await response.json();
        const contractId = saved.id;

        for (const groupId of selectedGroups) {
          const assignRes = await fetch(`/api/watchlist-groups/${groupId}/assign/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contract_ids: [contractId] }),
          });
          if (!assignRes.ok) throw new Error(`Failed to assign to group ${groupId}`);
        }
      }

      alert('All contracts saved and assigned successfully!');
      setAssignModalVisible(false);
      setSelectedGroups([]);
      setNewGroupName('');
      await fetchGroups();
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error assigning contracts:', error);
    }
  };

  const handleCreateNewGroup = async () => {
    try {
      if (!newGroupName.trim()) return alert('Group name cannot be empty!');
      const response = await fetch('/api/watchlist-groups/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (!response.ok) throw new Error('Failed to create new group');
      alert('New Watchlist Contract Group created!');
      setNewGroupName('');
      await fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleRunSimulator = () => {
    contracts.forEach(handleAddToPending);
  };

  return (
    <div className="card space-y-4 mb-6">
      <h3 className="heading-lg">📈 Watchlist Contracts</h3>

      {/* === Editable Contract Forms === */}
      {contracts.map((contract, index) => (
        <div key={index} className="card space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-primary">Contract {index + 1}</span>
            <div className="flex gap-2">
              <button onClick={() => handleSaveContract(contract)} className="btn-primary text-xs">Save</button>
              <button onClick={() => handleRemoveContract(index)} className="btn-red text-xs">Remove</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(contract).map((key) => (
              <div key={key}>
                <label className="filter-heading">{key.replace(/_/g, ' ').toUpperCase()}</label>
                <input
                  className="input"
                  name={key}
                  value={contract[key]}
                  onChange={(e) => handleContractChange(index, e)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* === Controls === */}
      <button type="button" onClick={handleAddContract} className="btn-primary">
        + Add Contract
      </button>

      <div className="flex gap-2 mt-4 items-center flex-wrap">
        <button type="button" onClick={handleRunSimulator} className="btn-primary">
          Run Watchlist Simulator
        </button>
        <button type="button" onClick={() => setAssignModalVisible(true)} className="btn-primary">
          Save to Watchlist Contract Groups
        </button>
      </div>

      {/* === Modal === */}
      {assignModalVisible && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-background p-6 rounded shadow-lg max-w-md w-full space-y-4">
            <h3 className="heading-lg">Assign to Watchlist Contract Groups</h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(String(g.id))}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedGroups((prev) =>
                        checked
                          ? [...prev, String(g.id)]
                          : prev.filter((id) => id !== String(g.id))
                      );
                    }}
                  />
                  <span>{g.name}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <input
                className="input flex-1"
                placeholder="New Watchlist Contract Group"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <button onClick={handleCreateNewGroup} className="btn-primary text-xs">Create</button>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAssignModalVisible(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleAssignAllToGroups} className="btn-primary text-xs">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchlistParamsForm;
