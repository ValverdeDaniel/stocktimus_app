import React from "react";
import AsyncSelect from "react-select/async";

const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#111",
    borderColor: state.isFocused ? "#1DB954" : "#333",
    color: "#fff",
    borderRadius: "0.375rem",
    padding: "2px",
    fontSize: "0.875rem",
    boxShadow: "none",
    '&:hover': {
      borderColor: "#1DB954",
    },
  }),
  input: (base) => ({
    ...base,
    color: "#fff",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#111",
    color: "#fff",
    zIndex: 20,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#1DB95433" : "#111",
    color: state.isFocused ? "#1DB954" : "#fff",
    cursor: "pointer",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#fff",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#999",
  }),
};

const SearchableTicker = ({ onChange, value, placeholder = "Search ticker..." }) => {
  const loadOptions = async (inputValue) => {
    if (!inputValue) return [];

    const res = await fetch(`/api/tickers/?search=${inputValue}`);
    const data = await res.json();

    return data.map((item) => ({
      label: `${item.code} — ${item.name}`,
      value: item.code,
    }));
  };

  return (
    <AsyncSelect
      cacheOptions
      loadOptions={loadOptions}
      defaultOptions
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      isClearable
      styles={customStyles}
    />
  );
};

export default SearchableTicker;
