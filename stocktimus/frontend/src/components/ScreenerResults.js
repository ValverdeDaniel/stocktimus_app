import React, { useState } from 'react';
import { runScreenerBackend } from '../services/api';

function ScreenerResults() {
  const [paramSets, setParamSets] = useState([
    {
      tickers: 'AAPL',
      option_type: 'call',
      days_until_exp: 90,
      strike_pct: 0.1,
      days_to_gain: 30,
      stock_gain_pct: 0.08,
      allocation: 1000,
      label: 'Scenario 1'
    }
  ]);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleParamChange = (index, name, value) => {
    const updated = [...paramSets];
    updated[index][name] = value;
    setParamSets(updated);
  };

  const addScenario = () => {
    setParamSets([
      ...paramSets,
      {
        tickers: '',
        option_type: 'call',
        days_until_exp: 30,
        strike_pct: 0.1,
        days_to_gain: 30,
        stock_gain_pct: 0.05,
        allocation: 1000,
        label: `Scenario ${paramSets.length + 1}`
      }
    ]);
  };

  const removeScenario = (index) => {
    setParamSets(paramSets.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formatted = paramSets.map(p => ({
        ...p,
        tickers: p.tickers.split(',').map(t => t.trim().toUpperCase()),
        strike_pct: parseFloat(p.strike_pct),
        stock_gain_pct: parseFloat(p.stock_gain_pct),
        allocation: parseFloat(p.allocation),
        days_to_gain: parseInt(p.days_to_gain),
        days_until_exp: parseInt(p.days_until_exp)
      }));

      const res = await runScreenerBackend({ param_sets: formatted });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch results.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 text-white">
      <h2 className="text-2xl font-bold text-[#1DB954] mb-6">🎯 Run Custom Screener</h2>

      <form onSubmit={handleSubmit} className="space-y-6 mb-6">
        {paramSets.map((param, idx) => (
          <div key={idx} className="p-4 border border-gray-700 rounded-md bg-[#1a1a1a]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-green-400">Scenario {idx + 1}</h3>
              {paramSets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScenario(idx)}
                  className="text-sm text-red-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Tickers (comma-separated)", name: "tickers" },
                { label: "Option Type (call/put)", name: "option_type" },
                { label: "Days Until Expiration", name: "days_until_exp" },
                { label: "Strike %", name: "strike_pct" },
                { label: "Days to Gain", name: "days_to_gain" },
                { label: "Stock Gain %", name: "stock_gain_pct" },
                { label: "Allocation ($)", name: "allocation" },
                { label: "Label", name: "label" }
              ].map(({ label, name }) => (
                <div key={name}>
                  <label className="block text-sm mb-1 text-gray-300">{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={param[name]}
                    onChange={(e) => handleParamChange(idx, name, e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <button type="button" onClick={addScenario} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">
            + Add Scenario
          </button>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold">
            Run Screener
          </button>
        </div>
      </form>

      {loading && <p className="text-gray-300">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {results && Array.isArray(results) && (
        <div className="overflow-x-auto rounded-md shadow border border-gray-800">
          <table className="min-w-full table-auto text-sm bg-[#0e0e0e]">
            <thead className="sticky top-0 z-10 bg-black text-[#1DB954] text-xs font-semibold uppercase border-b border-gray-700">
              <tr>
                {Object.keys(results[0]).map((col) => (
                  <th key={col} className="px-4 py-2 whitespace-normal break-words text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-gray-700 hover:bg-[#2a2a2a] transition ${
                    idx % 2 === 0 ? 'bg-[#181818]' : 'bg-[#121212]'
                  }`}
                >
                  {Object.values(row).map((cell, i) => (
                    <td key={i} className="px-4 py-2 whitespace-nowrap text-gray-100">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ScreenerResults;
