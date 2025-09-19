# import requests
# import pandas as pd
# import numpy as np
# from scipy.stats import norm
# from datetime import datetime, timedelta, timezone
# import logging

# # Configure logging
# logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# API_KEY = "67ffece4b2ae08.94077168"
# BASE_URL = "https://eodhd.com/api/mp/unicornbay/options/contracts"

# # ----------------------------------------------------------------------------------------
# # Black-Scholes Option Pricing Function Parameters
# #
# # S     : float - Current price of the underlying stock (spot price)
# #         Example: If AAPL is trading at $175, then S = 175
# #
# # K     : float - Strike price of the option contract
# #         The fixed price at which the option holder can buy (call) or sell (put) the stock
# #
# # T     : float - Time to expiration in years
# #         Example: If the option expires in 30 days, then T = 30 / 365 ≈ 0.0822
# #
# # r     : float - Risk-free interest rate (annual), expressed as a decimal
# #         Example: If the rate is 5%, then r = 0.05
# #
# # sigma : float - Volatility of the underlying stock’s returns (annualized), expressed as a decimal
# #         Usually implied volatility (IV). Example: 30% volatility → sigma = 0.30
# #
# # Returns:
# #   Theoretical price of a European call or put option using the Black-Scholes model

# def black_scholes_call_price(S, K, T, r, sigma):
#     if T <= 0 or sigma <= 0:
#         return max(S - K, 0)
#     d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
#     d2 = d1 - sigma * np.sqrt(T)
#     return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

# def black_scholes_put_price(S, K, T, r, sigma):
#     if T <= 0 or sigma <= 0:
#         return max(K - S, 0)
#     d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
#     d2 = d1 - sigma * np.sqrt(T)
#     return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)

# def current_stock_price(ticker):
#     url = f"https://eodhd.com/api/real-time/{ticker}.US?api_token={API_KEY}&fmt=json"
#     try:
#         response = requests.get(url, timeout=10)
#         response.raise_for_status()
#         data = response.json()
#         return float(data.get("close", 0))
#     except Exception as e:
#         logging.warning(f"Failed to fetch current price for {ticker}: {e}")
#         return 0

# def fetch_filtered_options(symbol, exp_from, exp_to, strike_from, strike_to, option_type):
#     params = {
#         "api_token": API_KEY,
#         "filter[underlying_symbol]": symbol,
#         "filter[type]": option_type,
#         "filter[exp_date_from]": exp_from,
#         "filter[exp_date_to]": exp_to,
#         "filter[strike_from]": strike_from,
#         "filter[strike_to]": strike_to,
#         "sort": "exp_date",
#         "page[limit]": 1000
#     }

#     try:
#         response = requests.get(BASE_URL, params=params, timeout=10)
#         response.raise_for_status()
#         return response.json().get("data", [])
#     except Exception as e:
#         logging.warning(f"Error fetching options contracts for {symbol}: {e}")
#         return []

# def analyze_options_unicorn(
#     tickers,
#     option_type="call",
#     days_until_exp=90,
#     strike_pct=0.2,
#     days_to_gain=30,
#     stock_gain_pct=0.1,
#     risk_free_rate=0.05,
#     allocation=None
# ):
#     today = datetime.now(timezone.utc)
#     eval_date = today + timedelta(days=days_to_gain)
#     exp_from = (today + timedelta(days=days_until_exp - 30)).strftime("%Y-%m-%d")
#     exp_to = (today + timedelta(days=days_until_exp + 30)).strftime("%Y-%m-%d")

#     results = []

#     for ticker in tickers:
#         try:
#             current_price = current_stock_price(ticker)
#             if current_price <= 0:
#                 logging.info(f"Skipping {ticker}: invalid current price.")
#                 continue

#             target_strike = current_price * (1 + strike_pct)
#             lower = target_strike * 0.95
#             upper = target_strike * 1.05

#             options_data = fetch_filtered_options(ticker, exp_from, exp_to, lower, upper, option_type)
#             if not options_data:
#                 logging.info(f"No options data returned for {ticker}")
#                 continue

#             grouped = {}
#             for opt in options_data:
#                 attr = opt.get("attributes", {})
#                 exp = attr.get("exp_date")
#                 if exp not in grouped:
#                     grouped[exp] = []
#                 grouped[exp].append(opt)

#             filtered_options = []
#             for exp, group in grouped.items():
#                 closest = sorted(
#                     group,
#                     key=lambda x: abs(x.get("attributes", {}).get("strike", 0) - target_strike)
#                 )[:2]
#                 filtered_options.extend(closest)

#             for opt in filtered_options:
#                 attr = opt.get("attributes", {})
#                 strike = attr.get("strike")
#                 exp_date_str = attr.get("exp_date")
#                 last_price = attr.get("last", 0)
#                 last_Premium = attr.get("last", 0)
#                 iv = attr.get("volatility", 0.3)

#                 delta = attr.get("delta")
#                 theta = attr.get("theta")
#                 gamma = attr.get('gamma')
#                 vega = attr.get('vega')
#                 rho = attr.get('rho')

#                 bid = attr.get("bid")
#                 bid_date = attr.get("bid_date")
#                 ask = attr.get("ask")
#                 ask_date = attr.get("ask_date")
#                 volume = attr.get("volume")

#                 if not strike or not exp_date_str:
#                     continue

#                 if not last_price and bid is not None and ask is not None:
#                     try:
#                         last_price = (float(bid) + float(ask)) / 2
#                     except:
#                         last_price = 0

