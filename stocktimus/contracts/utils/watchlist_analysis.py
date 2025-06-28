import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import logging
from .options_analysis import black_scholes_call_price, black_scholes_put_price, current_stock_price, API_KEY, BASE_URL

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def simulate_option_watchlist_single(ticker, option_type, strike, expiration, days_to_gain,
                                     number_of_contracts, average_cost_per_contract, risk_free_rate=0.05):
    """
    Simulates option scenarios for a single watchlist contract.
    """
    try:
        # ✅ Convert strike to float early to avoid type errors
        strike = float(strike)
        average_cost_per_contract = float(average_cost_per_contract)  # ✅ add this line


        current_price = current_stock_price(ticker)
        if current_price <= 0:
            logging.warning(f"Invalid stock price for {ticker}")
            return pd.DataFrame()

        params = {
            "api_token": API_KEY,
            "filter[underlying_symbol]": ticker,
            "filter[type]": option_type,
            "filter[exp_date_from]": expiration,
            "filter[exp_date_to]": expiration,
            "filter[strike_from]": strike,
            "filter[strike_to]": strike,
            "page[limit]": 1
        }
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json().get("data", [])

        if not data or "attributes" not in data[0]:
            logging.warning(f"No valid contract found for {ticker} {option_type} {strike} {expiration}")
            return pd.DataFrame()

        attr = data[0]["attributes"]
        last_price = float(attr.get("last", 0))
        iv = float(attr.get("volatility", 0.3))
        if last_price <= 0:
            logging.warning(f"Missing or invalid last premium for {ticker}")
            return pd.DataFrame()

        exp_date = datetime.strptime(expiration, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        eval_date = datetime.now(timezone.utc) + timedelta(days=days_to_gain)
        T_eval = max((exp_date - eval_date).days / 365, 0.0001)
        total_cost = average_cost_per_contract * number_of_contracts * 100

        scenarios = [0.05, 0.10, 0.20, 0.50, 1.0, 2.0]
        rows = []

        for pct in scenarios:
            stock_up, stock_down = current_price * (1 + pct), current_price * (1 - pct)
            if option_type == "call":
                premium_up = black_scholes_call_price(stock_up, strike, T_eval, risk_free_rate, iv)
                premium_down = black_scholes_call_price(stock_down, strike, T_eval, risk_free_rate, iv)
            elif option_type == "put":
                premium_up = black_scholes_put_price(stock_up, strike, T_eval, risk_free_rate, iv)
                premium_down = black_scholes_put_price(stock_down, strike, T_eval, risk_free_rate, iv)
            else:
                continue

            rows.append({
                "Ticker": ticker, "Current Underlying": round(current_price, 2), "Option Type": option_type,
                "Strike": strike, "Expiration": expiration, "Number of Contracts": number_of_contracts,
                "Average Cost per Contract": average_cost_per_contract, "Equity Invested": round(total_cost, 2),
                "Current Premium": round(last_price, 2), "Days to Gain": days_to_gain,
                "Scenario % Change": f"±{int(pct * 100)}%", "Simulated Underlying (+)": round(stock_up, 2),
                "Simulated Underlying (-)": round(stock_down, 2), "Simulated Premium (+)": round(premium_up, 2),
                "Simulated Premium (-)": round(premium_down, 2),
            })

        return pd.DataFrame(rows)

    except Exception as e:
        logging.error(f"Error simulating watchlist option for {ticker}: {e}")
        return pd.DataFrame()

def whole_watchlist(contract_list):
    """
    Takes a list of watchlist contracts and simulates each, returning a combined DataFrame.
    """
    all_rows = []

    for contract in contract_list:
        df = simulate_option_watchlist_single(
            ticker=contract["ticker"], option_type=contract["option_type"], strike=contract["strike"],
            expiration=contract["expiration"], days_to_gain=contract["days_to_gain"],
            number_of_contracts=contract["number_of_contracts"], average_cost_per_contract=contract["average_cost_per_contract"]
        )
        if not df.empty:
            all_rows.append(df)

    return pd.concat(all_rows, ignore_index=True) if all_rows else pd.DataFrame()
