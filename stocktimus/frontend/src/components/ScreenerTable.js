import React, { useEffect, useState } from 'react';
import { getScreener } from '../services/api';

function ScreenerTable() {
  const [data, setData] = useState([]);
  const [sortedBy, setSortedBy] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    getScreener()
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load screener data.");
        setLoading(false);
      });
  }, []);

  const handleSort = (key) => {
    if (sortedBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortedBy(key);
      setSortAsc(true);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortedBy) return 0;
    const aVal = a[sortedBy];
    const bVal = b[sortedBy];
    if (typeof aVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    } else {
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    }
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) return <p className="text-gray-300">Loading screener results...</p>;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="p-4 text-gray-100">
      <h2 className="text-2xl font-bold text-[#1DB954] mb-4">📈 Screener Results</h2>
      
      <div className="overflow-x-auto rounded-md shadow-md border border-gray-800">
        <table className="min-w-full table-auto text-sm bg-[#0e0e0e] text-left">
          <thead className="sticky top-0 z-10 bg-black text-[#1DB954] text-xs font-semibold uppercase border-b border-gray-700">
            <tr>
              <th className="px-4 py-3 cursor-pointer whitespace-normal" onClick={() => handleSort("label")}>Label</th>
              <th className="px-4 py-3 whitespace-normal">Tickers</th>
              <th className="px-4 py-3 cursor-pointer whitespace-normal" onClick={() => handleSort("strike_pct")}>Strike %</th>
              <th className="px-4 py-3 cursor-pointer whitespace-normal" onClick={() => handleSort("days_until_exp")}>Days Until Exp</th>
              <th className="px-4 py-3 cursor-pointer whitespace-normal" onClick={() => handleSort("days_to_gain")}>Days to Gain</th>
              <th className="px-4 py-3 cursor-pointer whitespace-normal" onClick={() => handleSort("stock_gain_pct")}>Stock Gain %</th>
              <th className="px-4 py-3 cursor-pointer whitespace-normal" onClick={() => handleSort("allocation")}>Allocation</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((entry, i) => (
              <tr
                key={i}
                className={`border-t border-gray-700 hover:bg-[#2a2a2a] transition ${
                  i % 2 === 0 ? 'bg-[#181818]' : 'bg-[#121212]'
                }`}
              >
                <td className="px-4 py-2 font-medium text-gray-100">{entry.label}</td>
                <td className="px-4 py-2">{entry.tickers.join(', ')}</td>
                <td className="px-4 py-2">{(entry.strike_pct * 100).toFixed(1)}%</td>
                <td className="px-4 py-2">{entry.days_until_exp} days</td>
                <td className="px-4 py-2">{entry.days_to_gain} days</td>
                <td className="px-4 py-2">{(entry.stock_gain_pct * 100).toFixed(1)}%</td>
                <td className="px-4 py-2">${entry.allocation.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-40"
          disabled={currentPage === 1}
        >
          ← Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-40"
          disabled={currentPage === totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default ScreenerTable;
