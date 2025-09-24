import React from 'react';
import ExpandableSection from './ExpandableSection';

function SimulationScenariosSection({ contract, simulationData, loading, error }) {

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '--';
    return `$${Number(value).toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value);
    const color = num >= 0 ? 'text-green-400' : 'text-red-400';
    const symbol = num >= 0 ? '+' : '';
    return <span className={color}>{symbol}{num.toFixed(1)}%</span>;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-400">Loading scenarios...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      );
    }

    if (!simulationData || simulationData.length === 0) {
      return <div className="text-sm text-gray-400 py-2">No simulation data available</div>;
    }

    // Process all scenario rows from backend
    const allScenarios = [];

    simulationData.forEach(row => {
      const scenarioChange = row['Underlying Scenario % Change'];
      const currentUnderlying = row['Current Underlying'];
      const currentPremium = row['Current Premium'];

      // Add current scenario
      if (allScenarios.length === 0) {
        allScenarios.push({
          label: 'Current',
          icon: '📊',
          underlying: currentUnderlying,
          premium: currentPremium,
          change: null,
          color: 'text-blue-400'
        });
      }

      // Extract percentage from scenario change (e.g., "±5%" -> "5")
      const percentMatch = scenarioChange?.match(/(\d+)%/);
      if (percentMatch) {
        const percent = parseInt(percentMatch[1]);

        // Add positive scenario
        allScenarios.push({
          label: `+${percent}%`,
          icon: '📈',
          underlying: row['Simulated Underlying (+)'],
          premium: row['Simulated Premium (+)'],
          change: row['Simulated Premium (+) % Change'],
          color: 'text-green-400'
        });

        // Add negative scenario
        allScenarios.push({
          label: `-${percent}%`,
          icon: '📉',
          underlying: row['Simulated Underlying (-)'],
          premium: row['Simulated Premium (-)'],
          change: row['Simulated Premium (-) % Change'],
          color: 'text-red-400'
        });
      }
    });

    // Sort scenarios: Current first, then positive scenarios (ascending), then negative scenarios (descending)
    const sortedScenarios = allScenarios.sort((a, b) => {
      if (a.label === 'Current') return -1;
      if (b.label === 'Current') return 1;

      const aPercent = parseInt(a.label.replace(/[+%-]/g, '')) || 0;
      const bPercent = parseInt(b.label.replace(/[+%-]/g, '')) || 0;
      const aIsPositive = a.label.startsWith('+');
      const bIsPositive = b.label.startsWith('+');

      if (aIsPositive && bIsPositive) return aPercent - bPercent; // +5%, +10%, +20%...
      if (!aIsPositive && !bIsPositive) return bPercent - aPercent; // -5%, -10%, -20%...
      if (aIsPositive && !bIsPositive) return -1; // Positive before negative
      if (!aIsPositive && bIsPositive) return 1;

      return 0;
    });

    return (
      <div className="bg-gray-800/50 rounded p-2 text-xs">
        <div className="grid grid-cols-4 gap-1 mb-1 font-semibold text-gray-300 border-b border-gray-600 pb-0.5 text-center text-[10px]">
          <div>Scenario</div>
          <div>Underlying</div>
          <div>Premium</div>
          <div>% Change</div>
        </div>

        {sortedScenarios.map((scenario, index) => (
          <div key={index} className={`grid grid-cols-4 gap-1 py-0.5 text-center text-[10px] ${index > 0 ? 'border-t border-gray-700/50' : ''}`}>
            <div className={`font-medium ${scenario.color} text-[9px]`}>
              {scenario.icon} {scenario.label}
            </div>
            <div className="text-white">{formatCurrency(scenario.underlying)}</div>
            <div className="text-white">{formatCurrency(scenario.premium)}</div>
            <div className="text-[9px]">
              {scenario.change !== null ? formatPercent(scenario.change) : <span className="text-gray-400">--</span>}
            </div>
          </div>
        ))}

        <div className="mt-1 text-[9px] text-gray-400">
          {simulationData.length} scenario{simulationData.length !== 1 ? 's' : ''} calculated
        </div>
      </div>
    );
  };

  return (
    <ExpandableSection
      title={`📈 Simulation Scenarios (${simulationData ? simulationData.length * 2 + 1 : '?'})`}
      icon="▶"
      defaultExpanded={true}
    >
      {renderContent()}
    </ExpandableSection>
  );
}

export default SimulationScenariosSection;