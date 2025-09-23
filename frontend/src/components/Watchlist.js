import React, { useState, useEffect } from 'react';
import WatchlistParamsForm from './WatchlistParamsForm';
import WatchlistTable from './WatchlistTable';
import WatchlistFilterControls from './WatchlistFilterControls';
import WatchlistGroups from './WatchlistGroups';
import LoadingOverlay from './LoadingOverlay';
import {
  getSavedContracts,
  getWatchlistGroups,
  runBulkWatchlist,
  deleteSavedContract,
  assignContractsToGroup,
  simulateGroupContracts, // ✅ API helper for running group simulations
} from '../services/api';

function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState({ current: 0, total: 0 });

  // For debug/missing-column checks
  const EXPECTED_COLUMNS = [
    "Ticker", "Option Type", "Strike", "Expiration",
    "Current Premium", "Current Underlying",
    "Number of Contracts", "Average Cost per Contract",
    "Equity Invested", "Days to Gain",
    "Bid", "Ask", "Volume", "Open Interest",
    "Implied Volatility", "Delta", "Theta", "Gamma", "Vega", "Rho"
  ];

  useEffect(() => {
    fetchSavedContracts();
    fetchGroups();
  }, []);

  // --- Fetch Saved Contracts (with normalization) ---
  const fetchSavedContracts = async () => {
    try {
      const response = await getSavedContracts();
      console.log('📥 API Response (Saved Contracts):', response.data);
      if (response.data?.length > 0) {
        console.log('🔑 Keys in first saved contract:', Object.keys(response.data[0]));
      } else {
        console.warn('⚠ No saved contracts returned.');
      }

      const normalized = normalizeDataForTable(response.data);
      console.log('🔍 Normalized Saved Contracts:', normalized);
      setWatchlistItems(normalized);
      console.log('📊 Updated Watchlist Items (Saved):', normalized);
    } catch (error) {
      console.error('Error loading saved contracts:', error.response?.data || error.message);
    }
  };

  // --- Fetch Groups ---
  const fetchGroups = async () => {
    try {
      const response = await getWatchlistGroups();
      console.log('📥 API Response (Groups):', response.data);
      setGroups(Array.isArray(response.data) ? response.data : []);
      console.log('📊 Updated Groups:', response.data);
    } catch (error) {
      console.error('Error loading groups:', error.response?.data || error.message);
    }
  };

  // --- Normalizer for saved-contract payloads ---
  const normalizeDataForTable = (data) => {
    console.log(`🔄 Normalizing ${data?.length || 0} rows...`);
    return data.map((item, index) => {
      console.log(`Row ${index} Raw Data:`, item);

      const normalized = {
        "Ticker": item.Ticker ?? item.ticker ?? '',
        "Option Type": item["Option Type"] ?? item.option_type ?? '',
        "Strike": item.Strike ?? item.strike ?? '',
        "Expiration": item.Expiration ?? item.expiration ?? '',
        "Current Premium": item["Current Premium"] ?? item.current_premium ?? 0,
        "Current Underlying": item["Current Underlying"] ?? item.current_underlying_price ?? 0,
        "Number of Contracts": item["Number of Contracts"] ?? item.number_of_contracts ?? 0,
        "Average Cost per Contract": item["Average Cost per Contract"] ?? item.average_cost_per_contract ?? 0,
        "Equity Invested": item["Equity Invested"] ?? item.equity_invested ?? 0,
        "Days to Gain": item["Days to Gain"] ?? item.days_to_gain ?? 0,
        "Bid": item.Bid ?? item.bid ?? 0,
        "Ask": item.Ask ?? item.ask ?? 0,
        "Volume": item.Volume ?? item.volume ?? 0,
        "Open Interest": item["Open Interest"] ?? item.open_interest ?? 0,
        "Implied Volatility": item["Implied Volatility"] ?? item.implied_volatility ?? 0,
        "Delta": item.Delta ?? item.delta ?? 'NA',
        "Theta": item.Theta ?? item.theta ?? 'NA',
        "Gamma": item.Gamma ?? item.gamma ?? 'NA',
        "Vega": item.Vega ?? item.vega ?? 'NA',
        "Rho": item.Rho ?? item.rho ?? 'NA',
      };

      console.log(`Row ${index} Normalized Data:`, normalized);
      const missing = EXPECTED_COLUMNS.filter(col => !(col in normalized));
      if (missing.length > 0) {
        console.warn(`⚠ Row ${index} is missing columns:`, missing);
      }

      return normalized;
    });
  };

  // --- Run Selected Contracts (bypass normalization) ---
  const handleRunSelected = async () => {
    try {
      const response = await runBulkWatchlist({ contract_ids: selectedContracts });
      console.log('📥 API Response (Run Selected):', response.data);

      if (Array.isArray(response.data)) {
        console.log('🔍 Bypassing normalization for simulation—using raw data');
        setWatchlistItems(response.data);
      } else {
        console.error('Unexpected response running selected contracts:', response.data);
        alert(`Server returned unexpected response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error('Error running selected contracts:', error.response?.data || error.message);
      alert(`Failed to run selected contracts: ${error.message}`);
    }
  };

  // --- Run a Group (bypass normalization) ---
  const handleRunGroup = async (groupId) => {
    try {
      console.log(`▶ Running group with ID: ${groupId}`);
      const response = await simulateGroupContracts(groupId);
      console.log('📥 API Response (Run Group):', response.data);

      if (Array.isArray(response.data)) {
        console.log('🔍 Bypassing normalization for group simulation—using raw data');
        setWatchlistItems(response.data);
      } else if (response.data.error) {
        console.error('Server error running group:', response.data);
        alert(`Server error: ${response.data.error}`);
      } else {
        console.error('Unexpected response running group:', response.data);
        alert(`Unexpected server response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error('Error running group:', error.response?.data || error.message);
      alert(`Failed to run group: ${error.message}`);
    }
  };

  // --- Delete Contract ---
  const handleDeleteContract = async (id) => {
    try {
      await deleteSavedContract(id);
      await fetchSavedContracts();
    } catch (error) {
      console.error('Error deleting contract:', error.response?.data || error.message);
      alert(`Failed to delete contract: ${error.message}`);
    }
  };

  // --- Scroll to Results ---
  const scrollToResults = () => {
    setTimeout(() => {
      const tableElement = document.querySelector('[data-watchlist-table]');
      if (tableElement) {
        tableElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100); // Small delay to ensure DOM has updated
  };

  // --- Handle Simulation Start ---
  const handleSimulationStart = (contractCount) => {
    setIsSimulating(true);
    setSimulationProgress({ current: 0, total: contractCount });

    // Simulate progress during the API call
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      if (currentProgress < contractCount) {
        currentProgress++;
        setSimulationProgress(prev => ({ ...prev, current: currentProgress }));
      } else {
        clearInterval(progressInterval);
      }
    }, 1000); // Update every second

    // Store interval ID to clear it if needed
    window.simulationProgressInterval = progressInterval;
  };

  // --- Handle Simulation Complete ---
  const handleSimulationComplete = (results) => {
    // Clear any running progress interval
    if (window.simulationProgressInterval) {
      clearInterval(window.simulationProgressInterval);
      window.simulationProgressInterval = null;
    }

    console.log('✅ Simulation Results:', results);
    console.log('🔍 Bypassing normalization for ad-hoc simulator—using raw data');
    setWatchlistItems(results);
    setIsSimulating(false);
    setSimulationProgress({ current: 0, total: 0 });
    scrollToResults();
  };

  return (
    <div className="p-4 text-text">
      <h2 className="heading-xl">📈 Watchlist Tool</h2>

      <WatchlistParamsForm
        groups={groups}
        fetchGroups={fetchGroups}
        fetchSavedContracts={fetchSavedContracts}
        onSimulationStart={handleSimulationStart}
        onSimulationComplete={handleSimulationComplete}
      />

      <WatchlistGroups
        groups={groups}
        onRunGroup={handleRunGroup}
        fetchGroups={fetchGroups}
        selectedContracts={selectedContracts}
        setSelectedContracts={setSelectedContracts}
        handleRunSelected={handleRunSelected}
        handleBulkDelete={handleDeleteContract}
        handleBulkAssign={async (selectedGroupIds) => {
          try {
            for (const groupId of selectedGroupIds) {
              await assignContractsToGroup(groupId, selectedContracts);
            }
            alert('Contracts assigned successfully!');
            setSelectedContracts([]);
            await fetchGroups();
            await fetchSavedContracts();
          } catch (error) {
            console.error('Error bulk assigning:', error.response?.data || error.message);
            alert(`Failed to assign contracts: ${error.message}`);
          }
        }}
      />

      <div data-watchlist-table>
        <WatchlistFilterControls
          data={watchlistItems}
          selectedTickers={selectedTickers}
          setSelectedTickers={setSelectedTickers}
        />

        <WatchlistTable items={watchlistItems} selectedTickers={selectedTickers} />
      </div>

      <LoadingOverlay
        isVisible={isSimulating}
        currentProgress={simulationProgress.current}
        totalProgress={simulationProgress.total}
        message="Running Watchlist Simulation"
      />
    </div>
  );
}

export default Watchlist;
