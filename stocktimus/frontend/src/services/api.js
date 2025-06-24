import axios from 'axios';

const API_BASE_URL = "http://localhost:8000/api";  // adjust if different

export const getOptions = () => axios.get(`${API_BASE_URL}/options/`);
export const getScreener = () => axios.get(`${API_BASE_URL}/screener/`);
export const getWatchlist = () => axios.get(`${API_BASE_URL}/watchlist/`);

// ✅ NEW: Live Screener API Call
export const runScreenerBackend = (data) =>
  axios.post(`${API_BASE_URL}/run_screener/`, data);
