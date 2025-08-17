# Milestone 1: Backend Logic Fixes - Implementation Guide

## 📋 Overview

This milestone addresses the core backend issues with field storage and updates for watchlist contracts. The fixes ensure that initial values, current values, and percentage changes are properly tracked and calculated.

## 🎯 Issues Fixed

### ✅ Initial Values Storage
- **Problem**: Initial underlying, equity, and premium values weren't being stored properly
- **Solution**: Added dedicated fields and logic to capture and store initial values when contracts are first created

### ✅ Current Values Updates  
- **Problem**: Current values weren't being updated during group re-runs/simulations
- **Solution**: Enhanced group simulation logic to update contracts with latest market data

### ✅ Percentage Change Calculations
- **Problem**: No percentage change tracking between initial and current values
- **Solution**: Added real-time percentage calculations for underlying, premium, and equity

### ✅ Days Remaining Logic
- **Problem**: Incomplete tracking of days until expiration and evaluation windows
- **Solution**: Added robust days calculation methods with proper expiration tracking

---

## 📁 Files Modified

### 1. `contracts/models.py`
**New Fields Added:**
- `initial_premium` - Stores premium when contract is first created
- `current_premium` - Stores latest premium from simulations  
- `initial_equity_invested` - Stores initial total equity (contracts × premium)
- `current_equity_value` - Stores current total equity value

**New Methods Added:**
- `days_until_expiration()` - Calculates days remaining until option expiration
- `underlying_percent_change()` - Calculates percentage change in underlying price
- `premium_percent_change()` - Calculates percentage change in premium
- `equity_percent_change()` - Calculates percentage change in total equity value

### 2. `contracts/serializers.py`
**Updates Made:**
- Added all new fields to `SavedContractSerializer`
- Added computed fields as `SerializerMethodField` for real-time calculations
- Updated read_only_fields to include new tracking fields
- Added serializer methods for percentage calculations with 2-decimal precision

### 3. `contracts/coreViews.py`
**Logic Enhanced:**
- **Contract Creation**: Now stores initial values (`initial_premium`, `initial_equity_invested`, etc.)
- **Group Simulation**: Updates current values (`current_premium`, `current_equity_value`, `current_underlying_price`) after each run
- **Refresh Contract**: Uses real simulation data instead of hardcoded values
- **Import**: Added `math` import for NaN checking

### 4. `contracts/migrations/0010_savedcontract_current_equity_value_and_more.py`
**Database Schema:**
- Auto-generated Django migration file
- Adds the 4 new model fields to database table
- Compatible with both PostgreSQL and SQLite

---

## 🚀 Installation Instructions

### Step 1: Backup Your Database
```bash
# For PostgreSQL
pg_dump options_db > backup_before_milestone1.sql

# For SQLite  
cp db.sqlite3 backup_before_milestone1.sqlite3
```

### Step 2: Update Files
Replace the following files in your project:
- `contracts/models.py`
- `contracts/serializers.py` 
- `contracts/coreViews.py`

### Step 3: Run Database Migration
```bash
# Navigate to your project directory
cd /path/to/your/stocktimus

# Apply the new database migration
python manage.py migrate
```

### Step 4: Restart Server
```bash
python manage.py runserver
```

---

## 🧪 Testing & Verification

### 1. Check API Response
Test that new fields are returned:
```bash
curl -X GET "http://localhost:8000/api/saved-contracts/" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

**Expected New Fields in Response:**
- `initial_premium`
- `current_premium` 
- `initial_equity_invested`
- `current_equity_value`
- `days_until_expiration`
- `underlying_percent_change`
- `premium_percent_change`  
- `equity_percent_change`

### 2. Test Contract Creation
Create a new contract and verify initial values are stored:
```bash
curl -X POST "http://localhost:8000/api/saved-contracts/" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "option_type": "Call", 
    "strike": 200,
    "expiration": "2025-12-19",
    "days_to_gain": 90,
    "number_of_contracts": 1,
    "average_cost_per_contract": 5.5
  }'
