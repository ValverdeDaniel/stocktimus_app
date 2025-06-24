import React from 'react';

function ScreenerScenarioForm({ param, index, updateScenario, removeScenario, saveScenario, canRemove }) {
  const inputFields = [
    'tickers',
    'option_type',
    'days_until_exp',
    'strike_pct',
    'days_to_gain',
    'stock_gain_pct',
    'allocation',
    'label'
  ];

  return (
    <div className="p-4 border border-gray-700 rounded-md bg-[#1a1a1a]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-green-400">Scenario {index + 1}</h3>
        <div>
          {canRemove && (
            <button
              type="button"
              onClick={() => removeScenario(index)}
              className="text-sm text-red-400 hover:underline mr-2"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => saveScenario(param)}
            className="text-sm text-blue-400 hover:underline"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {inputFields.map((name) => (
          <div key={name}>
            <label className="block text-sm mb-1 text-gray-300">
              {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </label>
            <input
              type="text"
              name={name}
              value={param[name]}
              onChange={(e) => updateScenario(index, name, e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScreenerScenarioForm;
