import React from 'react';

function WatchlistTable({ items, selectedTickers }) {
  const visibleItems = selectedTickers.length > 0
    ? items.filter(item => selectedTickers.includes(item.Ticker))
    : items;

  if (visibleItems.length === 0) return <p className="text-muted">No watchlist items to display.</p>;

  return (
    <div className="table-container">
      <table className="table">
        <thead className="table-header">
          <tr>
            {Object.keys(visibleItems[0]).map((col) => (
              <th key={col} className="table-header-cell">{col.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleItems.map((row, idx) => (
            <tr key={idx} className={`border-t border-muted ${idx % 2 === 0 ? 'table-row-even' : 'table-row-odd'} table-row-hover`}>
              {Object.entries(row).map(([key, val]) => (
                <td key={key} className="table-cell">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default WatchlistTable;