```

### 3. Test Group Simulation
Run a group simulation and verify current values are updated:
```bash
curl -X POST "http://localhost:8000/api/watchlist-groups/{GROUP_ID}/simulate/" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

After simulation, check that contracts in the group have updated `current_premium` and `current_equity_value`.

### 4. Test Individual Contract Refresh
```bash
curl -X PATCH "http://localhost:8000/api/saved-contracts/{CONTRACT_ID}/refresh/" \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

---

## 📊 New API Fields Reference

### SavedContract Model Fields

| Field Name | Type | Description | Example |
|------------|------|-------------|---------|
| `initial_premium` | Float | Premium when contract was first created | `5.25` |
| `current_premium` | Float | Latest premium from simulation | `7.80` |  
| `initial_equity_invested` | Float | Initial total investment (contracts × initial_premium) | `525.00` |
| `current_equity_value` | Float | Current total value (contracts × current_premium) | `780.00` |
| `days_until_expiration` | Int | Days remaining until option expiration | `45` |
| `underlying_percent_change` | Float | % change in underlying price | `15.25` |
| `premium_percent_change` | Float | % change in premium | `48.57` |
| `equity_percent_change` | Float | % change in total equity value | `48.57` |

---

## 🔄 Data Flow

### Contract Creation Flow
1. User creates contract via `WatchlistParamsForm`
2. Backend runs simulation to get initial premium/underlying price
3. **NEW**: Stores `initial_premium`, `initial_equity_invested` 
4. Sets current values equal to initial values
5. Contract saved with complete initial baseline

### Group Simulation Flow  
1. User clicks "Run Watchlist Simulator" for a group
2. Backend runs simulation for all contracts in group
3. **NEW**: Updates each contract's `current_premium`, `current_equity_value`, `current_underlying_price`
4. **NEW**: Real-time percentage calculations available via API
5. Frontend displays updated values and percentage changes

### Individual Contract Refresh Flow
1. User clicks refresh on individual contract
2. **NEW**: Backend runs actual simulation (not hardcoded values)
3. Updates current values based on real market data
4. Returns success/failure status

---

## 🚨 Important Notes

### Database Compatibility
- All changes are compatible with PostgreSQL and SQLite
- Migration file works with both database systems
- No raw SQL queries used

### Backward Compatibility  
- Existing API endpoints unchanged
- New fields added as optional/nullable
- No breaking changes to frontend integration

### Performance
- Percentage calculations are computed in real-time (not stored)
- Database queries optimized with proper field indexing
- Group simulations update contracts efficiently in batch

---

## 🐛 Troubleshooting

### Migration Issues
```bash
# If migration fails, try:
python manage.py showmigrations contracts
python manage.py migrate contracts 0009  # Rollback
python manage.py migrate contracts 0010  # Re-apply
```

### Field Not Appearing in API
- Ensure migration was applied: `python manage.py showmigrations`
- Restart Django server after file updates
- Check serializer includes the field in `fields` list

### Percentage Calculations Showing 0
- This is expected for new contracts (current = initial values)
- Run group simulation to populate current values
- Percentages will calculate once current values differ from initial

---

## 📞 Next Steps (Milestone 2)

The backend is now ready for frontend integration. Milestone 2 will focus on:
- Updating React components to display new fields
- Adding percentage change indicators to UI
- Real-time updates after group simulations
- Enhanced watchlist group display with current vs initial values

---

## 📋 Deliverables Summary

**Files Modified:** 3 core files + 1 migration
**New Database Fields:** 4 tracking fields  
**New Model Methods:** 4 calculation methods
**API Enhancements:** 8 new fields in SavedContract responses
**Testing:** All endpoints verified and working

**Status: ✅ Complete - Ready for Frontend Integration**