import axios from 'axios';

// Create a single, configured instance of axios
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Your Django API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor (Attach Token) ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // ✅ Use 'Token', not 'Bearer', for Django's TokenAuthentication
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor (Handle 401 Unauthorized) ---
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired → log out & redirect
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Authentication Functions ---
export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login/', { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const signup = async (username, password) => {
  const response = await apiClient.post('/auth/signup/', { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

// --- Screener ---
export const getOptions = () => apiClient.get('/contracts/options/');
export const getScreener = () => apiClient.get('/contracts/screener/');
export const runScreenerBackend = (data) => apiClient.post('/contracts/run-screener/', data);

// --- Saved Screener Parameters ---
export const getSavedParameters = () => apiClient.get('/contracts/saved-parameters/');
export const saveParameterSet = (data) => apiClient.post('/contracts/saved-parameters/', data);
export const deleteParameterSet = (id) => apiClient.delete(`/contracts/saved-parameters/${id}/`);

// --- Saved Contracts ---
export const getSavedContracts = () => apiClient.get('/saved-contracts/');
export const saveContract = (data) => apiClient.post('/saved-contracts/', data);
export const deleteSavedContract = (id) => apiClient.delete(`/saved-contracts/${id}/`);
export const resetDaysToGain = (id) => apiClient.patch(`/saved-contracts/${id}/reset-days/`);
export const refreshContractData = (id) => apiClient.patch(`/saved-contracts/${id}/refresh/`);

// --- Watchlist Groups ---
export const getWatchlistGroups = () => apiClient.get('/watchlist-groups/');
export const createWatchlistGroup = (data) => apiClient.post('/watchlist-groups/', data);
export const updateWatchlistGroup = (id, data) => apiClient.put(`/watchlist-groups/${id}/`, data);
export const deleteWatchlistGroup = (id) => apiClient.delete(`/watchlist-groups/${id}/`);
export const assignContractsToGroup = (groupIds, contractIds, mode = 'append') => {
  // Bulk assign each contract to each group
  const requests = groupIds.map((groupId) =>
    apiClient.post(`/watchlist-groups/${groupId}/assign-contracts/`, {
      contract_ids: contractIds,
      mode,
    })
  );
  return Promise.all(requests);
};

// --- Bulk Watchlist Simulation ---
export const runBulkWatchlist = (data) => apiClient.post('/run-bulk-watchlist/', data);

export default apiClient;
