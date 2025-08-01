import React, { useState, useMemo, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const COLUMN_GROUPS = {
  All: [
    "Ticker", "Option Type", "Strike", 
    "Expiration", "Current Premium", "Days to Gain", "Underlying Scenario % Change",
    "Current Underlying", "Simulated Underlying (+)", "Simulated Underlying (-)",
    "Simulated Premium (+)", "Simulated Premium (+) % Change", 
    "Simulated Premium (-)", "Simulated Premium (-) % Change",
    "Number of Contracts", "Average Cost per Contract", "Equity Invested",
    "Simulated Equity (+)", "Simulated Equity (-)",
    "Bid", "Ask", "Volume", "Open Interest",
    "Implied Volatility", "Delta", "Theta", "Gamma", "Vega", "Rho"
  ],
  Simulation: [
    "Days to Gain", "Underlying Scenario % Change", "Current Underlying",
    "Simulated Underlying (+)", 
    "Current Premium", 
    "Simulated Premium (+)", "Simulated Premium (+) % Change", "Equity Invested", "Simulated Equity (+)", 
    "Simulated Underlying (-)", "Simulated Premium (-)", "Simulated Premium (-) % Change",
     "Simulated Equity (-)"
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

  const visibleItems = useMemo(() => {
    return selectedTickers.length > 0
      ? items.filter(item => selectedTickers.includes(item.Ticker))
      : items;
  }, [items, selectedTickers]);

  if (visibleItems.length > 0) {
    const firstRowKeys = Object.keys(visibleItems[0]);
    const missingFromColumns = firstRowKeys.filter(k => !COLUMN_GROUPS.All.includes(k));
    const missingFromData = COLUMN_GROUPS.All.filter(c => !(c in visibleItems[0]));
    console.log("🧪 WatchlistTable Debug → First Row Keys:", firstRowKeys);
    console.log("🧪 Missing in COLUMN_GROUPS.All but in data:", missingFromColumns);
    console.log("🧪 Columns defined but missing in data:", missingFromData);
  }

  const handleGroupChange = (group) => {
    console.log(`🔄 Column Group Changed to: ${group}`);
    setSelectedGroup(group);
  };

  const visibleColumns = useMemo(() => {
    if (selectedGroup === "All") return COLUMN_GROUPS.All;
    const groupCols = COLUMN_GROUPS[selectedGroup] || [];
    return [...ESSENTIAL_COLUMNS, ...groupCols.filter(col => !ESSENTIAL_COLUMNS.includes(col))];
  }, [selectedGroup]);

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

  const csvFilteredData = useMemo(() => {
    return sortedData.map(row => {
      const filteredRow = {};
      visibleColumns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });
  }, [sortedData, visibleColumns]);

  useEffect(() => {
    if (sortedData.length > 0) {
      console.log("📋 First 3 rows of sortedData:", sortedData.slice(0, 3));
    }
  }, [sortedData]);

  useEffect(() => {
    if (visibleItems.length > 0) {
      const firstRow = visibleItems[0];
      const missingColumns = visibleColumns.filter(col => !(col in firstRow));
      if (missingColumns.length > 0) {
        console.warn("⚠ Missing columns in first row:", missingColumns);
      }
    }
  }, [visibleColumns, visibleItems]);

  const handleSort = (column) => {
    console.log(`🔀 Sorting by column: ${column}`);
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

  if (!visibleItems || visibleItems.length === 0) {
    return <p className="text-muted">No watchlist items to display.</p>;
  }

  return (
    <div className="mt-10">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(COLUMN_GROUPS).map(group => (
            <button
              key={group}
              onClick={() => handleGroupChange(group)}
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
                {visibleColumns.map((col, i) => {
                  let value = row[col];

                  if (["Current Premium", "Average Cost per Contract", "Bid", "Ask"].includes(col)) {
                    value = Number(value).toFixed(2);
                  }

                  if (col === "Equity Invested") {
                    const numContracts = Number(row["Number of Contracts"]);
                    const avgCost = Number(row["Average Cost per Contract"]);
                    value = (numContracts * avgCost * 100).toFixed(2);
                  }

                  return (
                    <td key={i} className="table-cell">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WatchlistTable;
