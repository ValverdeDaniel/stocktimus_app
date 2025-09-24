import datetime as dt
import requests
import pandas as pd
from decimal import Decimal
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# EODHD API configuration - using same as existing contracts app
API_TOKEN = settings.EODHD_API_KEY if hasattr(settings, 'EODHD_API_KEY') else "67ffece4b2ae08.94077168"
BASE_URL = "https://eodhd.com/api"
HEADERS = {"User-Agent": "Stocktimus-Fundamentals/1.0"}

class FundamentalsService:
    """
    Service class for stock fundamentals analysis, based on fundamentalFunctions.ipynb
    """

    def __init__(self):
        self.api_token = API_TOKEN
        self.base_url = BASE_URL
        self.headers = HEADERS

    def _get_json(self, url: str) -> dict:
        """Fetch JSON data from URL with error handling"""
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"API request failed for {url}: {e}")
            return {}

    def _pct_from_high(self, curr, high):
        """Calculate percentage change from high"""
        if curr is None or high in (None, 0):
            return None
        return (curr - high) / high

    def _pct_to_value(self, curr, val):
        """Calculate percentage change to value"""
        if curr in (None, 0) or val is None:
            return None
        return (val - curr) / curr

    def _strip_suffix(self, ticker: str) -> str:
        """Remove .US suffix from ticker"""
        return ticker.rsplit(".", 1)[0]

    def _annual_eps_dict(self, fund: dict) -> dict:
        """Extract annual EPS from fundamentals data"""
        try:
            annual_data = fund.get("Earnings", {}).get("Annual", {})
            return {
                int(k[:4]): rec["epsActual"]
                for k, rec in annual_data.items()
                if rec.get("epsActual") is not None
            }
        except:
            return {}

    def _sum_quarterly_eps(self, hist: list) -> dict:
        """Calculate annual EPS from quarterly data"""
        eps_q = {}
        for rec in hist:
            eps = rec.get("epsActual")
            date_str = rec.get("date") or rec.get("reportDate")
            if not date_str or eps is None:
                continue

            try:
                d = pd.to_datetime(date_str, errors="coerce")
                if pd.notna(d):
                    eps_q.setdefault(d.year, []).append(eps)
            except:
                continue

        return {y: sum(v) for y, v in eps_q.items() if len(v) == 4 and sum(v) != 0}

    def _five_year_pe_series(self, df_price: pd.DataFrame, eps_year: dict) -> list:
        """Calculate 5-year P/E series"""
        pe = []
        for y in sorted(eps_year)[-5:]:
            yr_px = df_price[df_price["date"].dt.year == y]
            if not yr_px.empty and (eps := eps_year[y]) != 0:
                pe.append(yr_px.iloc[-1]["adjusted_close"] / eps)
        return pe

    def get_current_price(self, ticker: str) -> tuple:
        """Get current stock price and timestamp"""
        url = f"{self.base_url}/real-time/{ticker}?api_token={self.api_token}&fmt=json"
        data = self._get_json(url)

        price = data.get("close") or data.get("price") or data.get("lastPrice")
        timestamp = data.get("timestamp")

        if timestamp:
            timestamp = dt.datetime.fromtimestamp(timestamp, tz=dt.timezone.utc)

        return price, timestamp

    def get_all_time_high(self, ticker: str) -> float:
        """Get all-time high for a stock"""
        today = dt.date.today().strftime("%Y-%m-%d")
        url = f"{self.base_url}/eod/{ticker}?api_token={self.api_token}&from=1900-01-01&to={today}&adjusted=1&fmt=json"

        try:
            data = self._get_json(url)
            df = pd.DataFrame(data)
            return None if df.empty else df["adjusted_close"].max()
        except:
            return None

    def get_historical_prices(self, ticker: str, start: str = None) -> pd.DataFrame:
        """Get historical price data"""
        if start is None:
            start = (dt.datetime.now() - dt.timedelta(days=730)).strftime('%Y-%m-%d')  # 2 years

        url = (
            f"{self.base_url}/eod/{ticker}?from={start}&to={dt.date.today()}"
            f"&api_token={self.api_token}&fmt=json"
        )

        try:
            data = self._get_json(url)
            df = pd.DataFrame(data)
            if df.empty:
                return df

            df['date'] = pd.to_datetime(df['date'])
            df.sort_values('date', inplace=True)
            df.set_index('date', inplace=True)
            return df
        except:
            return pd.DataFrame()

    def append_today_price(self, df: pd.DataFrame, today_price: float) -> pd.DataFrame:
        """Add today's price to historical data"""
        if df.empty or today_price is None:
            return df

        today = pd.Timestamp(dt.date.today())
        if today not in df.index:
            df.loc[today] = df.iloc[-1]  # Copy last known row
            df.loc[today, 'close'] = today_price
        return df

    def calculate_rsi_wilder(self, df: pd.DataFrame, period: int = 14) -> pd.DataFrame:
        """Calculate RSI using Wilder's method"""
        if df.empty or 'close' not in df.columns:
            return df

        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)

        avg_gain = gain.ewm(alpha=1/period, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/period, adjust=False).mean()

        rs = avg_gain / avg_loss
        df['RSI'] = 100 - (100 / (1 + rs))
        return df

    def calculate_macd(self, df: pd.DataFrame, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
        """Calculate MACD indicators"""
        if df.empty or 'close' not in df.columns:
            return df

        df['EMA_fast'] = df['close'].ewm(span=fast, adjust=False).mean()
        df['EMA_slow'] = df['close'].ewm(span=slow, adjust=False).mean()
        df['MACD'] = df['EMA_fast'] - df['EMA_slow']
        df['Signal'] = df['MACD'].ewm(span=signal, adjust=False).mean()
        df['Histogram'] = df['MACD'] - df['Signal']
        return df

    def analyze_fundamentals(self, ticker: str) -> dict:
        """
        Main analysis function - returns dict matching notebook output structure
        """
        try:
            # Ensure ticker has .US suffix for EODHD API
            api_ticker = f"{ticker}.US" if not ticker.endswith(".US") else ticker
            clean_ticker = self._strip_suffix(api_ticker)

            # Get fundamentals data
            fund_url = f"{self.base_url}/fundamentals/{api_ticker}?api_token={self.api_token}&fmt=json"
            fund = self._get_json(fund_url)

            if not fund:
                raise Exception(f"No fundamental data for {ticker}")

            # Get current and historical prices
            curr_price, price_time = self.get_current_price(api_ticker)
            if not curr_price:
                raise Exception(f"No current price for {ticker}")

            # Get all-time high and historical data
            all_time_high = self.get_all_time_high(api_ticker)

            # Get historical prices for analysis
            today_dt = dt.datetime.now()
            hist_start = (today_dt.replace(year=today_dt.year-6)).strftime('%Y-%m-%d')
            hist_url = (
                f"{self.base_url}/eod/{api_ticker}?api_token={self.api_token}"
                f"&from={hist_start}&to={today_dt.strftime('%Y-%m-%d')}&adjusted=1&fmt=json"
            )

            hist_data = self._get_json(hist_url)
            dfp = pd.DataFrame(hist_data) if hist_data else pd.DataFrame()

            if not dfp.empty:
                dfp["date"] = pd.to_datetime(dfp["date"])

            # Calculate highs
            recent_high = None
            high_5y = None
            if not dfp.empty:
                recent_high = dfp.loc[
                    dfp["date"] > pd.Timestamp(today_dt) - pd.Timedelta(days=180),
                    "adjusted_close"
                ].max(skipna=True)
                high_5y = dfp["adjusted_close"].max(skipna=True)

            # Extract fundamental metrics
            hi = fund.get("Highlights", {})
            eps_ttm = hi.get("DilutedEpsTTM")
            pe_api = hi.get("PERatio")

            # Calculate EPS and P/E metrics
            hist_raw = fund.get("Earnings", {}).get("History", {})
            earnings = list(hist_raw.values()) if isinstance(hist_raw, dict) else (hist_raw or [])
            eps_year = self._annual_eps_dict(fund) or self._sum_quarterly_eps(earnings)
            pe_series = self._five_year_pe_series(dfp, eps_year) if not dfp.empty else []
            avg_pe5y = sum(pe_series) / len(pe_series) if len(pe_series) >= 2 else None

            if pe_api is None and eps_ttm and eps_ttm != 0:
                last_px = dfp.iloc[-1]["adjusted_close"] if not dfp.empty else curr_price
                pe_api = last_px / eps_ttm

            # Calculate fair values
            eps_est = hi.get("EPSEstimateNextYear")
            fair_val = avg_pe5y * eps_ttm if avg_pe5y and eps_ttm else None
            fair_valF = avg_pe5y * eps_est if avg_pe5y and eps_est else None

            # Technical analysis
            tech_start = (today_dt.replace(year=today_dt.year - 2)).strftime('%Y-%m-%d')
            df_tech = self.get_historical_prices(api_ticker, start=tech_start)

            macd_raw = None
            macd_signal = None
            rsi_1y = None

            if not df_tech.empty:
                df_tech = self.append_today_price(df_tech, curr_price)

                # Calculate MACD
                macd_df = self.calculate_macd(df_tech)
                if not macd_df.empty and 'MACD' in macd_df.columns:
                    macd_raw = macd_df['MACD'].iloc[-1]
                    macd_signal = macd_df['Signal'].iloc[-1]

                # Calculate RSI
                rsi_df = self.calculate_rsi_wilder(df_tech)
                if not rsi_df.empty and 'RSI' in rsi_df.columns:
                    rsi_1y = rsi_df['RSI'].iloc[-1]

            # Return structured data matching the notebook output
            result = {
                "Ticker": clean_ticker,
                "Current Price": curr_price,
                "All-Time High": all_time_high,
                "ATH %Chg": self._pct_from_high(curr_price, all_time_high),
                "6-Month High": recent_high,
                "Recent-High %Chg": self._pct_from_high(curr_price, recent_high),
                "5-Year High": high_5y,
                "Current P/E": pe_api,
                "Avg 5-Year P/E": avg_pe5y,
                "Fair Value (TTM)": fair_val,
                "Fair Value %Chg": self._pct_to_value(curr_price, fair_val),
                "Avg P/E × Fwd EPS": fair_valF,
                "MACD (12,26,9)": macd_raw,
                "MACD Signal": macd_signal,
                "RSI (1 yr)": rsi_1y,
                "Live Price Time": price_time,
            }

            return result

        except Exception as e:
            logger.error(f"Fundamentals analysis failed for {ticker}: {e}")
            return {"Ticker": ticker, "Error": str(e)}

    def analyze_multiple_tickers(self, tickers: list) -> pd.DataFrame:
        """Analyze fundamentals for multiple tickers"""
        results = []
        for ticker in tickers:
            logger.info(f"Analyzing fundamentals for {ticker}")
            result = self.analyze_fundamentals(ticker)
            results.append(result)

        return pd.DataFrame(results)