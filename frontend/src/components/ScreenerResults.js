import React, { useState, useEffect } from 'react';
import {
  runScreenerBackend,
  getSavedParameters,
  saveParameterSet,
  deleteParameterSet
} from '../services/api';
import ScreenerScenarioForm from './ScreenerScenarioForm';
import ScreenerSavedParams from './ScreenerSavedParams';
import ScreenerResultsTable from './ScreenerResultsTable';
import StandardLoader from './StandardLoader';

function ScreenerResults() {
  const [paramSets, setParamSets] = useState([
    {
      tickers: 'AAPL',
      option_type: 'call',
      days_until_exp: 90,
      strike_pct: 0.1,
      days_to_gain: 30,
      stock_gain_pct: 0.08,
      allocation: 1000,
      label: 'Scenario 1',
    },
  ]);
  const [savedParams, setSavedParams] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedParams();
    // eslint-disable-next-line
  }, []);

  const fetchSavedParams = async () => {
    try {
      const res = await getSavedParameters();
      setSavedParams(res.data);
    } catch (err) {
      console.error('Error fetching saved parameters:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formatted = paramSets.map((p) => ({
        ...p,
        tickers: p.tickers.split(',').map((t) => t.trim().toUpperCase()),
        strike_pct: parseFloat(p.strike_pct),
        stock_gain_pct: parseFloat(p.stock_gain_pct),
        allocation: parseFloat(p.allocation),
        days_to_gain: parseInt(p.days_to_gain),
        days_until_exp: parseInt(p.days_until_exp),
      }));

      const res = await runScreenerBackend({ param_sets: formatted });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to run screener.');
    } finally {
      setLoading(false);
    }
  };

  const updateScenario = (index, field, value) => {
    const updated = [...paramSets];
    updated[index][field] = value;
    setParamSets(updated);
  };

  const addScenario = () => {
    setParamSets([
      ...paramSets,
      {
        tickers: '',
        option_type: 'call',
        days_until_exp: 30,
        strike_pct: 0.1,
        days_to_gain: 30,
        stock_gain_pct: 0.05,
        allocation: 1000,
        label: `Scenario ${paramSets.length + 1}`,
      },
    ]);
  };

  const removeScenario = (index) => {
    setParamSets(paramSets.filter((_, i) => i !== index));
  };

  const loadSavedScenario = (param) => {
    setParamSets([
      ...paramSets,
      {
        ...param,
        tickers: Array.isArray(param.tickers)
          ? param.tickers.join(', ')
          : param.tickers,
      },
    ]);
  };

  const deleteSavedScenario = async (id) => {
    await deleteParameterSet(id);
    fetchSavedParams();
  };

  const saveScenario = async (param) => {
    const payload = {
      ...param,
      tickers: Array.isArray(param.tickers)
        ? param.tickers.map((t) => t.trim().toUpperCase())
        : param.tickers.split(',').map((t) => t.trim().toUpperCase()),
    };
    await saveParameterSet(payload);
    fetchSavedParams();
  };

  return (
    <div className="p-4 text-text">
      <h2 className="heading-xl">🎯 Run Custom Screener</h2>

      <form onSubmit={handleSubmit} className="space-y-6 mb-6">
        {paramSets.map((param, idx) => (
          <ScreenerScenarioForm
            key={idx}
            index={idx}
            param={param}
            updateScenario={updateScenario}
            removeScenario={removeScenario}
            saveScenario={saveScenario}
            canRemove={paramSets.length > 1}
          />
        ))}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addScenario}
            className="btn-secondary"
          >
            + Add Scenario
          </button>
          <button type="submit" className="btn-primary">
            Run Screener
          </button>
        </div>
      </form>

      {/* ✅ Show loader */}
      <StandardLoader show={loading} />

      {error && <p className="text-error">{error}</p>}

      <ScreenerSavedParams
        savedParams={savedParams}
        onLoad={loadSavedScenario}
        onDelete={deleteSavedScenario}
      />

      {results && Array.isArray(results) && (
        <ScreenerResultsTable results={results} />
      )}
    </div>
  );
}

export default ScreenerResults;
