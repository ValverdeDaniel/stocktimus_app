import React from 'react';

function ScreenerSavedParams({ savedParams, onLoad, onDelete }) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3 text-white">💾 Saved Parameter Sets</h3>
      <div className="space-y-4">
        {savedParams.map((param) => (
          <div
            key={param.id}
            className="bg-[#1a1a1a] border border-gray-700 p-5 rounded-lg hover:bg-[#222] shadow-sm transition"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-bold text-white">{param.label}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onLoad(param)}
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1 text-sm rounded text-white"
                >
                  Load
                </button>
                <button
                  onClick={() => onDelete(param.id)}
                  className="bg-red-600 hover:bg-red-500 px-3 py-1 text-sm rounded text-white"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-300 flex flex-wrap gap-x-8 gap-y-1 pl-1">
              <div className="max-w-full break-words">
                <strong>Tickers:</strong>{' '}
                {Array.isArray(param.tickers) ? param.tickers.join(', ') : param.tickers}
              </div>
              <div><strong>Option Type:</strong> {param.option_type}</div>
              <div><strong>Days Until Expiration:</strong> {param.days_until_exp}</div>
              <div><strong>Strike %:</strong> {(param.strike_pct * 100).toFixed(1)}%</div>
              <div><strong>Days to Gain:</strong> {param.days_to_gain}</div>
              <div><strong>Stock Gain %:</strong> {(param.stock_gain_pct * 100).toFixed(1)}%</div>
              <div><strong>Allocation:</strong> ${parseFloat(param.allocation).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScreenerSavedParams;
