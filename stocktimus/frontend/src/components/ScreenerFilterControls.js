import React from "react";
import Select from "react-select";

const ScreenerFilterControls = ({
  data,
  selectedExpirations,
  setSelectedExpirations,
  selectedTickers,
  setSelectedTickers
}) => {
  const expirationOptions = Array.from(
    new Set(data.map(row => row.Expiration))
  ).map(date => ({ value: date, label: date }));

  const tickerOptions = Array.from(
    new Set(data.map(row => row.Ticker))
  ).map(ticker => ({ value: ticker, label: ticker }));

  const handleExpirationChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setSelectedExpirations(selectedValues);
  };

  const handleTickerChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setSelectedTickers(selectedValues);
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "#121212",
      color: "#FFFFFF",
      borderRadius: "6px",
      borderColor: state.isFocused ? "#1DB954" : "#333",
      boxShadow: state.isFocused ? "0 0 0 1px #1DB954" : "none",
      minHeight: '36px',
      height: '36px',
      "&:hover": {
        borderColor: "#1DB954"
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#121212",
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#1DB954" : "#121212",
      color: state.isFocused ? "#000000" : "#FFFFFF",
      cursor: "pointer"
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#1DB954",
      borderRadius: "4px"
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#000000",
      fontWeight: 600
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#000000",
      ":hover": {
        backgroundColor: "#ff4d4d",
        color: "#fff"
      }
    }),
    input: (base) => ({
      ...base,
      color: "#FFFFFF"
    }),
    placeholder: (base) => ({
      ...base,
      color: "#AAAAAA"
    }),
    singleValue: (base) => ({
      ...base,
      color: "#FFFFFF"
    })
  };

  return (
    <div className="my-4 w-full max-w-6xl z-[100] relative flex flex-col md:flex-row gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-white mb-1">Filter by Expiration</label>
        <Select
          isMulti
          options={expirationOptions}
          value={expirationOptions.filter(opt => selectedExpirations.includes(opt.value))}
          onChange={handleExpirationChange}
          placeholder="Select expiration dates..."
          menuPortalTarget={document.body}
          styles={customStyles}
        />
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-white mb-1">Filter by Ticker</label>
        <Select
          isMulti
          options={tickerOptions}
          value={tickerOptions.filter(opt => selectedTickers.includes(opt.value))}
          onChange={handleTickerChange}
          placeholder="Select ticker symbols..."
          menuPortalTarget={document.body}
          styles={customStyles}
        />
      </div>
    </div>
  );
};

export default ScreenerFilterControls;
