import axios from 'axios';

// --- Global Debug Flag ---
const DEBUG_API = true; // Set to false to disable all API logs

// Create a single, configured instance of axios
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // Your Django API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor (Attach Token & Debug) ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // ✅ Use 'Token', not 'Bearer', for Django's TokenAuthentication
      config.headers.Authorization = `Token ${token}`;
    }
    if (DEBUG_API) {
      console.log(`🚀 [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data || {},
        params: config.params || {},
      });
    }
    return config;
  },
  (error) => {
    DEBUG_API && console.error('❌ [API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor (Handle 401 Unauthorized & Debug) ---
apiClient.interceptors.response.use(
  (response) => {
    if (DEBUG_API) {
      console.log(`✅ [API RESPONSE] ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    if (DEBUG_API) {
      console.error('❌ [API RESPONSE ERROR]', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
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
  DEBUG_API && console.log('🔑 [API] Login attempt:', { username });
  const response = await apiClient.post('/auth/login/', { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const signup = async (username, password) => {
  DEBUG_API && console.log('📝 [API] Signup attempt:', { username });
  const response = await apiClient.post('/auth/signup/', { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const logout = () => {
  DEBUG_API && console.log('🚪 [API] Logging out...');
  localStorage.removeItem('token');
};

// --- Screener ---
export const getOptions = () => {
  DEBUG_API && console.log('📡 [API] Fetching options...');
  return apiClient.get('/contracts/options/');
};
export const getScreener = () => apiClient.get('/contracts/screener/');
export const runScreenerBackend = (data) => {
  DEBUG_API && console.log('📡 [API] Running screener backend:', data);
  return apiClient.post('/run-screener/', data); // ✅ Correct endpoint
};

// --- Saved Screener Parameters ---
export const getSavedParameters = () => apiClient.get('/saved-parameters/'); // ✅ Correct endpoint
export const saveParameterSet = (data) => {
  DEBUG_API && console.log('💾 [API] Saving parameter set:', data);
  return apiClient.post('/saved-parameters/', data); // ✅ Correct endpoint
};
export const deleteParameterSet = (id) => {
  DEBUG_API && console.log(`🗑 [API] Deleting parameter set ID: ${id}`);
  return apiClient.delete(`/saved-parameters/${id}/`); // ✅ Correct endpoint
};

// --- Saved Contracts ---
export const getSavedContracts = () => {
  DEBUG_API && console.log('📡 [API] Fetching saved contracts...');
  return apiClient.get('/saved-contracts/');
};
export const saveContract = (data) => {
  DEBUG_API && console.log('💾 [API] Saving contract:', data);
  return apiClient.post('/saved-contracts/', data);
};
export const deleteSavedContract = (id) => {
  DEBUG_API && console.log(`🗑 [API] Deleting contract ID: ${id}`);
  return apiClient.delete(`/saved-contracts/${id}/`);
};
export const resetDaysToGain = (id) => apiClient.patch(`/saved-contracts/${id}/reset-days/`);
export const refreshContractData = (id) => apiClient.patch(`/saved-contracts/${id}/refresh/`);

// --- Watchlist Groups ---
export const getWatchlistGroups = () => {
  DEBUG_API && console.log('📡 [API] Fetching watchlist groups...');
  return apiClient.get('/watchlist-groups/');
};
export const createWatchlistGroup = (data) => {
  DEBUG_API && console.log('➕ [API] Creating watchlist group:', data);
  return apiClient.post('/watchlist-groups/', data);
};
export const updateWatchlistGroup = (id, data) => {
  DEBUG_API && console.log(`✏ [API] Updating watchlist group ID: ${id}`, data);
  return apiClient.put(`/watchlist-groups/${id}/`, data);
};
export const deleteWatchlistGroup = (id) => {
  DEBUG_API && console.log(`🗑 [API] Deleting watchlist group ID: ${id}`);
  return apiClient.delete(`/watchlist-groups/${id}/`);
};
export const assignContractsToGroup = (groupIds, contractIds, mode = 'append') => {
  DEBUG_API && console.log('🔗 [API] Assigning contracts to groups:', { groupIds, contractIds, mode });
  const requests = groupIds.map((groupId) =>
    apiClient.post(`/watchlist-groups/${groupId}/assign-contracts/`, {
      contract_ids: contractIds,
      mode,
    })
  );
  return Promise.all(requests);
};

// --- Simulate Watchlist Group ---
export const simulateGroupContracts = (groupId) => {
  DEBUG_API && console.log(`🧪 [API] Simulating group ID: ${groupId}`);
  return apiClient.post(`/watchlist-groups/${groupId}/simulate/`);
};

// --- Bulk Watchlist Simulation ---
export const runBulkWatchlist = (data) => {
  DEBUG_API && console.log('🧪 [API] Running bulk watchlist simulation:', data);
  return apiClient.post('/run-bulk-watchlist/', data);
};

export default apiClient;
