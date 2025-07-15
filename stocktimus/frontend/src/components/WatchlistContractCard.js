import React, { useState } from 'react';

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

  const formatCurrency = (n) => n != null ? `$${Number(n).toFixed(2)}` : '--';
  const formatNumber = (n) => n != null ? Number(n).toFixed(2) : '--';
  const formatPercent = (oldVal, newVal) => {
    if (!oldVal || !newVal) return '--';
    const change = ((newVal - oldVal) / oldVal) * 100;
    const symbol = change >= 0 ? '↑' : '↓';
    return `${symbol} ${Math.abs(change).toFixed(1)}%`;
  };
  const formatDate = (date) => date ? new Date(date).toISOString().slice(0, 10) : '--';

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
  } = contract;

  const startingEquity = number_of_contracts * initial_cost_per_contract;
  const currentEquity = number_of_contracts * average_cost_per_contract;

  return (
    <div className="card-dark flex gap-2 relative">
      {/* ✅ Delete Button (Top Right) */}
      <div className="absolute top-2 right-3 text-xs text-red-500 hover:underline cursor-pointer"
           onClick={() => setConfirmingDelete(true)}>
        Remove
      </div>

      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(id, e.target.checked)}
        className="mt-2"
      />
      <div className="flex-grow space-y-1 text-sm">
        <div className="font-semibold text-base">
          🟢 {ticker} {option_type?.toUpperCase()} @ ${formatNumber(strike)} — 📆 {expiration}
        </div>

        <div>
          💵 Premium: {formatCurrency(initial_cost_per_contract)} → {formatCurrency(average_cost_per_contract)} {formatPercent(initial_cost_per_contract, average_cost_per_contract)}
        </div>

        <div>
          📈 Underlying: {formatCurrency(underlying_price_at_add)} → {formatCurrency(current_underlying_price)} {formatPercent(underlying_price_at_add, current_underlying_price)}
        </div>

        <div>💰 Contracts: {number_of_contracts}</div>
        <div>
           Equity: {formatCurrency(startingEquity)} → {formatCurrency(currentEquity)} {formatPercent(startingEquity, currentEquity)}
        </div>

        <div>
          ⏳ Days: {initial_days_to_gain ?? '--'} goal | {dynamic_days_to_gain ?? '--'} left
        </div>

        <div>📅 Added: {formatDate(first_added_to_group_date)} | Goal Reset: {formatDate(last_reset_date)}</div>
        <div>🔁 Data Refreshed: {formatDate(last_refresh_date)}</div>

        <div className="flex gap-2 mt-2 flex-wrap">
          <button onClick={() => onReset(id)} className="btn-green">Reset Countdown</button>
          <button onClick={() => onRefresh(id)} className="btn-dark">Refresh Data</button>
          <button onClick={() => onUpdateGroups(id)} className="btn-green">Update Groups</button>
        </div>
      </div>

      {/* ✅ Confirm Delete Modal */}
      {confirmingDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="modal-dark w-80 text-center space-y-4">
            <p className="font-semibold">Are you sure you want to remove this contract?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  onDelete?.(id);
                  setConfirmingDelete(false);
                }}
                className="btn-danger"
              >
                Yes, Remove
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
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