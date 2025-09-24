import React, { useState, useEffect } from 'react';
import SinceBeingTrackedSection from './SinceBeingTrackedSection';
import SimulationScenariosSection from './SimulationScenariosSection';
import GreeksMarketSection from './GreeksMarketSection';
import apiClient from '../services/api';

export default function WatchlistContractCard({
  contract,
  isSelected,
  onSelect,
  onReset,
  onRefresh,
  onUpdateGroups,
  onDelete,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expansionLevel, setExpansionLevel] = useState(0); // 0=collapsed, 1=summary, 2=full

  // Shared API state for market data
  const [marketData, setMarketData] = useState(null);
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [marketDataError, setMarketDataError] = useState(null);

  // --- Formatters ---
  const formatCurrency = (n) => (n != null ? `$${Number(n).toFixed(2)}` : '--');
  const formatNumber = (n) => (n != null ? Number(n).toFixed(2) : '--');
  const formatPercent = (oldVal, newVal) => {
    if (!oldVal || !newVal || Number(oldVal) === 0) return '--';
    const change = ((newVal - oldVal) / oldVal) * 100;
    const symbol = change >= 0 ? '↑' : '↓';
    return `${symbol} ${Math.abs(change).toFixed(1)}%`;
  };
  const formatDate = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '--');

  // Shared market data fetcher
  const fetchMarketData = async () => {
    if (marketData || marketDataLoading) return;

    setMarketDataLoading(true);
    setMarketDataError(null);

    try {
      const contractData = {
        ticker: contract.ticker,
        option_type: contract.option_type,
        strike: contract.strike,
        expiration: contract.expiration,
        days_to_gain: contract.dynamic_days_to_gain,
        number_of_contracts: contract.number_of_contracts,
        average_cost_per_contract: contract.average_cost_per_contract,
      };

      const response = await apiClient.post('/run-watchlist/', { contracts: [contractData] });

      if (response.data && response.data.length > 0) {
        setMarketData(response.data);
      } else {
        setMarketDataError('No market data returned');
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setMarketDataError('Failed to load market data');
    } finally {
      setMarketDataLoading(false);
    }
  };

  const {
    id,
    ticker,
    option_type,
    expiration,
    strike,
    number_of_contracts = 1,
    initial_cost_per_contract = 0,
    average_cost_per_contract = 0,
    first_added_to_group_date,
    last_reset_date,
    last_refresh_date,
    underlying_price_at_add = 0,
    current_underlying_price = 0,
    dynamic_days_to_gain,
    initial_days_to_gain,
    initial_premium = 0,
    current_premium = 0,
    initial_equity = 0,
    current_equity = 0,
    underlying_percent_change = 0,
    premium_percent_change = 0,
    equity_percent_change = 0,
  } = contract;

  // --- Initial Render Debug ---
  useEffect(() => {
    console.group(`📦 Rendering WatchlistContractCard - Contract ID: ${id}`);
    console.log('Ticker:', ticker);
    console.log('Option Type:', option_type);
    console.log('Strike:', strike);
    console.log('Expiration:', expiration);
    console.log('Number of Contracts:', number_of_contracts);
    console.log('Initial Cost per Contract:', initial_cost_per_contract);
    console.log('Average Cost per Contract:', average_cost_per_contract);
    console.log('Underlying Price at Add:', underlying_price_at_add);
    console.log('Current Underlying Price:', current_underlying_price);
    console.log('Days (initial → dynamic):', initial_days_to_gain, '→', dynamic_days_to_gain);
    console.groupEnd();
  }, [id, ticker, option_type, strike, expiration]);

  // --- Handlers with Debug ---
  const handleSelectChange = (e) => {
    const checked = e.target.checked;
    console.log(`☑ Contract ID: ${id} → Checkbox ${checked ? 'selected' : 'deselected'}`);
    onSelect(id, checked);
  };

  const handleReset = () => {
    console.group(`⏳ Reset Countdown Clicked - Contract ID: ${id}`);
    console.log('Ticker:', ticker, 'Strike:', strike, 'Expiration:', expiration);
    console.groupEnd();
    onReset(id);
  };

  const handleRefresh = () => {
    console.group(`🔄 Refresh Data Clicked - Contract ID: ${id}`);
    console.log('Ticker:', ticker, 'Current Underlying Price:', current_underlying_price);
    console.groupEnd();
    onRefresh(id);
  };

  const handleUpdateGroups = () => {
    console.group(`🔗 Update Groups Clicked - Contract ID: ${id}`);
    console.log('Ticker:', ticker, 'Option Type:', option_type);
    console.groupEnd();
    onUpdateGroups(id);
  };

  const handleDelete = () => {
    console.group(`🗑 Confirming Deletion - Contract ID: ${id}`);
    console.log('Ticker:', ticker, 'Strike:', strike);
    console.groupEnd();
    onDelete?.(id);
    setConfirmingDelete(false);
  };

  // Expansion level handlers
  const handleToggleExpansion = () => {
    if (expansionLevel === 0) {
      setExpansionLevel(1); // Collapsed → Summary
    } else if (expansionLevel === 1) {
      setExpansionLevel(0); // Summary → Collapsed
    } else {
      setExpansionLevel(1); // Full → Summary
    }
  };

  const handleFullAnalysis = async () => {
    setExpansionLevel(2); // Summary → Full
    await fetchMarketData(); // Fetch fresh data for full analysis
  };

  // Get best and worst case scenarios for Level 1 preview
  const getScenarioPreview = () => {
    if (!marketData || !marketData.length) return null;

    // Find current, best (+200%), and worst (-90%) scenarios
    const current = marketData.find(row => row['Underlying Scenario % Change'] === '±5%');
    const best = marketData.find(row => row['Underlying Scenario % Change'] === '±200%');
    const worst = marketData.find(row => row['Underlying Scenario % Change'] === '±90%');

    return { current, best, worst };
  };

  // Render different levels based on expansion state
  const renderLevel0 = () => (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-800/30 cursor-pointer" onClick={handleToggleExpansion}>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectChange}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        />
        <div className="font-medium text-sm">
          🟢 {ticker} {option_type?.toUpperCase()} @ ${formatNumber(strike)} — 📆 {expiration}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-300">
        <span>Premium: {formatCurrency(current_premium)} ({premium_percent_change >= 0 ? '+' : ''}{premium_percent_change?.toFixed(1)}%)</span>
        <span>Days: {dynamic_days_to_gain || '--'} left</span>
        <span>Equity: {formatCurrency(current_equity)} ({equity_percent_change >= 0 ? '+' : ''}{equity_percent_change?.toFixed(1)}%)</span>
        <span className="text-blue-400">▶</span>
      </div>
    </div>
  );

  const renderLevel1 = () => {
    const scenarioPreview = getScenarioPreview();
    return (
      <div className="space-y-3">
        {/* Header - clickable to collapse */}
        <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-800/30 cursor-pointer" onClick={handleToggleExpansion}>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelectChange}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0"
            />
            <div className="font-medium text-sm">
              🟢 {ticker} {option_type?.toUpperCase()} @ ${formatNumber(strike)} — 📆 {expiration}
            </div>
          </div>
          <span className="text-blue-400 text-xs">▼</span>
        </div>

        {/* Summary content */}
        <div className="px-3 space-y-2">
          <SinceBeingTrackedSection contract={contract} />

          {/* Quick scenario preview */}
          {scenarioPreview && (
            <div className="bg-gray-800/50 rounded p-2 text-xs">
              <div className="font-semibold text-gray-300 mb-1 text-[11px]">📊 Quick Scenarios</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-blue-400 text-[10px]">Current</div>
                  <div className="text-white text-[10px]">{formatCurrency(scenarioPreview.current?.['Current Premium'])}</div>
                </div>
                <div>
                  <div className="text-green-400 text-[10px]">Best (+200%)</div>
                  <div className="text-white text-[10px]">{formatCurrency(scenarioPreview.best?.['Simulated Premium (+)'])}</div>
                </div>
                <div>
                  <div className="text-red-400 text-[10px]">Worst (-90%)</div>
                  <div className="text-white text-[10px]">{formatCurrency(scenarioPreview.worst?.['Simulated Premium (-)'])}</div>
                </div>
              </div>
            </div>
          )}

          {/* Full Analysis button */}
          <div className="flex justify-center">
            <button onClick={handleFullAnalysis} className="btn-blue text-xs px-3 py-1">
              Full Analysis
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLevel2 = () => (
    <div className="space-y-3">
      {/* Header - clickable to collapse to Level 1 */}
      <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-800/30 cursor-pointer" onClick={handleToggleExpansion}>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          />
          <div className="font-medium text-sm">
            🟢 {ticker} {option_type?.toUpperCase()} @ ${formatNumber(strike)} — 📆 {expiration}
          </div>
        </div>
        <span className="text-blue-400 text-xs">▲</span>
      </div>

      {/* Full detail content */}
      <div className="px-3 space-y-2">
        <SinceBeingTrackedSection contract={contract} />
        <SimulationScenariosSection
          contract={contract}
          simulationData={marketData}
          loading={marketDataLoading}
          error={marketDataError}
        />
        <GreeksMarketSection
          contract={contract}
          simulationData={marketData?.[0]}
          loading={marketDataLoading}
          error={marketDataError}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button onClick={handleReset} className="btn-green text-xs px-3 py-1">
            Reset Countdown
          </button>
          <button onClick={handleRefresh} className="btn-dark text-xs px-3 py-1">
            Refresh Data
          </button>
          <button onClick={handleUpdateGroups} className="btn-green text-xs px-3 py-1">
            Update Groups
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card-dark relative">
      {/* Delete Button (Top Right) */}
      <div
        className="absolute top-2 right-3 text-xs text-red-500 hover:underline cursor-pointer z-10"
        onClick={() => {
          console.log(`⚠ Showing delete confirmation modal for Contract ID: ${id}`);
          setConfirmingDelete(true);
        }}
      >
        Remove
      </div>

      {/* Render appropriate level */}
      {expansionLevel === 0 && renderLevel0()}
      {expansionLevel === 1 && renderLevel1()}
      {expansionLevel === 2 && renderLevel2()}

      {/* ✅ Confirm Delete Modal */}
      {confirmingDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="modal-dark w-80 text-center space-y-4">
            <p className="font-semibold">Are you sure you want to remove this contract?</p>
            <div className="flex justify-center gap-4">
              <button onClick={handleDelete} className="btn-danger">
                Yes, Remove
              </button>
              <button
                onClick={() => {
                  console.log(`❌ Cancelled delete for Contract ID: ${id}`);
                  setConfirmingDelete(false);
                }}
                className="btn-dark"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}