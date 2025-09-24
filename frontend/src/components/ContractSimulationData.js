import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

function ContractSimulationData({ contract }) {
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch simulation data for this specific contract
  const fetchSimulationData = async () => {
    if (simulationData || loading) return; // Don't fetch if already loaded or loading

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
        setError('No simulation data returned');
      }
    } catch (err) {
      console.error('Error fetching simulation data:', err);
      setError('Failed to load simulation data');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when component mounts
  useEffect(() => {
    fetchSimulationData();
  }, [contract.id]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-400">Loading simulation data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-2">
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
    return <div className="text-sm text-gray-400">No simulation data available</div>;
  }

  return { simulationData };
}

export default ContractSimulationData;