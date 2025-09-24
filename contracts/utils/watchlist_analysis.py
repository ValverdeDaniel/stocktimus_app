import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import logging
from .options_analysis import (
    black_scholes_call_price,
    black_scholes_put_price,
    current_stock_price,
    API_KEY,
    BASE_URL,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def simulate_option_watchlist_single(
    ticker,
    option_type,
    strike,
    expiration,
    days_to_gain,
    number_of_contracts,
    average_cost_per_contract,
    risk_free_rate=0.05,
):
    """
    Simulates option scenarios for a single watchlist contract.
    Output columns match ScreenerResultsTable for consistency.
    """
    try:
        # --- Data Type Conversion and Default Handling ---
        try:
            strike = float(strike)
        except (TypeError, ValueError):
            return pd.DataFrame([{"Error": f"Invalid strike value: {strike}"}])

        current_price = current_stock_price(ticker)
        if current_price <= 0:
            return pd.DataFrame([{"Error": f"Could not fetch a valid stock price for {ticker}."}])

        params = {
            "api_token": API_KEY,
            "filter[underlying_symbol]": ticker,
            "filter[type]": option_type,
            "filter[exp_date_from]": expiration,
            "filter[exp_date_to]": expiration,
            "filter[strike_from]": strike,
            "filter[strike_to]": strike,
            "page[limit]": 1,
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
                "page[limit]": 1,
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

        # Extract pricing & Greeks
        last_price = float(attr.get("last", 0))
        iv = float(attr.get("volatility", 0.3))
        if iv <= 0:
            iv = 0.3

        bid = attr.get("bid")
        ask = attr.get("ask")
        volume = attr.get("volume")
        open_interest = attr.get("open_interest")

        delta = attr.get("delta")
        gamma = attr.get("gamma")
        theta = attr.get("theta")
        vega = attr.get("vega")
        rho = attr.get("rho")

        exp_date = datetime.strptime(expiration, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        today = datetime.now(timezone.utc)

        # --- Handle optional numeric fields ---
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
        scenarios = [0.05, 0.10, 0.20, 0.35, 0.50, 1.0, 2.0]
        rows = []

        for pct in scenarios:
            stock_up, stock_down = current_price * (1 + pct), current_price * (1 - pct)

            if option_type == "call":
                premium_up = black_scholes_call_price(stock_up, strike, T_eval, risk_free_rate, iv)
                premium_down = black_scholes_call_price(stock_down, strike, T_eval, risk_free_rate, iv)
            else:  # put
                premium_up = black_scholes_put_price(stock_up, strike, T_eval, risk_free_rate, iv)
                premium_down = black_scholes_put_price(stock_down, strike, T_eval, risk_free_rate, iv)

            # % Change calculations
            premium_up_pct_change = ((premium_up - last_price) / last_price) * 100 if last_price > 0 else 0
            premium_down_pct_change = ((premium_down - last_price) / last_price) * 100 if last_price > 0 else 0

            equity_up = premium_up * number_of_contracts * 100
            equity_down = premium_down * number_of_contracts * 100

            rows.append({
                "Ticker": ticker,
                "Option Type": option_type,
                "Strike": strike,
                "Expiration": expiration,
                "Underlying Scenario % Change": f"±{int(pct * 100)}%",
                "Current Underlying": round(current_price, 2),
                "Simulated Underlying (+)": round(stock_up, 2),
                "Simulated Underlying (-)": round(stock_down, 2),
                "Current Premium": round(last_price, 2),
                "Simulated Premium (+)": round(premium_up, 2),
                "Simulated Premium (+) % Change": round(premium_up_pct_change, 2),
                "Simulated Premium (-)": round(premium_down, 2),
                "Simulated Premium (-) % Change": round(premium_down_pct_change, 2),
                "Days to Gain": days_to_gain,
                "Number of Contracts": number_of_contracts,
                "Average Cost per Contract": round(average_cost_per_contract, 2),
                "Equity Invested": round(total_cost, 2),
                "Simulated Equity (+)": round(equity_up, 2),
                "Simulated Equity (-)": round(equity_down, 2),
                "Bid": bid,
                "Ask": ask,
                "Volume": volume,
                "Open Interest": open_interest,
                "Implied Volatility": round(iv * 100, 2),
                "Delta": round(delta, 4) if delta is not None else "NA",
                "Theta": round(theta, 4) if theta is not None else "NA",
                "Gamma": round(gamma, 4) if gamma is not None else "NA",
                "Vega": round(vega, 4) if vega is not None else "NA",
                "Rho": round(rho, 4) if rho is not None else "NA",
            })

        df = pd.DataFrame(rows)

        # Reorder columns
        column_order = [
            "Ticker", "Option Type", "Strike", "Expiration",
            "Underlying Scenario % Change", "Current Underlying",
            "Simulated Underlying (+)", "Simulated Underlying (-)",
            "Current Premium", "Simulated Premium (+)",
            "Simulated Premium (+) % Change", "Simulated Premium (-)",
            "Simulated Premium (-) % Change", "Days to Gain",
            "Number of Contracts", "Average Cost per Contract",
            "Equity Invested", "Simulated Equity (+)", "Simulated Equity (-)",
            "Bid", "Ask", "Volume", "Open Interest",
            "Implied Volatility", "Delta", "Theta", "Gamma", "Vega", "Rho"
        ]

        existing_columns_in_order = [col for col in column_order if col in df.columns]
        return df[existing_columns_in_order]

    except Exception as e:
        print(f"🚨 An error occurred in simulate_option_watchlist_single for {ticker}. Reason: {e}")
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
            average_cost_per_contract=contract.get("average_cost_per_contract"),
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
