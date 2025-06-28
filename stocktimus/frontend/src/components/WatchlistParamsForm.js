import React, { useState } from 'react';

function WatchlistParamsForm({ onAdd }) {
  const [params, setParams] = useState({
    ticker: 'AAPL',
    option_type: 'call',
    strike: 220,
    expiration: '2025-12-19',
    days_to_gain: 30,
    number_of_contracts: 1,
    average_cost_per_contract: 5.0,
  });

  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(params);
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
      <button type="submit" className="btn-primary">Add to Watchlist</button>
    </form>
  );
}

export default WatchlistParamsForm;
