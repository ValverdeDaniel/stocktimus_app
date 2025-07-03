import React, { useState } from 'react';
import WatchlistAssignGroupsModal from './WatchlistAssignGroupsModal';

function WatchlistParamsForm({ groups = [], fetchGroups, fetchSavedContracts, onSimulationComplete }) {
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

  const handleRunSimulator = async () => {
    try {
      const sanitizedContracts = contracts.map(c => ({
        ...c,
        strike: parseFloat(c.strike),
        days_to_gain: parseInt(c.days_to_gain),
        number_of_contracts: parseInt(c.number_of_contracts),
        average_cost_per_contract: parseFloat(c.average_cost_per_contract),
      }));

      const response = await fetch('/api/run-watchlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contracts: sanitizedContracts }),
      });

      if (!response.ok) throw new Error('Failed to run watchlist simulator');
      const data = await response.json();
      console.log('Simulation results:', data);

      alert('Watchlist simulation run successfully!');
      if (onSimulationComplete) {
        onSimulationComplete(data);
      }
    } catch (error) {
      console.error('Error running simulator:', error);
      alert('Failed to run simulator.');
    }
  };

  return (
    <div className="card space-y-4 mb-6">
      <h3 className="heading-lg">📈 Watchlist Contracts</h3>

      {contracts.map((contract, index) => (
        <div key={index} className="card space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-primary">Contract {index + 1}</span>
            <button onClick={() => handleRemoveContract(index)} className="btn-red text-xs">Remove</button>
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

      <WatchlistAssignGroupsModal
        isOpen={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        groups={groups}
        fetchGroups={fetchGroups}
        onAssign={async (selectedGroupIds) => {
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

              for (const groupId of selectedGroupIds) {
                const assignRes = await fetch(`/api/watchlist-groups/${groupId}/assign/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contract_ids: [contractId] }),
                });
                if (!assignRes.ok) throw new Error(`Failed to assign contract ${contractId} to group ${groupId}`);
              }
            }
            alert('Contracts saved and assigned successfully!');
            setAssignModalVisible(false);
            await fetchGroups();
            await fetchSavedContracts();
          } catch (error) {
            console.error('Error assigning contracts:', error);
            alert('Failed to assign contracts to groups.');
          }
        }}
      />
    </div>
  );
}

export default WatchlistParamsForm;
