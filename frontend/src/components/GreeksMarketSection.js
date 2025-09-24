import React, { useState, useEffect } from 'react';
import ExpandableSection from './ExpandableSection';
import apiClient from '../services/api';

function GreeksMarketSection({ contract }) {
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSimulationData = async () => {
    if (simulationData || loading) return;

    setLoading(true);
    setError(null);

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
        setSimulationData(response.data[0]);
      } else {
        setError('No market data returned');
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const formatGreek = (value) => {
    if (value == null || value === 'NA' || isNaN(value)) return 'NA';
    return Number(value).toFixed(4);
  };

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '--';
    return `$${Number(value).toFixed(2)}`;
  };

  const formatNumber = (value) => {
    if (value == null || isNaN(value)) return '--';
    return Number(value).toLocaleString();
  };

  const formatPercentage = (value) => {
    if (value == null || isNaN(value)) return '--';
    return `${Number(value).toFixed(2)}%`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-400">Loading market data...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-2">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchSimulationData}
            className="mt-1 text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!simulationData) {
      return <div className="text-sm text-gray-400 py-2">No market data available</div>;
    }

    return (
      <div className="bg-gray-800/50 rounded p-2 text-xs space-y-1.5">
        {/* Greeks Section */}
        <div>
          <div className="font-semibold text-gray-300 mb-1 border-b border-gray-600 pb-0.5 text-[11px]">
            🎯 Option Greeks
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Delta:</span>
              <span className="text-white text-[10px]">{formatGreek(simulationData.Delta)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Theta:</span>
              <span className="text-white text-[10px]">{formatGreek(simulationData.Theta)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Gamma:</span>
              <span className="text-white text-[10px]">{formatGreek(simulationData.Gamma)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Vega:</span>
              <span className="text-white text-[10px]">{formatGreek(simulationData.Vega)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Rho:</span>
              <span className="text-white text-[10px]">{formatGreek(simulationData.Rho)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">IV:</span>
              <span className="text-white text-[10px]">{formatPercentage(simulationData['Implied Volatility'])}</span>
            </div>
          </div>
        </div>

        {/* Market Data Section */}
        <div className="pt-1.5 border-t border-gray-700">
          <div className="font-semibold text-gray-300 mb-1 border-b border-gray-600 pb-0.5 text-[11px]">
            📊 Market Data
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Bid:</span>
              <span className="text-white text-[10px]">{formatCurrency(simulationData.Bid)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Ask:</span>
              <span className="text-white text-[10px]">{formatCurrency(simulationData.Ask)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Volume:</span>
              <span className="text-white text-[10px]">{formatNumber(simulationData.Volume)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-[10px]">Open Int:</span>
              <span className="text-white text-[10px]">{formatNumber(simulationData['Open Interest'])}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ExpandableSection
      title="🎯 Greeks & Market Data"
      icon="▶"
      onExpand={fetchSimulationData}
    >
      {renderContent()}
    </ExpandableSection>
  );
}

export default GreeksMarketSection;