#                 exp_date = datetime.strptime(exp_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
#                 exp_days = (exp_date - today).days
#                 T_eval = max((exp_date - eval_date).days / 365, 0.0001)

#                 sim_stock = current_price * (1 + stock_gain_pct)

#                 if option_type == "call":
#                     est_value = black_scholes_call_price(sim_stock, strike, T_eval, risk_free_rate, iv)
#                     pct_otm_itm = (strike - current_price) / current_price * 100
#                 elif option_type == "put":
#                     est_value = black_scholes_put_price(sim_stock, strike, T_eval, risk_free_rate, iv)
#                     pct_otm_itm = (current_price - strike) / current_price * 100
#                 else:
#                     est_value = None
#                     pct_otm_itm = "NA"

#                 pct_gain = ((est_value - last_price) / last_price) * 100 if last_price and est_value else None
#                 alloc_value = allocation if allocation else None
#                 simulated_value = (alloc_value * (1 + pct_gain / 100)) if alloc_value and pct_gain is not None else None

#                 result = {
#                     "Ticker": ticker,
#                     "Option Type": option_type,
#                     "Expiration": exp_date_str,
#                     "Strike": strike,
#                     "% OTM/ITM": round(pct_otm_itm, 2) if isinstance(pct_otm_itm, (int, float)) else pct_otm_itm,
#                     "Underlying Price": round(current_price, 2),
#                     "Simulated Underlying": round(sim_stock, 2),
#                     "Current Premium": round(last_price, 2),
#                     "Simulated Premium": round(est_value, 2) if est_value is not None else "NA",
#                     "Days Until Expiration": exp_days,
#                     "Days to Gain": days_to_gain,
#                     "Underlying Gain %": round(stock_gain_pct * 100, 2),
#                     "Premium % Gain": round(pct_gain, 2) if pct_gain is not None else "NA",
#                     "Implied Volatility": round(iv * 100, 2),
#                     "Delta": round(delta, 4) if delta is not None else "NA",
#                     "Theta": round(theta, 4) if theta is not None else "NA",
#                     "Gamma": round(gamma, 4) if gamma is not None else "NA",
#                     "Vega": round(vega, 4) if vega is not None else "NA",
#                     "Rho": round(rho, 4) if rho is not None else "NA",
#                     "Bid": bid,
#                     "Ask": ask,
#                     "Last Premium": last_Premium,
#                     "Bid Date": bid_date,
#                     "Ask Date": ask_date,
#                     "Volume": volume
#                 }

#                 if alloc_value is not None and simulated_value is not None:
#                     result["Allocated Equity"] = round(alloc_value, 2)
#                     result["Simulated Equity"] = round(simulated_value, 2)

#                 results.append(result)

#         except Exception as e:
#             logging.error(f"Error processing {ticker}: {e}")

#     return pd.DataFrame(results)

# def run_multiple_analyses(param_sets):
#     combined_df = pd.DataFrame()

#     allowed_keys = {
#         'tickers', 'option_type', 'days_until_exp',
#         'strike_pct', 'days_to_gain', 'stock_gain_pct', 'allocation'
#     }

#     def cast_param(key, value):
#         try:
#             if key in ["strike_pct", "stock_gain_pct"]:
#                 return float(value)
#             if key in ["days_until_exp", "days_to_gain", "allocation"]:
#                 return int(float(value))  # handles strings like "32890" or "32890.0"
#             return value  # keep strings like 'hood' or 'call'
#         except Exception as e:
#             print(f"⚠️ Could not cast {key} with value {value}: {e}")
#             return value

#     for params in param_sets:
#         try:
#             clean_params = {
#                 k: cast_param(k, v)
#                 for k, v in params.items()
#                 if k in allowed_keys or k == "label"
#             }
#             label = clean_params.pop("label", "")
#             allocation = clean_params.pop("allocation", None)

#             df = analyze_options_unicorn(**clean_params, allocation=allocation)
#             df["Run Label"] = label
#             combined_df = pd.concat([combined_df, df], ignore_index=True)
#         except Exception as e:
#             print(f"❌ Error analyzing scenario '{params.get('label', 'Unknown')}': {e}")

#     return combined_df




# def highlightsTable(df):
#     cols = [
#         "Ticker",
#         "Option Type",
#         "Expiration",
#         "Strike",
#         "Current Stock",
#         "Current Premium",
#         "Stock Gain %",
#         "Premium % Gain",
#         "Implied Volatility",
#         "Bid Date",
#         "Volume"
#     ]
#     return df[cols]

# # # Example use
# # param_sets = [
# #     {
# #         "tickers": ["AAPL"],
# #         "option_type": "call",
# #         "days_until_exp": 120,
# #         "strike_pct": 0.2,
# #         "days_to_gain": 30,
# #         "stock_gain_pct": 0.1,
# #         "allocation": 100,
# #         "label": "Short-Term Conservative"
# #     },
# #     {
# #         "tickers": ["AAPL"],
# #         "option_type": "put",
# #         "days_until_exp": 120,
# #         "strike_pct": -0.2,
# #         "days_to_gain": 30,
# #         "stock_gain_pct": -0.1,
# #         "allocation": 40,
# #         "label": "Long-Term Aggressive (Put)"
# #     }
# # ]

# # combined_results = run_multiple_analyses(param_sets)
# # display(combined_results)
# # # combined_results.to_csv("optionsTests.csv", index=False)
