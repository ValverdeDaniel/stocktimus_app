import React, { useState } from 'react';
import WatchlistAssignGroupsModal from './WatchlistAssignGroupsModal';
import SearchableTicker from './SearchableTicker';
import apiClient from '../services/api'; // ✅ Import the Axios client

function WatchlistParamsForm({ groups = [], fetchGroups, fetchSavedContracts, onSimulationStart, onSimulationComplete }) {
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
  const [newlySavedContractIds, setNewlySavedContractIds] = useState([]);

  // --- Handle Contract Change ---
  const handleContractChange = (index, updatedFields) => {
    console.log(`✏ Updating contract at index ${index} with:`, updatedFields);
    setContracts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updatedFields };
      console.log('📦 Updated Contracts State:', updated);
      return updated;
    });
  };

  // --- Add New Contract ---
  const handleAddContract = () => {
    console.log('➕ Adding new empty contract.');
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
    console.log('📦 Current Contracts State After Add:', contracts);
  };

  // --- Remove Contract ---
  const handleRemoveContract = (index) => {
    console.log(`🗑 Removing contract at index ${index}:`, contracts[index]);
    setContracts(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log('📦 Updated Contracts After Remove:', updated);
      return updated;
    });
  };

  // --- Run Simulator ---
  const runSimulatorAndGetResults = async (inputContracts) => {
    console.log('🚀 Preparing contracts for simulation:', inputContracts);

    const sanitizedContracts = inputContracts.map(c => {
      const contract = {
        ticker: c.ticker,
        option_type: c.option_type,
        strike: parseFloat(c.strike),
        expiration: c.expiration,
      };
      if (c.days_to_gain) contract.days_to_gain = parseInt(c.days_to_gain);
      if (c.number_of_contracts) contract.number_of_contracts = parseInt(c.number_of_contracts);
      if (c.average_cost_per_contract) contract.average_cost_per_contract = parseFloat(c.average_cost_per_contract);
      return contract;
    });

    console.log('🧹 Sanitized Contracts:', sanitizedContracts);

    const response = await apiClient.post('/run-watchlist/', { contracts: sanitizedContracts });
    console.log('✅ API Response from /run-watchlist/:', response.data);

    return response.data;
  };

  const handleRunSimulator = async () => {
    try {
      console.log('▶ Running watchlist simulator with contracts:', contracts);

      // Start loading state with contract count
      if (onSimulationStart) {
        onSimulationStart(contracts.length);
      }

      const results = await runSimulatorAndGetResults(contracts);
      console.log('🎯 Simulation Results:', results);
      onSimulationComplete(results);
      console.log('📊 Watchlist Table updated with simulation results.');
      // Removed success alert - silent success with auto-scroll
    } catch (error) {
      console.error('❌ Error running simulator:', error);
      alert('Failed to run simulator.');
    }
  };

  // --- Save Contracts ---
  const handleSaveContracts = async () => {
    console.log('💾 Saving contracts:', contracts);
    if (contracts.some(c => !c.ticker || !c.strike || !c.expiration)) {
      console.warn('⚠ Missing required fields in one or more contracts.');
      alert("Please ensure all contracts have a Ticker, Strike, and Expiration date.");
      return;
    }

    try {
      const savedIds = [];
      for (const contract of contracts) {
        const contractData = {
          ticker: contract.ticker,
          option_type: contract.option_type,
          strike: parseFloat(contract.strike),
          expiration: contract.expiration,
        };
        if (contract.days_to_gain) contractData.days_to_gain = parseInt(contract.days_to_gain);
        if (contract.number_of_contracts) contractData.number_of_contracts = parseInt(contract.number_of_contracts);
        if (contract.average_cost_per_contract) contractData.average_cost_per_contract = parseFloat(contract.average_cost_per_contract);

        console.log('📤 Saving contract to /saved-contracts/:', contractData);
        const response = await apiClient.post('/saved-contracts/', contractData);
        console.log('✅ Saved Contract Response:', response.data);
        savedIds.push(response.data.id);
      }

      setNewlySavedContractIds(savedIds);
      console.log('📦 Newly Saved Contract IDs:', savedIds);
      setAssignModalVisible(true);
    } catch (error) {
      console.error('❌ Error saving contracts:', error);
      alert(`A problem occurred while saving: ${error.message}`);
    }
  };

  // --- Assign Contracts to Groups ---
  const handleAssignToGroups = async (selectedGroupIds) => {
    console.log('🔗 Assigning contracts to groups:', selectedGroupIds);
    if (selectedGroupIds.length === 0) {
      alert("No groups selected. Closing.");
      setAssignModalVisible(false);
      return;
    }

    try {
      for (const groupId of selectedGroupIds) {
        console.log(`📤 Assigning to group ${groupId} with contracts:`, newlySavedContractIds);
        await apiClient.post(`/watchlist-groups/${groupId}/assign-contracts/`, {
          contract_ids: newlySavedContractIds,
        });
      }

      console.log('✅ Successfully assigned contracts to groups.');
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

      console.log('🔄 Fetching latest groups and saved contracts.');
      await fetchGroups();
      await fetchSavedContracts();
    } catch (error) {
      console.error('❌ Error assigning contracts to groups:', error);
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
            <div>
              <label className="filter-heading">TICKER</label>
              <SearchableTicker
                value={contract.ticker ? { label: contract.ticker, value: contract.ticker } : null}
                onChange={(selected) => handleContractChange(index, { ticker: selected?.value || '' })}
              />
            </div>

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

            <div>
              <label className="filter-heading">STRIKE</label>
              <input
                type="number"
                className="input"
                value={contract.strike}
                onChange={(e) => handleContractChange(index, { strike: e.target.value })}
              />
            </div>

            <div>
              <label className="filter-heading">EXPIRATION (YYYY-MM-DD)</label>
              <input
                type="text"
                className="input"
                placeholder="YYYY-MM-DD"
                value={contract.expiration}
                onChange={(e) => handleContractChange(index, { expiration: e.target.value })}
                pattern="\d{4}-\d{2}-\d{2}"
                title="Date must be in YYYY-MM-DD format"
              />
              <small className="text-xs text-gray-400">Format: YYYY-MM-DD</small>
            </div>

            <div>
              <label className="filter-heading">DAYS TO GAIN <span className="text-gray-400">(optional)</span></label>
              <input
                type="number"
                className="input"
                value={contract.days_to_gain || ''}
                onChange={(e) => handleContractChange(index, { days_to_gain: e.target.value })}
              />
            </div>

            <div>
              <label className="filter-heading">NUMBER OF CONTRACTS <span className="text-gray-400">(optional)</span></label>
              <input
                type="number"
                className="input"
                value={contract.number_of_contracts || ''}
                onChange={(e) => handleContractChange(index, { number_of_contracts: e.target.value })}
              />
            </div>

            <div>
              <label className="filter-heading">AVG COST PER CONTRACT <span className="text-gray-400">(optional)</span></label>
              <input
                type="number"
                className="input"
                value={contract.average_cost_per_contract || ''}
                onChange={(e) => handleContractChange(index, { average_cost_per_contract: e.target.value })}
              />
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
        <button type="button" onClick={handleSaveContracts} className="btn-primary">
          Save to Watchlist Contract Groups
        </button>
      </div>

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
