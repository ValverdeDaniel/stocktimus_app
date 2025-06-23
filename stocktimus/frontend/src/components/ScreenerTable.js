import React, { useEffect, useState } from 'react';
import { getScreener } from '../services/api';

function ScreenerTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getScreener()
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load screener data.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading screener results...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="table-container">
      <h2>📈 Screener Results</h2>
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Tickers</th>
            <th>Strike %</th>
            <th>Days Until Exp</th>
            <th>Days to Gain</th>
            <th>Stock Gain %</th>
            <th>Allocation</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, i) => (
            <tr key={i}>
              <td>{entry.label}</td>
              <td>{entry.tickers.join(', ')}</td>
              <td>{(entry.strike_pct * 100).toFixed(1)}%</td>
              <td>{entry.days_until_exp} days</td>
              <td>{entry.days_to_gain} days</td>
              <td>{(entry.stock_gain_pct * 100).toFixed(1)}%</td>
              <td>${entry.allocation.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ScreenerTable;
