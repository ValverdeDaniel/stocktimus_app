import React from 'react';
import Select from 'react-select';

function WatchlistFilterControls({ data, selectedTickers, setSelectedTickers }) {
  const tickerOptions = Array.from(
    new Set(data.map(item => item.ticker))
  ).map(ticker => ({ value: ticker, label: ticker }));

  const handleTickerChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setSelectedTickers(values);
  };

  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: '#121212',
      color: '#FFFFFF',
      borderRadius: '6px',
      borderColor: '#333',
      minHeight: '36px',
      height: '36px',
      "&:hover": { borderColor: '#1DB954' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#121212',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#1DB954' : '#121212',
      color: state.isFocused ? '#000000' : '#FFFFFF',
    }),
    input: (base) => ({ ...base, color: '#FFFFFF' }),
    singleValue: (base) => ({ ...base, color: '#FFFFFF' }),
  };

  return (
    <div className="filters flex-responsive container-wide mb-6">
      <div className="filter-select">
        <label className="filter-heading">Filter by Ticker</label>
        <Select
          isMulti
          options={tickerOptions}
          value={tickerOptions.filter(opt => selectedTickers.includes(opt.value))}
          onChange={handleTickerChange}
          placeholder="Select tickers..."
          styles={customStyles}
        />
      </div>
    </div>
  );
}

export default WatchlistFilterControls;
