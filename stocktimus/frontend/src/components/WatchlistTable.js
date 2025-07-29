import React, { useState, useMemo } from 'react';
import { CSVLink } from 'react-csv';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const COLUMN_GROUPS = {
  All: [
    "Ticker", "Option Type", "Strike", "Expiration",
    "Underlying Scenario % Change", "Current Underlying",
    "Simulated Underlying (+)", "Simulated Underlying (-)",
    "Current Premium", "Simulated Premium (+)",
    "Simulated Premium (+) % Change", "Simulated Premium (-)",
    "Simulated Premium (-) % Change", "Days to Gain",
    "Number of Contracts", "Average Cost per Contract",
    "Equity Invested", "Simulated Equity (+)", "Simulated Equity (-)",
    "Bid", "Ask", "Volume", "Open Interest",
    "Implied Volatility", "Delta", "Theta", "Gamma", "Vega", "Rho"
  ],
  Simulation: [
    "Underlying Scenario % Change", "Current Underlying",
    "Simulated Underlying (+)", "Simulated Underlying (-)",
    "Current Premium", "Simulated Premium (+)",
    "Simulated Premium (+) % Change", "Simulated Premium (-)",
    "Simulated Premium (-) % Change", "Days to Gain",
    "Simulated Equity (+)", "Simulated Equity (-)"
  ],
  "Position Details": [
    "Number of Contracts", "Average Cost per Contract",
    "Equity Invested"
  ],
  "Market Data": [
    "Bid", "Ask", "Volume", "Open Interest"
  ],
  Greeks: [
    "Implied Volatility", "Delta", "Theta", "Gamma", "Vega", "Rho"
  ]
};

const ESSENTIAL_COLUMNS = [
  "Ticker", "Option Type", "Strike", "Expiration", "Current Premium"
];

function WatchlistTable({ items, selectedTickers }) {
  const [selectedGroup, setSelectedGroup] = useState("Simulation");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // --- Filter items by selectedTickers ---
  const visibleItems = useMemo(() => {
    return selectedTickers.length > 0
      ? items.filter(item => selectedTickers.includes(item.Ticker))
      : items;
  }, [items, selectedTickers]);

  // --- Determine which columns to show based on selected group ---
  const visibleColumns = useMemo(() => {
    if (selectedGroup === "All") return COLUMN_GROUPS.All;
    const groupCols = COLUMN_GROUPS[selectedGroup] || [];
    return [...ESSENTIAL_COLUMNS, ...groupCols.filter(col => !ESSENTIAL_COLUMNS.includes(col))];
  }, [selectedGroup]);

  // --- Sorting ---
  const sortedData = useMemo(() => {
    const sortable = [...visibleItems];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [visibleItems, sortConfig]);

  // --- Prepare data for CSV ---
  const csvFilteredData = useMemo(() => {
    return sortedData.map(row => {
      const filteredRow = {};
      visibleColumns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });
  }, [sortedData, visibleColumns]);

  // --- Sorting handler ---
  const handleSort = (column) => {
    if (sortConfig.key === column) {
      setSortConfig({
        key: column,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({ key: column, direction: 'asc' });
    }
  };

  const getSortIcon = (column) => {
    if (sortConfig.key !== column) return <FaSort className="inline ml-1 opacity-50" />;
    return sortConfig.direction === 'asc'
      ? <FaSortUp className="inline ml-1" />
      : <FaSortDown className="inline ml-1" />;
  };

  // --- Early return AFTER hooks ---
  if (!visibleItems || visibleItems.length === 0) {
    return <p className="text-muted">No watchlist items to display.</p>;
  }

  return (
    <div className="mt-10">
      {/* Group Tabs + Export CSV */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(COLUMN_GROUPS).map(group => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`tab-button ${selectedGroup === group ? 'tab-selected' : 'tab-unselected'}`}
            >
              {group}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <CSVLink
            data={csvFilteredData}
            headers={visibleColumns.map(col => ({ label: col, key: col }))}
            filename={"watchlist_filtered.csv"}
            className="btn-export-primary"
          >
            Export Filtered CSV
          </CSVLink>

          <CSVLink
            data={sortedData}
            headers={COLUMN_GROUPS["All"].map(col => ({ label: col, key: col }))}
            filename={"watchlist_full.csv"}
            className="btn-export-secondary"
          >
            Export Full CSV
          </CSVLink>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="table-header-cell"
                >
                  <span className="flex items-center">
                    {col} {getSortIcon(col)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr
                key={idx}
                className={`border-t border-muted ${idx % 2 === 0 ? 'table-row-even' : 'table-row-odd'} table-row-hover`}
              >
                {visibleColumns.map((col, i) => (
                  <td key={i} className="table-cell">
                    {Array.isArray(row[col]) ? row[col].join(', ') : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WatchlistTable;
