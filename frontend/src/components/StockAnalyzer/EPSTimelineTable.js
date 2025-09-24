import React from 'react';

function EPSTimelineTable({ data, onAddToWatchlist, watchedStocks }) {
  const isWatched = (ticker) => {
    return watchedStocks.some(stock => stock.ticker === ticker);
  };

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '--';
    return `$${Number(value).toFixed(2)}`;
  };

  // Calculate corrected slope (positive = improving estimates)
  const calculateCorrectedSlope = (row, period) => {
    const values = [
      row[`${period} 90`],
      row[`${period} 60`],
      row[`${period} 30`],
      row[`${period} 7`],
      row[`${period} Curr`]
    ];

    // Filter out null/undefined values
    const validValues = values.filter(v => v != null && !isNaN(v));

    if (validValues.length < 2) return null;

    // Calculate simple percentage change from first to last valid value
    const firstValue = validValues[0];
    const lastValue = validValues[validValues.length - 1];

    if (firstValue === 0) return null;

    return ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
  };

  const getTrendArrow = (change) => {
    if (change == null || Math.abs(change) < 0.1) return { arrow: '→', color: 'text-gray-400' };
    if (change > 0) return { arrow: '↗', color: 'text-green-400' };
    return { arrow: '↘', color: 'text-red-400' };
  };

  const periods = [
    { key: 'Curr Qtr', label: 'Current Quarter' },
    { key: 'Next Qtr', label: 'Next Quarter' },
    { key: 'Curr Yr', label: 'Current Year' },
    { key: 'Next Yr', label: 'Next Year' }
  ];

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No EPS trends data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((row, stockIndex) => (
        <div key={stockIndex} className="bg-gray-800 rounded-lg p-6">
          {/* Stock Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              {isWatched(row.Ticker) && <span className="mr-2 text-yellow-400">⭐</span>}
              {row.Ticker} - EPS Estimate Timeline
            </h3>
            {!isWatched(row.Ticker) && (
              <button
                onClick={() => onAddToWatchlist(row.Ticker)}
                className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded border border-blue-400 hover:border-blue-300"
              >
                Watch
              </button>
            )}
          </div>

          {/* Timeline Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-600 rounded-lg">
              <thead>
                <tr className="bg-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Period</th>
                  <th className="text-center py-3 px-3 text-gray-300 font-medium">90d Ago</th>
                  <th className="text-center py-3 px-3 text-gray-300 font-medium">60d Ago</th>
                  <th className="text-center py-3 px-3 text-gray-300 font-medium">30d Ago</th>
                  <th className="text-center py-3 px-3 text-gray-300 font-medium">7d Ago</th>
                  <th className="text-center py-3 px-3 text-gray-300 font-medium">Current</th>
                  <th className="text-center py-3 px-4 text-gray-300 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period, periodIndex) => {
                  const percentChange = calculateCorrectedSlope(row, period.key);
                  const trend = getTrendArrow(percentChange);

                  return (
                    <tr key={period.key} className={`border-t border-gray-600 ${periodIndex % 2 === 0 ? 'bg-gray-800/50' : ''}`}>
                      <td className="py-3 px-4 font-medium text-white">
                        {period.label}
                      </td>
                      <td className="py-3 px-3 text-center text-white">
                        {formatCurrency(row[`${period.key} 90`])}
                      </td>
                      <td className="py-3 px-3 text-center text-white">
                        {formatCurrency(row[`${period.key} 60`])}
                      </td>
                      <td className="py-3 px-3 text-center text-white">
                        {formatCurrency(row[`${period.key} 30`])}
                      </td>
                      <td className="py-3 px-3 text-center text-white">
                        {formatCurrency(row[`${period.key} 7`])}
                      </td>
                      <td className="py-3 px-3 text-center text-white font-semibold">
                        {formatCurrency(row[`${period.key} Curr`])}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-lg ${trend.color}`}>{trend.arrow}</span>
                          {percentChange != null && (
                            <span className={`text-sm font-medium ${trend.color}`}>
                              {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {periods.map((period) => {
              const percentChange = calculateCorrectedSlope(row, period.key);
              const trend = getTrendArrow(percentChange);

              return (
                <div key={period.key} className="bg-gray-700/50 rounded p-3">
                  <div className="text-gray-400 mb-1">{period.label} Trend</div>
                  <div className={`text-lg font-semibold ${trend.color}`}>
                    {trend.arrow} {percentChange != null ? `${percentChange.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {row[`${period.key} 90`] && row[`${period.key} Curr`] ?
                      `${formatCurrency(row[`${period.key} 90`])} → ${formatCurrency(row[`${period.key} Curr`])}`
                      : 'Insufficient data'
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="text-sm text-gray-400 text-center">
        Showing detailed EPS estimate timeline for {data.length} stocks
      </div>
    </div>
  );
}

export default EPSTimelineTable;