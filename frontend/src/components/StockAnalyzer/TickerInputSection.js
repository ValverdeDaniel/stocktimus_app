import React, { useState } from 'react';
import apiClient from '../../services/api';

function TickerInputSection({ onAnalysisSubmit, watchedStocks, onAddToWatchlist, processing, errors }) {
  const [formData, setFormData] = useState({
    tickers: '',
    analysis_types: ['fundamentals'],
    session_name: '',
    save_results: true
  });

  const [tickerSuggestions, setTickerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Predefined popular tickers for quick selection
  const popularTickers = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'UBER', 'SPOT', 'COIN', 'HOOD', 'SOFI', 'CRWD', 'SNOW'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'analysis_types') {
        setFormData(prev => {
          let newTypes;
          if (checked) {
            // Add the analysis type if it's not already in the array (prevent duplicates)
            newTypes = prev.analysis_types.includes(value)
              ? prev.analysis_types
              : [...prev.analysis_types, value];
          } else {
            // Remove the analysis type
            newTypes = prev.analysis_types.filter(type => type !== value);
          }
          console.log(`Analysis types updated: ${newTypes}`);
          return { ...prev, analysis_types: newTypes };
        });
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));

      // Handle ticker suggestions
      if (name === 'tickers' && value.length > 0) {
        searchTickers(value);
      } else if (name === 'tickers' && value.length === 0) {
        setShowSuggestions(false);
      }
    }
  };

  const searchTickers = async (query) => {
    try {
      // Use existing ticker search endpoint
      const response = await apiClient.get(`/ticker-search/?q=${query}`);
      setTickerSuggestions(response.data.results || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching tickers:', error);
      setShowSuggestions(false);
    }
  };

  const handleTickerSelect = (ticker) => {
    const currentTickers = formData.tickers.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTickers.includes(ticker)) {
      const newTickers = [...currentTickers, ticker].join(', ');
      setFormData(prev => ({ ...prev, tickers: newTickers }));
    }
    setShowSuggestions(false);
  };

  const handlePopularTickerClick = (ticker) => {
    handleTickerSelect(ticker);
  };

  const handleWatchedStockClick = (ticker) => {
    handleTickerSelect(ticker);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.tickers.trim()) {
      alert('Please enter at least one ticker symbol');
      return;
    }

    if (formData.analysis_types.length === 0) {
      alert('Please select at least one analysis type');
      return;
    }

    // Parse tickers
    const tickers = formData.tickers
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t);

    // Ensure session_name is a string, even if empty
    const analysisRequest = {
      tickers,
      analysis_types: formData.analysis_types,
      session_name: formData.session_name || '',
      save_results: formData.save_results
    };

    console.log('Form data being submitted:', analysisRequest);
    onAnalysisSubmit(analysisRequest);
  };

  const handleLoadWatchedStocks = () => {
    if (watchedStocks.length > 0) {
      const watchedTickers = watchedStocks.map(stock => stock.ticker).join(', ');
      setFormData(prev => ({ ...prev, tickers: watchedTickers }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Stock Analysis Input</h2>
        <p className="text-gray-400 mb-6">
          Enter ticker symbols and select analysis types to begin comprehensive stock analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ticker Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ticker Symbols *
          </label>
          <input
            type="text"
            name="tickers"
            value={formData.tickers}
            onChange={handleInputChange}
            placeholder="e.g., AAPL, MSFT, GOOGL (comma separated)"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={processing}
          />

          {/* Ticker Suggestions Dropdown */}
          {showSuggestions && tickerSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {tickerSuggestions.slice(0, 10).map((ticker) => (
                <button
                  key={ticker.symbol}
                  type="button"
                  onClick={() => handleTickerSelect(ticker.symbol)}
                  className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                >
                  <div className="font-medium">{ticker.symbol}</div>
                  {ticker.name && (
                    <div className="text-sm text-gray-400 truncate">{ticker.name}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Ticker Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quick Selection
          </label>

          {/* Popular Tickers */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-2">Popular Stocks:</div>
            <div className="flex flex-wrap gap-2">
              {popularTickers.map(ticker => (
                <button
                  key={ticker}
                  type="button"
                  onClick={() => handlePopularTickerClick(ticker)}
                  className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                  disabled={processing}
                >
                  {ticker}
                </button>
              ))}
            </div>
          </div>

          {/* Watched Stocks */}
          {watchedStocks.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-2 flex items-center justify-between">
                <span>Your Watched Stocks:</span>
                <button
                  type="button"
                  onClick={handleLoadWatchedStocks}
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                  disabled={processing}
                >
                  Load All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedStocks.slice(0, 10).map(stock => (
                  <button
                    key={stock.ticker}
                    type="button"
                    onClick={() => handleWatchedStockClick(stock.ticker)}
                    className="px-2 py-1 text-xs bg-blue-700 text-blue-100 rounded hover:bg-blue-600 transition-colors"
                    disabled={processing}
                  >
                    ⭐ {stock.ticker}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analysis Types */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Analysis Types *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="analysis_types"
                value="fundamentals"
                checked={formData.analysis_types.includes('fundamentals')}
                onChange={handleInputChange}
                className="mr-2 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                disabled={processing}
              />
              <span className="text-white">Fundamentals Analysis</span>
              <span className="ml-2 text-xs text-gray-400">
                (P/E ratios, fair value, technical indicators)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="analysis_types"
                value="eps_trends"
                checked={formData.analysis_types.includes('eps_trends')}
                onChange={handleInputChange}
                className="mr-2 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                disabled={processing}
              />
              <span className="text-white">EPS Trends Analysis</span>
              <span className="ml-2 text-xs text-gray-400">
                (Earnings estimate revisions and trends)
              </span>
            </label>
          </div>
        </div>

        {/* Session Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Name (Optional)
            </label>
            <input
              type="text"
              name="session_name"
              value={formData.session_name}
              onChange={handleInputChange}
              placeholder="e.g., Q4 Tech Stocks Review"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={processing}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center mt-7">
              <input
                type="checkbox"
                name="save_results"
                checked={formData.save_results}
                onChange={handleInputChange}
                className="mr-2 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                disabled={processing}
              />
              <span className="text-white text-sm">Save results to history</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={processing || !formData.tickers.trim() || formData.analysis_types.length === 0}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing...
              </div>
            ) : (
              'Start Analysis'
            )}
          </button>
        </div>
      </form>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-md p-4">
          <h3 className="text-red-400 font-medium mb-2">Analysis Errors:</h3>
          <ul className="text-red-300 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TickerInputSection;