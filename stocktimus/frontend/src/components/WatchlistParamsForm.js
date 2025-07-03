import React, { useState } from 'react';

function WatchlistParamsForm({ onAdd, groups = [], fetchGroups, fetchSavedContracts }) {
  const [params, setParams] = useState({
    ticker: 'AAPL',
    option_type: 'call',
    strike: 220,
    expiration: '2025-12-19',
    days_to_gain: 30,
    number_of_contracts: 1,
    average_cost_per_contract: 5.0,
  });

  const [assignDropdownVisible, setAssignDropdownVisible] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);

  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(params);
  };

  const handleSave = async () => {
    try {
      const sanitizedParams = {
        ...params,
        strike: parseFloat(params.strike),
        days_to_gain: parseInt(params.days_to_gain),
        number_of_contracts: parseInt(params.number_of_contracts),
        average_cost_per_contract: parseFloat(params.average_cost_per_contract),
        label: "",
      };

      const response = await fetch('/api/saved-contracts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedParams),
      });
      if (!response.ok) throw new Error('Failed to save contract');
      alert('Contract saved successfully!');
      await fetchSavedContracts();  // refresh contracts list
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handleAssignToGroups = async () => {
    try {
      const sanitizedParams = {
        ...params,
        strike: parseFloat(params.strike),
        days_to_gain: parseInt(params.days_to_gain),
        number_of_contracts: parseInt(params.number_of_contracts),
        average_cost_per_contract: parseFloat(params.average_cost_per_contract),
        label: "",
      };

      // Save the contract first
      const response = await fetch('/api/saved-contracts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedParams),
      });
      if (!response.ok) throw new Error('Failed to save contract before assigning');

      const savedContract = await response.json();
      const contractId = savedContract.id;

      // Assign to each selected group
      for (const groupId of selectedGroups) {
        const assignResponse = await fetch(`/api/watchlist-groups/${groupId}/assign/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contract_ids: [contractId] }),
        });
        if (!assignResponse.ok) throw new Error(`Failed to assign to group ${groupId}`);
      }

      alert('Contract saved and assigned successfully!');
      setAssignDropdownVisible(false);
      setSelectedGroups([]);
      await fetchGroups();
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error saving and assigning contract:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 mb-6">
      <h3 className="heading-lg">Add Watchlist Item</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.keys(params).map((key) => (
          <div key={key}>
            <label className="filter-heading">{key.replace(/_/g, ' ').toUpperCase()}</label>
            <input
              className="input"
              name={key}
              value={params[key]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <button type="submit" className="btn-primary">Add to Watchlist</button>
        <button type="button" onClick={handleSave} className="btn-secondary">Save Contract</button>
        <button
          type="button"
          onClick={() => setAssignDropdownVisible(!assignDropdownVisible)}
          className="btn-primary text-xs"
        >
          Assign to Group
        </button>
      </div>

      {assignDropdownVisible && (
        <div className="flex flex-col gap-2 mt-3">
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
            type="button"
            onClick={handleAssignToGroups}
            className="btn-primary text-xs mt-2"
          >
            Confirm Assign
          </button>
        </div>
      )}
    </form>
  );
}

export default WatchlistParamsForm;
