import React, { useState, useEffect } from 'react';

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

  return (
    <div className="card-dark flex gap-2 relative">
      {/* ✅ Delete Button (Top Right) */}
      <div
        className="absolute top-2 right-3 text-xs text-red-500 hover:underline cursor-pointer"
        onClick={() => {
          console.log(`⚠ Showing delete confirmation modal for Contract ID: ${id}`);
          setConfirmingDelete(true);
        }}
      >
        Remove
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleSelectChange}
        className="mt-2"
      />

      <div className="flex-grow space-y-1 text-sm">
        {/* Header */}
        <div className="font-semibold text-base">
          🟢 {ticker} {option_type?.toUpperCase()} @ ${formatNumber(strike)} — 📆 {expiration}
        </div>

        {/* Premium */}
        <div>
          💵 Premium: {formatCurrency(initial_premium)} → {formatCurrency(current_premium)}{' '}
          {premium_percent_change && premium_percent_change !== 0 ? `${premium_percent_change >= 0 ? '↑' : '↓'} ${Math.abs(premium_percent_change).toFixed(1)}%` : '--'}
        </div>

        {/* Underlying */}
        <div>
          📈 Underlying: {formatCurrency(underlying_price_at_add)} → {formatCurrency(current_underlying_price)}{' '}
          {underlying_percent_change && underlying_percent_change !== 0 ? `${underlying_percent_change >= 0 ? '↑' : '↓'} ${Math.abs(underlying_percent_change).toFixed(1)}%` : '--'}
        </div>

        {/* Contracts */}
        <div>💰 Contracts: {number_of_contracts}</div>

        {/* Equity */}
        <div>
           Equity: {formatCurrency(initial_equity)} → {formatCurrency(current_equity)}{' '}
          {equity_percent_change && equity_percent_change !== 0 ? `${equity_percent_change >= 0 ? '↑' : '↓'} ${Math.abs(equity_percent_change).toFixed(1)}%` : '--'}
        </div>

        {/* Days */}
        <div>
          ⏳ Days: {initial_days_to_gain ?? '--'} goal | {dynamic_days_to_gain ?? '--'} left
        </div>

        {/* Dates */}
        <div>
          📅 Added: {formatDate(first_added_to_group_date)} | Goal Reset: {formatDate(last_reset_date)}
        </div>
        <div>🔁 Data Refreshed: {formatDate(last_refresh_date)}</div>

        {/* Buttons */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={handleReset} className="btn-green">
            Reset Countdown
          </button>
          <button onClick={handleRefresh} className="btn-dark">
            Refresh Data
          </button>
          <button onClick={handleUpdateGroups} className="btn-green">
            Update Groups
          </button>
        </div>
      </div>

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
