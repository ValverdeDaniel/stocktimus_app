import React, { useState, useMemo } from 'react';
import { CSVLink } from 'react-csv';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import ScreenerFilterControls from './ScreenerFilterControls';

const COLUMN_GROUPS = {
  All: [
    "Ticker", "Option Type", "Expiration", "Underlying Price", "Strike", "Current Premium",
    "Simulated Underlying", "Simulated Premium", "Underlying Gain %", "Premium % Gain", "Days to Gain", "Allocated Equity", "Simulated Equity",
    "% OTM/ITM", "Days Until Expiration", "Run Label",
    "Delta", "Gamma", "Theta", "Vega", "Rho", "Implied Volatility",
    "Bid", "Ask", "Last Premium", "Volume", "Bid Date", "Ask Date"
  ],
  Simulation: [
    "Simulated Underlying", "Simulated Premium", "Underlying Gain %", "Premium % Gain", "Days to Gain", "Allocated Equity", "Simulated Equity"
  ],
  "Contract Details": [
    "% OTM/ITM", "Days Until Expiration", "Allocated Equity", "Run Label"
  ],
  Greeks: [
    "Delta", "Gamma", "Theta", "Vega", "Rho", "Implied Volatility"
  ],
  "Market Data": [
    "Bid", "Ask", "Last Premium", "Volume", "Bid Date", "Ask Date"
  ]
};

const ESSENTIAL_COLUMNS = [
  "Ticker", "Option Type", "Expiration", "Underlying Price", "Strike", "Current Premium"
];

function ScreenerResultsTable({ results }) {
  const [selectedGroup, setSelectedGroup] = useState("Simulation");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedExpirations, setSelectedExpirations] = useState([]);
  const [selectedTickers, setSelectedTickers] = useState([]);

  const visibleColumns = useMemo(() => {
    if (selectedGroup === "All") return COLUMN_GROUPS.All;
    const groupCols = COLUMN_GROUPS[selectedGroup] || [];
    return [...ESSENTIAL_COLUMNS, ...groupCols.filter(col => !ESSENTIAL_COLUMNS.includes(col))];
  }, [selectedGroup]);

  const sortedData = useMemo(() => {
    const sortable = [...(Array.isArray(results) ? results : [])];
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
  }, [results, sortConfig]);

  const filteredData = useMemo(() => {
    const withVisibleColumns = sortedData.map(row => {
      const filteredRow = {};
      visibleColumns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });

    return withVisibleColumns.filter(row =>
      (selectedExpirations.length === 0 || selectedExpirations.includes(row["Expiration"])) &&
      (selectedTickers.length === 0 || selectedTickers.includes(row["Ticker"]))
    );
  }, [sortedData, visibleColumns, selectedExpirations, selectedTickers]);

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

  if (!Array.isArray(results) || results.length === 0) return null;

  return (
    <div className="mt-10">
      {/* Filters */}
      <ScreenerFilterControls
        data={results}
        selectedExpirations={selectedExpirations}
        setSelectedExpirations={setSelectedExpirations}
        selectedTickers={selectedTickers}
        setSelectedTickers={setSelectedTickers}
      />

      {/* Group Tabs + Export CSV */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(COLUMN_GROUPS)
            .filter(group => group !== "Essentials")
            .map(group => (
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
            data={filteredData}
            headers={visibleColumns.map(col => ({ label: col, key: col }))}
            filename={"screener_filtered_optionsLeveling.csv"}
            className="btn-export-primary"
          >
            Export Filtered CSV
          </CSVLink>

          <CSVLink
            data={results}
            headers={COLUMN_GROUPS["All"].map(col => ({ label: col, key: col }))}
            filename={"screener_full_optionsLeveling.csv"}
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
                  className={`table-header-cell ${
                    ESSENTIAL_COLUMNS.includes(col) ? 'min-w-[120px] max-w-[120px]' : 'max-w-[160px]'
                  }`}
                >
                  <span className="flex items-center">
                    {col} {getSortIcon(col)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredData.map((row, idx) => (
              <tr
                key={idx}
                className={`border-t border-muted transition ${idx % 2 === 0 ? 'table-row-even' : 'table-row-odd'} table-row-hover`}
              >
                {visibleColumns.map((col, i) => (
                  <td
                    key={i}
                    className={`table-cell ${ESSENTIAL_COLUMNS.includes(col) ? 'min-w-[120px] max-w-[120px]' : ''}`}
                  >
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

export default ScreenerResultsTable;
