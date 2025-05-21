===============================
Fundamentals Output Column Descriptions
===============================

Ticker:
    The stock symbol of the company being analyzed.

Current Price:
    The most recent live market price of the stock.

All-Time High:
    The highest adjusted closing price for the stock on record.

ATH %Chg:
    The percentage change between the current price and the all-time high.

6-Month High:
    The highest adjusted closing price within the last 180 days.

Recent-High %Chg:
    The percentage change between the current price and the 6-month high.

5-Year High:
    The highest adjusted closing price over the last five years.

Current P/E:
    The current price-to-earnings ratio, calculated using TTM (trailing twelve months) earnings.

Avg 5-Year P/E:
    The average price-to-earnings ratio over the last five years, using historical price and earnings data.

Fair Value (TTM):
    An estimated fair value of the stock based on average 5-year P/E and current TTM earnings.

Fair Value %Chg:
    The percentage difference between the current stock price and its estimated fair value.

Avg P/E × Fwd EPS:
    A forward-looking fair value estimate based on the average 5-year P/E and next year’s expected EPS.

MACD (12,26,9):
    The current MACD value based on a 12/26-period exponential moving average strategy.

MACD Signal:
    The current signal line value used to compare against MACD for trend signals.

RSI (1 yr):
    The current 14-day RSI (Relative Strength Index) value using data from the past year.

Live Price Time:
    The timestamp when the most recent live stock price was retrieved.





===============================
Options Analysis Column Descriptions
===============================

Ticker:
    The stock symbol for the underlying asset of the option contract.

Expiration:
    The date on which the option contract expires.

Strike:
    The strike price at which the option can be exercised.

% OTM/ITM:
    The percentage difference between the strike price and current stock price, 
    indicating how far the option is out-of-the-money or in-the-money.

Current Stock:
    The current market price of the underlying stock.

Simulated Stock:
    A projected future price of the stock based on the defined percentage gain.

Current Premium:
    The most recent trading price (last) of the option contract.

Simulated Premium:
    The estimated option premium calculated using the Black-Scholes model 
    with the simulated stock price.

Days Until Expiration:
    The number of days remaining until the option’s expiration date.

Days to Gain:
    The number of days in the future used to simulate potential stock price movement.

Stock Gain %:
    The percentage increase applied to simulate a potential stock price in the future.

% Gain:
    The estimated percent return if the option's premium changes from the current 
    to the simulated value.

Implied Volatility:
    The market’s expectation of future volatility expressed as an annualized percentage.

Delta:
    The option’s sensitivity to changes in the price of the underlying stock 
    (how much the option price moves per $1 move in the stock).

Theta:
    The rate at which the option loses value over time, expressed as a daily time decay.


===============================
analyze_options_unicorn() Function Parameters
===============================

tickers (list[str]):
    A list of stock symbols (e.g., ["AAPL", "MSFT"]) to analyze option contracts for.

option_type (str, default="call"):
    The type of option to analyze; accepts "call" or "put".

days_until_exp (int, default=90):
    The target number of days until expiration to filter options contracts around.

strike_pct (float, default=0.2):
    The percentage above (for calls) or below (for puts) the current stock price 
    to use when filtering strike prices.

days_to_gain (int, default=30):
    The number of days in the future to simulate potential stock price movement 
    for premium estimation.

stock_gain_pct (float, default=0.1):
    The percentage increase in stock price used to simulate a bullish scenario 
    for the option.

risk_free_rate (float, default=0.05):
    The annualized risk-free interest rate used in the Black-Scholes model 
    for premium estimation.
