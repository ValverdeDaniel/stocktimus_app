import React, { useState } from 'react';
import SearchableTicker from './SearchableTicker';

export default function ContractSelector({ contract, index, onChange }) {
  const [expirations, setExpirations] = useState([]);
  const [strikes, setStrikes] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optionChainMap, setOptionChainMap] = useState({});

  const handleTickerSelect = async (selected) => {
    const updated = {
      ...contract,
      ticker: selected?.value || '',
      expiration: '',
      strike: ''
    };
    onChange(index, updated);

    if (!selected) return;
    const ticker = selected.value.toUpperCase();

    if (optionChainMap[ticker]) {
      const cached = optionChainMap[ticker];
      setExpirations(cached.expirations);
      setStrikes(cached.strikes);
      setCurrentPrice(cached.currentPrice);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/options-chain?ticker=${ticker}`);
      if (!res.ok) throw new Error('Failed to fetch option chain from backend');
      const json = await res.json();

      const { expirations = [], strikes = [], currentPrice = null } = json;
      const cached = { expirations, strikes, currentPrice };
      setOptionChainMap((prev) => ({ ...prev, [ticker]: cached }));
      setExpirations(expirations);
      setStrikes(strikes);
      setCurrentPrice(currentPrice);
    } catch (error) {
      console.error('Error fetching option chain from backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...contract, [field]: value };
    onChange(index, updated);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {/* Ticker Select */}
      <div>
        <label className="filter-heading">TICKER</label>
        <SearchableTicker
          value={contract.ticker ? { label: contract.ticker, value: contract.ticker } : null}
          onChange={handleTickerSelect}
        />
      </div>

      {/* Option Type */}
      <div>
        <label className="filter-heading">OPTION TYPE</label>
        <select
          name="option_type"
          value={contract.option_type}
          onChange={(e) => handleFieldChange('option_type', e.target.value)}
          className="input"
        >
          <option value="call">Call</option>
          <option value="put">Put</option>
        </select>
      </div>

      {/* Expiration */}
      <div>
        <label className="filter-heading">EXPIRATION</label>
        <select
          name="expiration"
          value={contract.expiration}
          onChange={(e) => handleFieldChange('expiration', e.target.value)}
          disabled={loading || expirations.length === 0}
          className="input"
        >
          <option value="">Select Expiration</option>
          {expirations.map((exp) => (
            <option key={exp} value={exp}>{exp}</option>
          ))}
        </select>
        {loading && <p className="text-sm text-gray-500">Loading expirations...</p>}
        {!contract.ticker && <p className="text-error text-xs">Select a ticker first</p>}
      </div>

      {/* Strike */}
      <div>
        <label className="filter-heading">STRIKE</label>
        <select
          name="strike"
          value={contract.strike}
          onChange={(e) => handleFieldChange('strike', e.target.value)}
          disabled={!contract.expiration || strikes.length === 0}
          className="input"
        >
          <option value="">Select Strike</option>
          {strikes
            .filter(strike => currentPrice && Math.abs(strike - currentPrice) <= currentPrice * 0.3)
            .map((strike) => (
              <option key={strike} value={strike}>{strike}</option>
            ))}
        </select>
        {!contract.expiration && <p className="text-error text-xs">Select expiration first</p>}
      </div>

      {/* Current Price Display */}
      <div className="col-span-2 md:col-span-1">
        <label className="filter-heading">CURRENT PRICE</label>
        <div className="text-sm py-2 px-3 bg-gray-100 rounded border border-gray-300">
          {currentPrice ? `$${Number(currentPrice).toFixed(2)}` : 'N/A'}
        </div>
      </div>
    </div>
  );
}
