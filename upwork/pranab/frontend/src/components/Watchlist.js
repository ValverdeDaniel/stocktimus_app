import React, { useState, useEffect } from 'react';
import WatchlistParamsForm from './WatchlistParamsForm';
import WatchlistTable from './WatchlistTable';
import WatchlistFilterControls from './WatchlistFilterControls';
import WatchlistGroups from './WatchlistGroups';
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
        // New milestone 1 fields
        "Initial Premium": item["Initial Premium"] ?? item.initial_premium ?? 0,
        "Current Premium": item["Current Premium"] ?? item.current_premium ?? 0,
        "Premium % Change": item["Premium % Change"] ?? item.premium_percent_change ?? null,
        "Initial Underlying": item["Initial Underlying"] ?? item.underlying_price_at_add ?? 0,
        "Current Underlying": item["Current Underlying"] ?? item.current_underlying_price ?? 0,
        "Underlying % Change": item["Underlying % Change"] ?? item.underlying_percent_change ?? null,
        "Initial Equity": item["Initial Equity"] ?? item.initial_equity_invested ?? 0,
        "Current Equity": item["Current Equity"] ?? item.current_equity_value ?? 0,
        "Equity % Change": item["Equity % Change"] ?? item.equity_percent_change ?? null,
        "Days Until Expiration": item["Days Until Expiration"] ?? item.days_until_expiration ?? null,
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
        
        // ✅ Refresh groups to show updated values with percentage changes
        await fetchGroups();
        
        // ✅ Also refresh saved contracts to ensure table shows latest data
        await fetchSavedContracts();
        
        alert(`Group simulation complete! Processed ${response.data?.length || 0} contracts. Values updated in real-time.`);
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

  return (
    <div className="p-4 text-text">
      <h2 className="heading-xl">📈 Watchlist Tool</h2>

      <WatchlistParamsForm
        groups={groups}
        fetchGroups={fetchGroups}
        fetchSavedContracts={fetchSavedContracts}
        // onSimulationComplete now bypasses normalization so you see every column
        onSimulationComplete={(results) => {
          console.log('✅ Simulation Results:', results);
          console.log('🔍 Bypassing normalization for ad-hoc simulator—using raw data');
          setWatchlistItems(results);
        }}
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

      <WatchlistFilterControls
        data={watchlistItems}
        selectedTickers={selectedTickers}
        setSelectedTickers={setSelectedTickers}
      />

      <WatchlistTable items={watchlistItems} selectedTickers={selectedTickers} />
    </div>
  );
}

export default Watchlist;
