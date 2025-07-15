import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import logging
from .options_analysis import black_scholes_call_price, black_scholes_put_price, current_stock_price, API_KEY, BASE_URL

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def simulate_option_watchlist_single(ticker, option_type, strike, expiration, days_to_gain,
                                     number_of_contracts, average_cost_per_contract, risk_free_rate=0.05):
    """
    Simulates option scenarios for a single watchlist contract, using the robust logic
    proven to work in the Jupyter Notebook environment.
    """
    try:
        # --- Data Type Conversion and Default Handling (from Jupyter) ---
        try:
            strike = float(strike)
        except (TypeError, ValueError):
            return pd.DataFrame([{"Error": f"Invalid strike value: {strike}"}])

        current_price = current_stock_price(ticker)
        if current_price <= 0:
            return pd.DataFrame([{"Error": f"Could not fetch a valid stock price for {ticker}."}])

        params = {
            "api_token": API_KEY, "filter[underlying_symbol]": ticker, "filter[type]": option_type,
            "filter[exp_date_from]": expiration, "filter[exp_date_to]": expiration,
            "filter[strike_from]": strike, "filter[strike_to]": strike, "page[limit]": 1
        }
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json().get("data", [])

        if not data or "attributes" not in data[0]:
            print(f"⚠️ No exact match found for {ticker} {option_type} {strike} {expiration}. Trying fallback...")

            fallback_params = {
                "api_token": API_KEY,
                "filter[underlying_symbol]": ticker,
                "filter[type]": option_type,
                "filter[exp_date_from]": expiration,
                "filter[exp_date_to]": expiration,
                "page[limit]": 1
            }
            fallback_resp = requests.get(BASE_URL, params=fallback_params)
            fallback_data = fallback_resp.json().get("data", [])

            if fallback_data and "attributes" in fallback_data[0]:
                attr = fallback_data[0]["attributes"]
            else:
                print(f"❌ Still no match found for {ticker} — aborting.")
                return pd.DataFrame([{"Error": f"No matching or fallback contract found for {ticker}."}])
        else:
            attr = data[0]["attributes"]


        attr = data[0]["attributes"]
        last_price = float(attr.get("last", 0))
        
        iv = float(attr.get("volatility", 0.3))
        if iv <= 0:
            iv = 0.3

        exp_date = datetime.strptime(expiration, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        today = datetime.now(timezone.utc)

        # Robustly handle optional fields, applying defaults if they are empty or invalid
        try:
            days_to_gain = int(days_to_gain)
        except (TypeError, ValueError):
            dte_days = (exp_date - today).days
            days_to_gain = max(1, int(dte_days * 0.5))

        try:
            number_of_contracts = int(number_of_contracts)
        except (TypeError, ValueError):
            number_of_contracts = 1
            
        try:
            average_cost_per_contract = float(average_cost_per_contract)
            if average_cost_per_contract <= 0:
                average_cost_per_contract = last_price
        except (TypeError, ValueError):
            average_cost_per_contract = last_price

        eval_date = today + timedelta(days=days_to_gain)
        T_eval = max((exp_date - eval_date).days / 365, 0.0001)
        total_cost = average_cost_per_contract * number_of_contracts * 100

        # --- Scenario Simulation ---
        scenarios = [0.05, 0.10, 0.20, 0.50, 1.0, 2.0]
        rows = []

        for pct in scenarios:
            stock_up, stock_down = current_price * (1 + pct), current_price * (1 - pct)
            if option_type == "call":
                premium_up = black_scholes_call_price(stock_up, strike, T_eval, risk_free_rate, iv)
                premium_down = black_scholes_call_price(stock_down, strike, T_eval, risk_free_rate, iv)
            else: # put
                premium_up = black_scholes_put_price(stock_up, strike, T_eval, risk_free_rate, iv)
                premium_down = black_scholes_put_price(stock_down, strike, T_eval, risk_free_rate, iv)

            rows.append({
                "Ticker": ticker, "Current Underlying": round(current_price, 2), "Option Type": option_type,
                "Strike": strike, "Expiration": expiration, "Number of Contracts": number_of_contracts,
                "Average Cost per Contract": round(average_cost_per_contract, 2), "Equity Invested": round(total_cost, 2),
                "Current Premium": round(last_price, 2), "Days to Gain": days_to_gain,
                "Scenario % Change": f"±{int(pct * 100)}%", "Simulated Underlying (+)": round(stock_up, 2),
                "Simulated Underlying (-)": round(stock_down, 2), "Simulated Premium (+)": round(premium_up, 2),
                "Simulated Premium (-)": round(premium_down, 2),
            })

        return pd.DataFrame(rows)

    except Exception as e:
        print(f"🚨 An error occurred in simulate_option_watchlist__single for {ticker}. Reason: {e}")
        return pd.DataFrame([{"Error": str(e)}])

def whole_watchlist(contract_list):
    all_rows = []

    for contract in contract_list:
        print(f"🧪 Simulating contract: {contract}")
        df = simulate_option_watchlist_single(
            ticker=contract["ticker"],
            option_type=contract["option_type"],
            strike=contract["strike"],
            expiration=contract["expiration"],
            days_to_gain=contract.get("days_to_gain"),
            number_of_contracts=contract.get("number_of_contracts"),
            average_cost_per_contract=contract.get("average_cost_per_contract")
        )

        if df.empty:
            print(f"⚠️ Empty result for contract: {contract}")
        elif "Error" in df.columns:
            print(f"❌ Simulation error for {contract['ticker']}: {df.iloc[0]['Error']}")
        else:
            print(f"✅ Successful simulation for {contract['ticker']}")
            all_rows.append(df)

    if not all_rows:
        print("🚨 All contracts failed or returned empty. Returning empty DataFrame.")
    return pd.concat(all_rows, ignore_index=True) if all_rows else pd.DataFrame()

