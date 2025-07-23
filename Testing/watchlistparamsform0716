import React, { useState } from 'react';
import WatchlistAssignGroupsModal from './WatchlistAssignGroupsModal';
import SearchableTicker from './SearchableTicker';

function WatchlistParamsForm({ groups = [], fetchGroups, fetchSavedContracts, onSimulationComplete }) {
  const [contracts, setContracts] = useState([
    {
      ticker: 'GOOG',
      option_type: 'call',
      strike: 250,
      expiration: '2027-01-15',
      days_to_gain: '',
      number_of_contracts: '',
      average_cost_per_contract: '',
    },
  ]);

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  // ✅ 1. ADD NEW STATE to hold IDs of newly created contracts
  const [newlySavedContractIds, setNewlySavedContractIds] = useState([]);

  const handleContractChange = (index, updatedFields) => {
    setContracts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updatedFields };
      return updated;
    });
  };

  const handleAddContract = () => {
    setContracts(prev => [
      ...prev,
      {
        ticker: '',
        option_type: 'call',
        strike: '',
        expiration: '',
        days_to_gain: '',
        number_of_contracts: '',
        average_cost_per_contract: '',
      },
    ]);
  };

  const handleRemoveContract = (index) => {
    setContracts(prev => prev.filter((_, i) => i !== index));
  };

  const runSimulatorAndGetResults = async (inputContracts) => {
    const sanitizedContracts = inputContracts.map(c => {
      const contract = {
        ticker: c.ticker,
        option_type: c.option_type,
        strike: parseFloat(c.strike),
        expiration: c.expiration,
      };

      // Only include optional fields if they have valid values
      if (c.days_to_gain && c.days_to_gain.toString().trim() !== '') {
        contract.days_to_gain = parseInt(c.days_to_gain);
      }
      
      if (c.number_of_contracts && c.number_of_contracts.toString().trim() !== '') {
        contract.number_of_contracts = parseInt(c.number_of_contracts);
      }
      
      if (c.average_cost_per_contract && c.average_cost_per_contract.toString().trim() !== '') {
        contract.average_cost_per_contract = parseFloat(c.average_cost_per_contract);
      }

      return contract;
    });

    const response = await fetch('/api/run-watchlist/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contracts: sanitizedContracts }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to run watchlist simulator: ${JSON.stringify(errorData)}`);
    }
    return await response.json();
  };

  const handleRunSimulator = async () => {
    try {
      // The onSimulationComplete prop was not being used, let's use it
      const results = await runSimulatorAndGetResults(contracts);
      onSimulationComplete(results); // Pass results to parent component
      alert('Watchlist simulation run successfully!');
    } catch (error) {
      console.error('Error running simulator:', error);
      alert('Failed to run simulator.');
    }
  };

  // ✅ 2. CREATE NEW FUNCTION to handle saving contracts and opening the modal
  const handleSaveContracts = async () => {
    if (contracts.some(c => !c.ticker || !c.strike || !c.expiration)) {
      alert("Please ensure all contracts have a Ticker, Strike, and Expiration date.");
      return;
    }

    try {
      const savedIds = [];
      for (const contract of contracts) {
        // Sanitize contract data similar to simulation
        const contractData = {
          ticker: contract.ticker,
          option_type: contract.option_type,
          strike: parseFloat(contract.strike),
          expiration: contract.expiration,
        };

        // Only include optional fields if they have valid values
        if (contract.days_to_gain && contract.days_to_gain.toString().trim() !== '') {
          contractData.days_to_gain = parseInt(contract.days_to_gain);
        }
        
        if (contract.number_of_contracts && contract.number_of_contracts.toString().trim() !== '') {
          contractData.number_of_contracts = parseInt(contract.number_of_contracts);
        }
        
        if (contract.average_cost_per_contract && contract.average_cost_per_contract.toString().trim() !== '') {
          contractData.average_cost_per_contract = parseFloat(contract.average_cost_per_contract);
        }

        const response = await fetch('/api/saved-contracts/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contractData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to save contract for ${contract.ticker}: ${JSON.stringify(errorData)}`);
        }
        
        const savedContract = await response.json();
        savedIds.push(savedContract.id);
      }

      setNewlySavedContractIds(savedIds);
      setAssignModalVisible(true);

    } catch (error) {
      console.error('Error saving contracts:', error);
      alert(`A problem occurred while saving: ${error.message}`);
    }
  };

  // ✅ 3. CREATE NEW FUNCTION to handle assigning contracts from the modal
  const handleAssignToGroups = async (selectedGroupIds) => {
    if (selectedGroupIds.length === 0) {
        alert("No groups selected. Closing.");
        setAssignModalVisible(false);
        return;
    }
    
    try {
      for (const groupId of selectedGroupIds) {
        const response = await fetch(`/api/watchlist-groups/${groupId}/assign/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contract_ids: newlySavedContractIds }),
        });

        if (!response.ok) {
          throw new Error(`Failed to assign contracts to group ID ${groupId}.`);
        }
      }

      alert('Contracts saved and assigned successfully!');
      setAssignModalVisible(false);
      setNewlySavedContractIds([]);
      
      setContracts([
        {
          ticker: 'GOOG',
          option_type: 'call',
          strike: 250,
          expiration: '2027-01-15',
          days_to_gain: '',
          number_of_contracts: '',
          average_cost_per_contract: '',
        },
      ]);
      
      await fetchGroups();
      await fetchSavedContracts();

    } catch (error) {
      console.error('Error assigning contracts to groups:', error);
      alert(`Failed to assign contracts: ${error.message}`);
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
            {/* Ticker */}
            <div>
              <label className="filter-heading">TICKER</label>
              <SearchableTicker
                value={contract.ticker ? { label: contract.ticker, value: contract.ticker } : null}
                onChange={(selected) => handleContractChange(index, { ticker: selected?.value || '' })}
              />
            </div>

            {/* Option Type */}
            <div>
              <label className="filter-heading">OPTION TYPE</label>
              <select
                className="input"
                value={contract.option_type}
                onChange={(e) => handleContractChange(index, { option_type: e.target.value })}
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
            </div>

            {/* Strike */}
            <div>
              <label className="filter-heading">STRIKE</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 220"
                value={contract.strike}
                onChange={(e) => handleContractChange(index, { strike: e.target.value })}
              />
            </div>

            {/* Expiration */}
            <div>
              <label className="filter-heading">EXPIRATION (YYYY-MM-DD)</label>
              <input
                type="text"
                className="input"
                placeholder="2025-12-19"
                value={contract.expiration}
                onChange={(e) => handleContractChange(index, { expiration: e.target.value })}
                pattern="\d{4}-\d{2}-\d{2}"
                title="Date must be in YYYY-MM-DD format"
                required
              />
              <small className="text-xs text-gray-400">Format: YYYY-MM-DD</small>
            </div>

            {/* Days to Gain */}
            <div>
              <label className="filter-heading">
                DAYS TO GAIN <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                className="input"
                placeholder="Auto: 50% of DTE"
                title="Optional. Defaults to 50% of time until expiration if left blank."
                value={contract.days_to_gain || ''}
                onChange={(e) => handleContractChange(index, { days_to_gain: e.target.value })}
              />
              <small className="text-xs text-gray-400">Default: 50% of DTE</small>
            </div>

            {/* Number of Contracts */}
            <div>
              <label className="filter-heading">
                NUMBER OF CONTRACTS <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                className="input"
                placeholder="Defaults to 1"
                title="Optional. Defaults to 1 contract if left blank."
                value={contract.number_of_contracts || ''}
                onChange={(e) => handleContractChange(index, { number_of_contracts: e.target.value })}
              />
              <small className="text-xs text-gray-400">Default: 1 contract</small>
            </div>

            {/* Avg Cost per Contract */}
            <div>
              <label className="filter-heading">
                AVG COST PER CONTRACT <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                className="input"
                placeholder="Defaults to live premium"
                title="Optional. Defaults to last traded premium if left blank."
                value={contract.average_cost_per_contract || ''}
                onChange={(e) => handleContractChange(index, { average_cost_per_contract: e.target.value })}
              />
              <small className="text-xs text-gray-400">Default: current option premium</small>
            </div>
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
        {/* ✅ 4. UPDATE BUTTON to use the new handler function */}
        <button
          type="button"
          onClick={handleSaveContracts}
          className="btn-primary"
        >
          Save to Watchlist Contract Groups
        </button>
      </div>
      
      {/* ✅ 5. UPDATE MODAL to pass the new props */}
      <WatchlistAssignGroupsModal
        isOpen={assignModalVisible}
        onClose={() => setAssignModalVisible(false)}
        groups={groups}
        fetchGroups={fetchGroups}
        contracts={newlySavedContractIds}
        onAssign={handleAssignToGroups}
      />
    </div>
  );
}

export default WatchlistParamsForm;
