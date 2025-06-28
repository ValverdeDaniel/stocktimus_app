import React from 'react';

function WatchlistSavedParams({ savedParams, onLoad, onDelete }) {
  return (
    <div className="mt-8">
      <h3 className="heading-lg">💾 Saved Watchlist Items</h3>
      <div className="space-y-4">
        {savedParams.map((param) => (
          <div key={param.id} className="card card-hover">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-bold text-text">{param.ticker} {param.option_type}</span>
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
    </div>
  );
}

export default WatchlistSavedParams;
