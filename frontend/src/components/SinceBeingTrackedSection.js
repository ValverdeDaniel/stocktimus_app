import React from 'react';
import ExpandableSection from './ExpandableSection';

function SinceBeingTrackedSection({ contract }) {
  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '--';
    return `$${Number(value).toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value);
    const color = num >= 0 ? 'text-green-400' : 'text-red-400';
    const symbol = num >= 0 ? '↑' : '↓';
    return <span className={color}>{symbol} {Math.abs(num).toFixed(1)}%</span>;
  };

  const formatNumber = (value) => {
    if (value == null || isNaN(value)) return '--';
    return Number(value).toFixed(0);
  };

  const formatDate = (date) => {
    if (!date) return '--';
    return new Date(date).toISOString().slice(0, 10);
  };

  const {
    initial_premium = 0,
    current_premium = 0,
    underlying_price_at_add = 0,
    current_underlying_price = 0,
    initial_equity = 0,
    current_equity = 0,
    number_of_contracts = 1,
    initial_days_to_gain,
    dynamic_days_to_gain,
    premium_percent_change = 0,
    underlying_percent_change = 0,
    equity_percent_change = 0,
    first_added_to_group_date,
    last_reset_date,
    last_refresh_date,
  } = contract;

  return (
    <ExpandableSection
      title="📊 Since Being Tracked"
      icon="▶"
      defaultExpanded={false}
    >
      <div className="bg-gray-800/50 rounded p-2 text-xs space-y-1.5">
        {/* Performance Metrics */}
        <div>
          <div className="font-semibold text-gray-300 mb-1 border-b border-gray-600 pb-0.5 text-[11px]">
            📈 Performance
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div className="flex justify-between items-start">
              <span className="text-gray-400 text-[10px]">Premium:</span>
              <div className="text-right">
                <div className="text-white text-[10px] leading-tight">
                  {formatCurrency(initial_premium)} → {formatCurrency(current_premium)}
                </div>
                <div className="text-[9px] leading-tight">
                  {formatPercent(premium_percent_change)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-gray-400 text-[10px]">Underlying:</span>
              <div className="text-right">
                <div className="text-white text-[10px] leading-tight">
                  {formatCurrency(underlying_price_at_add)} → {formatCurrency(current_underlying_price)}
                </div>
                <div className="text-[9px] leading-tight">
                  {formatPercent(underlying_percent_change)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-gray-400 text-[10px]">Equity:</span>
              <div className="text-right">
                <div className="text-white text-[10px] leading-tight">
                  {formatCurrency(initial_equity)} → {formatCurrency(current_equity)}
                </div>
                <div className="text-[9px] leading-tight">
                  {formatPercent(equity_percent_change)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Contracts:</span>
              <div className="text-white text-[10px]">{formatNumber(number_of_contracts)}</div>
            </div>
          </div>
        </div>

        {/* Time Tracking */}
        <div className="pt-1.5 border-t border-gray-700">
          <div className="font-semibold text-gray-300 mb-1 border-b border-gray-600 pb-0.5 text-[11px]">
            ⏳ Time Tracking
          </div>

          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-[10px]">Days Progress:</span>
            <div className="text-right">
              <div className="text-white text-[10px] leading-tight">
                {formatNumber(initial_days_to_gain)} goal | {formatNumber(dynamic_days_to_gain)} left
              </div>
              {initial_days_to_gain > 0 && (
                <div className="text-[9px] text-blue-400 leading-tight">
                  {Math.round(((initial_days_to_gain - dynamic_days_to_gain) / initial_days_to_gain) * 100)}% elapsed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date Tracking */}
        <div className="pt-1.5 border-t border-gray-700">
          <div className="font-semibold text-gray-300 mb-1 border-b border-gray-600 pb-0.5 text-[11px]">
            📅 Date Tracking
          </div>

          <div className="space-y-0.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Added:</span>
              <div className="text-white text-[10px]">{formatDate(first_added_to_group_date)}</div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Goal Reset:</span>
              <div className="text-white text-[10px]">{formatDate(last_reset_date)}</div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Data Refreshed:</span>
              <div className="text-white text-[10px]">{formatDate(last_refresh_date)}</div>
            </div>
          </div>
        </div>
      </div>
    </ExpandableSection>
  );
}

export default SinceBeingTrackedSection;