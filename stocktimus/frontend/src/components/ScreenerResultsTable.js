import React, { useState, useMemo } from 'react';
import { CSVLink } from 'react-csv';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import ScreenerFilterControls from './ScreenerFilterControls';

const COLUMN_GROUPS = {
  All: [
    "Ticker", "Option Type", "Expiration", "Underlying Price", "Strike", "Current Premium",
    "Simulated Underlying", "Simulated Premium", "Underlying Gain %", "Premium % Gain", "Days to Gain", "Simulated Equity",
    "% OTM/ITM", "Days Until Expiration", "Allocated Equity", "Run Label",
    "Delta", "Gamma", "Theta", "Vega", "Rho", "Implied Volatility",
    "Bid", "Ask", "Last Premium", "Volume", "Bid Date", "Ask Date"
  ],
  Simulation: [
    "Simulated Underlying", "Simulated Premium", "Underlying Gain %", "Premium % Gain", "Days to Gain", "Simulated Equity"
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

    const withExpirationAndTickerFilter = withVisibleColumns.filter(row =>
      (selectedExpirations.length === 0 || selectedExpirations.includes(row["Expiration"])) &&
      (selectedTickers.length === 0 || selectedTickers.includes(row["Ticker"]))
    );

    return withExpirationAndTickerFilter;
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
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedGroup === group ? 'bg-[#1DB954] text-white' : 'bg-gray-700 text-white'
                }`}
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
            className="bg-[#1DB954] text-white font-medium text-sm py-1 px-3 rounded"
          >
            Export Filtered CSV
          </CSVLink>

          <CSVLink
            data={results}
            headers={COLUMN_GROUPS["All"].map(col => ({ label: col, key: col }))}
            filename={"screener_full_optionsLeveling.csv"}
            className="bg-gray-700 text-white font-medium text-sm py-1 px-3 rounded"
          >
            Export Full CSV
          </CSVLink>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-visible rounded-md shadow border border-gray-800">
        <table className="min-w-full table-auto text-sm bg-[#0e0e0e] text-left">
          <thead className="sticky top-0 z-0 border-b border-gray-700">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`px-4 py-2 break-words text-left align-top cursor-pointer select-none ${
                    ESSENTIAL_COLUMNS.includes(col) ? 'min-w-[120px] max-w-[120px]' : 'max-w-[160px]'
                  }`}
                  style={{
                    backgroundColor: '#000000',
                    color: '#1DB954',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
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
                className={`border-t border-gray-700 transition ${
                  idx % 2 === 0 ? 'bg-[#181818]' : 'bg-[#121212]'
                } hover:bg-[#1ed76059]`}
              >
                {visibleColumns.map((col, i) => (
                  <td
                    key={i}
                    className={`px-4 py-2 whitespace-nowrap text-gray-100 ${
                      ESSENTIAL_COLUMNS.includes(col) ? 'min-w-[120px] max-w-[120px]' : ''
                    }`}
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
