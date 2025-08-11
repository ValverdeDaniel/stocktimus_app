Absolutely! Here’s a **step-by-step, ready-to-paste .txt document** detailing exactly what files and functions to touch, what to update, and why.
This guide ensures your Screener page is fully working with authentication after your login implementation.

---

````
======================================================================
FIXING THE SCREENER PAGE AFTER ADDING LOGIN & AUTHENTICATION
======================================================================

Problem Summary:
----------------
After implementing login/token auth, the Screener page in your React/Django app fails to:
- Fetch saved parameter sets (401 Unauthorized)
- Run the screener (404 Not Found)
- Save/delete parameter sets (likely 401 as well)

Root Causes:
------------
1. The frontend is making some API calls (for saved parameters) using plain Axios instead of your `apiClient` (which attaches the token).
2. The endpoint URL for running the screener is incorrect (wrong path).
3. The save/delete functions for saved parameters also need to use the authenticated `apiClient`.

This guide provides **file-by-file, function-by-function** instructions.

======================================================================
1. FILE: frontend/src/pages/ScreenerResults.js
======================================================================

1.1. Update API Imports
-----------------------
**Old:**
```js
import axios from 'axios';
````

**New:**

```js
import {
  runScreenerBackend,
  getSavedParameters,
  saveParameterSet,
  deleteParameterSet
} from '../services/api';
```

*Note: You will NOT need direct Axios import after this!*

---

## 1.2. Update Fetching of Saved Parameters

**Old:**

```js
const fetchSavedParams = async () => {
  try {
    const res = await axios.get('/api/saved-parameters/');
    setSavedParams(res.data);
  } catch (err) {
    console.error('Error fetching saved parameters:', err);
  }
};
```

**New:**

```js
const fetchSavedParams = async () => {
  try {
    const res = await getSavedParameters();
    setSavedParams(res.data);
  } catch (err) {
    console.error('Error fetching saved parameters:', err);
  }
};
```

---

## 1.3. Update Deleting a Saved Parameter Set

**Old:**

```js
const deleteSavedScenario = async (id) => {
  await axios.delete(`/api/saved-parameters/${id}/`);
  fetchSavedParams();
};
```

**New:**

```js
const deleteSavedScenario = async (id) => {
  await deleteParameterSet(id);
  fetchSavedParams();
};
```

---

## 1.4. Update Saving a Parameter Set

**Old:**

```js
const saveScenario = async (param) => {
  const payload = {
    ...param,
    tickers: Array.isArray(param.tickers)
      ? param.tickers.map((t) => t.trim().toUpperCase())
      : param.tickers.split(',').map((t) => t.trim().toUpperCase()),
  };
  await axios.post('/api/saved-parameters/', payload);
  fetchSavedParams();
};
```

**New:**

```js
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
```

---

1.5. (Optional but recommended)
**Replace any other `axios` usage with the corresponding function from `api.js` for ALL API calls.**

---

\======================================================================
2\. FILE: frontend/src/services/api.js
======================================

## 2.1. Fix Screener Run Endpoint

**Find this function:**

```js
export const runScreenerBackend = (data) => {
  return apiClient.post('/contracts/run-screener/', data);
};
```

**Change it to:**

```js
export const runScreenerBackend = (data) => {
  return apiClient.post('/run-screener/', data);
};
```

* This will correctly POST to `/api/run-screener/` as expected by your Django backend.

2.2. (Double check)
All endpoint helpers (getSavedParameters, saveParameterSet, deleteParameterSet) should use `apiClient`, NOT plain axios.
If you ever add new endpoints, use `apiClient` to ensure the token is always attached.

---

\======================================================================
3\. FILE: Any React Components Calling the Screener API (Optional Check)
========================================================================

* Check that **all API calls** are using helper functions from `api.js` and not making raw `axios` or fetch calls to `/api/...` URLs.
* If you see `axios.get('/api/...')` or `axios.post('/api/...')`, REPLACE these with the properly named `api.js` function.

---

\======================================================================
4\. FILE: Django Backend (NO CHANGES NEEDED IF ALREADY WORKING)
===============================================================

* Your URLs are correct if `/api/run-screener/` and `/api/saved-parameters/` work when hit with an authenticated request.
* If you change endpoint names or add new ones, keep frontend and backend in sync.

---

\======================================================================
5\. TEST YOUR FIXES!
====================

* **Log in** and visit the Screener page.
* You should be able to:

  * See saved parameter sets (no more 401 Unauthorized).
  * Save and delete parameter sets.
  * Run the screener (no more 404 errors).
* If any requests still fail, check the browser console and Django logs for typos or missing imports.

---

## Summary:

* Always use the `apiClient` (from `api.js`) for authenticated requests.
* Use the correct endpoint URLs as defined in your Django backend.
* Update any direct Axios calls in your React code to use your API helpers.
* If you ever change a backend endpoint path, update the corresponding function in `api.js`.

```

---

Let me know if you want me to generate before/after versions of your files or have other requests!
```
