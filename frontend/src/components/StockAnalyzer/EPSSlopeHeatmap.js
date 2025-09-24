import React from 'react';

function EPSSlopeHeatmap({ data, onAddToWatchlist, watchedStocks }) {
  if (!data || data.length === 0) {
    return null;
  }

  // Extract tickers and periods
  const tickers = data.map(row => row.Ticker).filter(Boolean);
  const periods = ['Curr Qtr', 'Next Qtr', 'Curr Yr', 'Next Yr'];

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

    // Calculate percentage change from first to last valid value
    const firstValue = validValues[0];
    const lastValue = validValues[validValues.length - 1];

    if (firstValue === 0) return null;

    return ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
  };

  // Create heatmap data structure with corrected slopes
  const heatmapData = periods.map(period => ({
    period,
    values: tickers.map(ticker => {
      const row = data.find(r => r.Ticker === ticker);
      return row ? calculateCorrectedSlope(row, period) : null;
    }),
    rawData: tickers.map(ticker => {
      const row = data.find(r => r.Ticker === ticker);
      return row ? {
        start: row[`${period} 90`],
        current: row[`${period} Curr`],
        ticker
      } : null;
    })
  }));

  // Calculate min/max for color scaling
  const allValues = heatmapData.flatMap(p => p.values).filter(v => v != null && !isNaN(v));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const maxAbsVal = Math.max(Math.abs(minVal), Math.abs(maxVal), 5); // Minimum scale of 5%

  const getColorClass = (value) => {
    if (value == null || isNaN(value)) return 'bg-gray-600';

    const intensity = Math.abs(value) / maxAbsVal;

    if (value > 0) {
      // Positive values - green scale
      if (intensity < 0.2) return 'bg-green-900/40';
      if (intensity < 0.4) return 'bg-green-800/60';
      if (intensity < 0.6) return 'bg-green-700/80';
      if (intensity < 0.8) return 'bg-green-600';
      return 'bg-green-500';
    } else {
      // Negative values - red scale
      if (intensity < 0.2) return 'bg-red-900/40';
      if (intensity < 0.4) return 'bg-red-800/60';
      if (intensity < 0.6) return 'bg-red-700/80';
      if (intensity < 0.8) return 'bg-red-600';
      return 'bg-red-500';
    }
  };

  const formatValue = (value) => {
    if (value == null || isNaN(value)) return '--';
    const formatted = value.toFixed(1);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '--';
    return `$${Number(value).toFixed(2)}`;
  };

  const getTooltipContent = (ticker, period, value, rawData) => {
    if (!rawData || value == null) return `${ticker} ${period}: No data`;

    const change = rawData.current - rawData.start;
    const changeSymbol = change >= 0 ? '+' : '';

    return `${ticker} - ${period}
90d ago: ${formatCurrency(rawData.start)}
Current: ${formatCurrency(rawData.current)}
Change: ${changeSymbol}${formatCurrency(change)} (${formatValue(value)})`;
  };

  const isWatched = (ticker) => {
    return watchedStocks.some(stock => stock.ticker === ticker);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">EPS Trend Slopes (90d → Current)</h3>
        <p className="text-sm text-gray-400">
          Heatmap showing the slope of EPS estimate changes over time.
          <span className="text-green-400 ml-2">Green = Improving estimates</span>
          <span className="text-red-400 ml-2">Red = Declining estimates</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header with tickers */}
          <div className="grid gap-px mb-1" style={{ gridTemplateColumns: `120px repeat(${tickers.length}, 80px)` }}>
            <div className="bg-gray-700 p-2 text-sm font-medium text-gray-300 text-center">
              Period
            </div>
            {tickers.map((ticker) => (
              <div key={ticker} className="bg-gray-700 p-2 text-xs font-medium text-center">
                <div className="text-white">
                  {isWatched(ticker) && <span className="text-yellow-400 mr-1">⭐</span>}
                  {ticker}
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          {heatmapData.map(({ period, values, rawData }) => (
            <div key={period} className="grid gap-px mb-1" style={{ gridTemplateColumns: `120px repeat(${tickers.length}, 80px)` }}>
              <div className="bg-gray-700 p-2 text-sm text-gray-300 flex items-center">
                <span className="font-medium">{period} Trend</span>
              </div>
              {values.map((value, index) => (
                <div
                  key={index}
                  className={`p-2 text-xs text-center transition-all hover:scale-105 hover:z-10 relative cursor-help ${getColorClass(value)}`}
                  title={getTooltipContent(tickers[index], period, value, rawData[index])}
                >
                  <div className="text-white font-mono text-xs leading-tight">
                    {formatValue(value)}
                  </div>
                  {/* Trend arrow for visual reinforcement */}
                  <div className="text-white text-xs mt-1">
                    {value != null && !isNaN(value) ? (
                      value > 0 ? '↗' : value < 0 ? '↘' : '→'
                    ) : '?'}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Strong Decline</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-800 rounded"></div>
          <span>Decline</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-600 rounded"></div>
          <span>Neutral</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-800 rounded"></div>
          <span>Improvement</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Strong Improvement</span>
        </div>
      </div>

      {/* Add to watchlist section for easy access */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-2">Quick Actions:</div>
        <div className="flex flex-wrap gap-2">
          {tickers.filter(ticker => !isWatched(ticker)).slice(0, 8).map(ticker => (
            <button
              key={ticker}
              onClick={() => onAddToWatchlist(ticker)}
              className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-400 hover:border-blue-300"
            >
              Watch {ticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EPSSlopeHeatmap;