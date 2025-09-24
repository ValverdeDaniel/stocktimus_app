import React, { useState } from 'react';
import EPSSlopeHeatmap from './EPSSlopeHeatmap';
import EPSTimelineTable from './EPSTimelineTable';

function EPSTrendsChart({ data, onAddToWatchlist, watchedStocks }) {
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap' or 'detailed'

  const isWatched = (ticker) => {
    return watchedStocks.some(stock => stock.ticker === ticker);
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No EPS trends data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">EPS Trends Analysis</h2>
        <div className="flex bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Heatmap View
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              viewMode === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Detailed View
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'heatmap' ? (
        <EPSSlopeHeatmap
          data={data}
          onAddToWatchlist={onAddToWatchlist}
          watchedStocks={watchedStocks}
        />
      ) : (
        <EPSTimelineTable
          data={data}
          onAddToWatchlist={onAddToWatchlist}
          watchedStocks={watchedStocks}
        />
      )}
    </div>
  );
}

export default EPSTrendsChart;