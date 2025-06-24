import axios from 'axios';

const API_BASE_URL = "http://localhost:8000/api";  // Update this if your backend runs elsewhere

// 🔁 API Calls
export const getOptions = () => axios.get(`${API_BASE_URL}/options/`);
export const getScreener = () => axios.get(`${API_BASE_URL}/screener/`);
export const getWatchlist = () => axios.get(`${API_BASE_URL}/watchlist/`);

// ✅ Corrected: Screener run endpoint (uses hyphen)
export const runScreenerBackend = (data) =>
  axios.post(`${API_BASE_URL}/run-screener/`, data);

// 💾 Saved parameters (future use with auth)
export const getSavedParameters = (token) =>
  axios.get(`${API_BASE_URL}/saved-parameters/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saveParameterSet = (data, token) =>
  axios.post(`${API_BASE_URL}/saved-parameters/`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteParameterSet = (id, token) =>
  axios.delete(`${API_BASE_URL}/saved-parameters/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
