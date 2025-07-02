import React from 'react';

function WatchlistSavedParams({
  savedParams,
  selectedContracts,
  setSelectedContracts,
  handleRunSelected,
  onLoad,
  onDelete,
}) {
  return (
    <div className="mt-8">
      <h3 className="heading-lg">💾 Saved Watchlist Items</h3>
      <div className="space-y-4">
        {savedParams.map((param) => (
          <div key={param.id} className="card card-hover">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedContracts.includes(param.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedContracts((prev) => [...prev, param.id]);
                    } else {
                      setSelectedContracts((prev) => prev.filter((id) => id !== param.id));
                    }
                  }}
                />
                <span className="text-sm font-bold text-text">
                  {param.ticker} {param.option_type}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onLoad(param)} className="btn-blue">Load</button>
                <button onClick={() => onDelete(param.id)} className="btn-red">Delete</button>
              </div>
            </div>
            <div className="text-sm text-muted flex flex-wrap gap-x-8 gap-y-1 pl-1">
              {Object.entries(param).map(([k, v]) => (
                <div key={k}><strong>{k}:</strong> {v}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedContracts.length > 0 && (
        <div className="mt-4">
          <button onClick={handleRunSelected} className="btn-primary">
            Run Selected Contracts
          </button>
        </div>
      )}
    </div>
  );
}

export default WatchlistSavedParams;
