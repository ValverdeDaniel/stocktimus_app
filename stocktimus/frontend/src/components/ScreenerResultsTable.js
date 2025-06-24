import React from 'react';

function ScreenerResultsTable({ results }) {
  if (!Array.isArray(results) || results.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold mb-3 text-white">📊 Screener Results</h3>
      <div className="overflow-x-auto rounded-md shadow border border-gray-800">
        <table className="min-w-full table-auto text-sm bg-[#0e0e0e] text-left">
          <thead className="sticky top-0 z-10 bg-black text-[#1DB954] text-xs font-semibold uppercase border-b border-gray-700">
            <tr>
              {Object.keys(results[0]).map((col) => (
                <th key={col} className="px-4 py-2 whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, idx) => (
              <tr
                key={idx}
                className={`border-t border-gray-700 hover:bg-[#2a2a2a] transition ${
                  idx % 2 === 0 ? 'bg-[#181818]' : 'bg-[#121212]'
                }`}
              >
                {Object.values(row).map((cell, i) => (
                  <td key={i} className="px-4 py-2 whitespace-nowrap text-gray-100">
                    {Array.isArray(cell) ? cell.join(', ') : String(cell)}
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
