import React, { useState } from 'react';

function FundamentalsTable({ data, onAddToWatchlist, watchedStocks }) {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '--';
    return `$${Number(value).toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value) * 100; // Convert decimal to percentage
    const color = num >= 0 ? 'text-green-400' : 'text-red-400';
    return <span className={color}>{num > 0 ? '+' : ''}{num.toFixed(2)}%</span>;
  };

  const formatDateTime = (value) => {
    if (!value) return '--';
    try {
      const date = new Date(value);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(value);
    }
  };

  const formatNumber = (value) => {
    if (value == null || isNaN(value)) return '--';
    return Number(value).toFixed(2);
  };

  const handleSort = (field) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;

    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const isWatched = (ticker) => {
    return watchedStocks.some(stock => stock.ticker === ticker);
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No fundamentals data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-max">
        <thead>
          <tr className="border-b border-gray-700 bg-black">
            {/* Stock Info */}
            <th className="text-left py-2 px-2 text-white sticky left-0 bg-black z-10">Ticker</th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('Current Price')}>
              Current<br/>Price {sortField === 'Current Price' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>

            {/* Price Highs */}
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('All-Time High')}>
              All-Time<br/>High {sortField === 'All-Time High' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('ATH %Chg')}>
              ATH<br/>%Chg {sortField === 'ATH %Chg' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('6-Month High')}>
              6-Month<br/>High {sortField === '6-Month High' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('Recent-High %Chg')}>
              Recent-High<br/>%Chg {sortField === 'Recent-High %Chg' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('5-Year High')}>
              5-Year<br/>High {sortField === '5-Year High' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>

            {/* P/E Metrics */}
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('Current P/E')}>
              Current P/E {sortField === 'Current P/E' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('Avg 5-Year P/E')}>
              Avg 5-Year<br/>P/E {sortField === 'Avg 5-Year P/E' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>

            {/* Fair Value */}
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('Fair Value (TTM)')}>
              Fair Value<br/>(TTM) {sortField === 'Fair Value (TTM)' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('Fair Value %Chg')}>
              Fair Value<br/>%Chg {sortField === 'Fair Value %Chg' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('Avg P/E × Fwd EPS')}>
              Avg P/E ×<br/>Fwd EPS {sortField === 'Avg P/E × Fwd EPS' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>

            {/* Technical Indicators */}
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('MACD (12,26,9)')}>
              MACD<br/>(12,26,9) {sortField === 'MACD (12,26,9)' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('MACD Signal')}>
              MACD<br/>Signal {sortField === 'MACD Signal' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-right py-2 px-2 text-white cursor-pointer hover:text-gray-300" onClick={() => handleSort('RSI (1 yr)')}>
              RSI (1 yr) {sortField === 'RSI (1 yr)' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>

            {/* Time */}
            <th className="text-center py-2 px-2 text-white bg-black">
              Live Price<br/>Time
            </th>

            {/* Actions */}
            <th className="text-center py-2 px-2 text-white sticky right-0 bg-black z-10">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/30">
              {/* Stock Info */}
              <td className="py-2 px-2 font-medium text-white sticky left-0 bg-gray-800">
                {isWatched(row.Ticker) && <span className="mr-1">⭐</span>}
                {row.Ticker}
              </td>
              <td className="py-2 px-2 text-right text-white">
                {formatCurrency(row['Current Price'])}
              </td>

              {/* Price Highs */}
              <td className="py-2 px-2 text-right text-white">
                {formatCurrency(row['All-Time High'])}
              </td>
              <td className="py-2 px-2 text-right">
                {formatPercent(row['ATH %Chg'])}
              </td>
              <td className="py-2 px-2 text-right text-white">
                {formatCurrency(row['6-Month High'])}
              </td>
              <td className="py-2 px-2 text-right">
                {formatPercent(row['Recent-High %Chg'])}
              </td>
              <td className="py-2 px-2 text-right text-white">
                {formatCurrency(row['5-Year High'])}
              </td>

              {/* P/E Metrics */}
              <td className="py-2 px-2 text-right text-white">
                {formatNumber(row['Current P/E'])}
              </td>
              <td className="py-2 px-2 text-right text-white">
                {formatNumber(row['Avg 5-Year P/E'])}
              </td>

              {/* Fair Value */}
              <td className="py-2 px-2 text-right text-white">
                {formatCurrency(row['Fair Value (TTM)'])}
              </td>
              <td className="py-2 px-2 text-right">
                {formatPercent(row['Fair Value %Chg'])}
              </td>
              <td className="py-2 px-2 text-right text-white">
                {formatCurrency(row['Avg P/E × Fwd EPS'])}
              </td>

              {/* Technical Indicators */}
              <td className="py-2 px-2 text-right text-white">
                {formatNumber(row['MACD (12,26,9)'])}
              </td>
              <td className="py-2 px-2 text-right text-white">
                {formatNumber(row['MACD Signal'])}
              </td>
              <td className="py-2 px-2 text-right text-white">
                {formatNumber(row['RSI (1 yr)'])}
              </td>

              {/* Time */}
              <td className="py-2 px-2 text-center text-gray-300 text-xs">
                {formatDateTime(row['Live Price Time'])}
              </td>

              {/* Actions */}
              <td className="py-2 px-2 text-center sticky right-0 bg-gray-800">
                {!isWatched(row.Ticker) && (
                  <button
                    onClick={() => onAddToWatchlist(row.Ticker)}
                    className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400 hover:border-blue-300"
                  >
                    Watch
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-sm text-gray-400">
        Showing {sortedData.length} stocks analyzed
      </div>
    </div>
  );
}

export default FundamentalsTable;