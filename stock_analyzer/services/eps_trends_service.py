import time
import requests
import pandas as pd
from scipy.stats import linregress
from django.conf import settings
import logging
import numpy as np

logger = logging.getLogger(__name__)

# EODHD API configuration
API_TOKEN = settings.EODHD_API_KEY if hasattr(settings, 'EODHD_API_KEY') else "67ffece4b2ae08.94077168"
BASE_URL = "https://eodhd.com/api"
HEADERS = {"User-Agent": "Stocktimus-EPS-Trends/1.0"}
PAUSE_SEC = 1.1  # Rate limiting between requests

class EPSTrendsService:
    """
    Service class for EPS trends analysis, based on epsTrendFunctions.ipynb
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

    def _pull_trend(self, ticker: str) -> dict:
        """Pull EPS trend data for a ticker"""
        url = (
            f"{self.base_url}/fundamentals/{ticker}"
            f"?filter=Earnings::Trend"
            f"&api_token={self.api_token}&fmt=json"
        )

        data = self._get_json(url)

        if "Earnings" in data:
            return data.get("Earnings", {}).get("Trend", {})
        return data

    def _latest_snapshots(self, trend: dict) -> dict:
        """Get the latest snapshots for each period"""
        latest = {}
        for date_str, rec in trend.items():
            p = rec.get("period")
            if not p:
                continue

            try:
                ts = pd.to_datetime(date_str, errors="coerce")
                if p not in latest or ts > latest[p]["_ts"]:
                    rec["_ts"] = ts
                    latest[p] = rec
            except:
                continue

        return latest

    def _row_for(self, ticker: str) -> dict:
        """Generate EPS trends row for a single ticker"""
        trend = self._pull_trend(ticker)
        if not trend:
            return {"Ticker": ticker.split('.', 1)[0], "ERROR": "no Trend"}

        snap = self._latest_snapshots(trend)

        periods = {
            "Curr Qtr": "0q",
            "Next Qtr": "+1q",
            "Curr Yr":  "0y",
            "Next Yr":  "+1y",
        }

        def val(rec, fld):
            """Extract and convert field value"""
            if not rec or rec.get(fld) in (None, ""):
                return None
            try:
                return float(rec.get(fld))
            except (ValueError, TypeError):
                return None

        row = {"Ticker": ticker.split('.', 1)[0]}

        # Extract all EPS trend data
        for label, code in periods.items():
            rec = snap.get(code, {})
            row[f"{label} Curr"] = val(rec, "epsTrendCurrent")
            row[f"{label} 7"] = val(rec, "epsTrend7daysAgo")
            row[f"{label} 30"] = val(rec, "epsTrend30daysAgo")
            row[f"{label} 60"] = val(rec, "epsTrend60daysAgo")
            row[f"{label} 90"] = val(rec, "epsTrend90daysAgo")

        return row

    def calculate_slope(self, row: dict, period: str) -> float:
        """
        Calculate the slope of EPS trend over time for a given period
        Based on the calc_slope function from the notebook
        """
        y = [
            row.get(f"{period} 90"),
            row.get(f"{period} 60"),
            row.get(f"{period} 30"),
            row.get(f"{period} 7"),
            row.get(f"{period} Curr")
        ]
        x = [90, 60, 30, 7, 0]

        # Filter out None values
        valid_pairs = [(xi, yi) for xi, yi in zip(x, y) if yi is not None]

        if len(valid_pairs) < 2:  # Need at least 2 points for slope
            return None

        x_vals, y_vals = zip(*valid_pairs)

        try:
            slope, _, _, _, _ = linregress(x_vals, y_vals)
            # Check if slope is NaN or infinite
            if np.isnan(slope) or np.isinf(slope):
                return None
            return float(slope)
        except:
            return None

    def build_eps_trends(self, tickers: list) -> pd.DataFrame:
        """
        Build EPS trends analysis for multiple tickers
        Based on the build_eps_trends function from the notebook
        """
        rows = []

        for tk in tickers:
            logger.info(f"Processing EPS trends for {tk}")

            try:
                # Ensure ticker has .US suffix for EODHD API
                api_ticker = f"{tk}.US" if not tk.endswith(".US") else tk

                row = self._row_for(api_ticker)

                # Calculate slopes for each period
                periods = ["Curr Qtr", "Next Qtr", "Curr Yr", "Next Yr"]
                for period in periods:
                    slope = self.calculate_slope(row, period)
                    row[f"{period} Slope"] = slope

                rows.append(row)
                logger.info(f"Successfully processed {tk}")

            except Exception as e:
                logger.error(f"Error processing {tk}: {e}")
                rows.append({
                    "Ticker": tk.split('.', 1)[0] if '.' in tk else tk,
                    "ERROR": str(e)
                })

            # Rate limiting
            time.sleep(PAUSE_SEC)

        return pd.DataFrame(rows)

    def create_slope_heatmap_data(self, df: pd.DataFrame) -> dict:
        """
        Prepare data for slope heatmap visualization
        Based on the create_slope_heatmap function from the notebook
        """
        periods = ["Curr Qtr", "Next Qtr", "Curr Yr", "Next Yr"]

        # Calculate slopes if not already present
        for period in periods:
            if f"{period} Slope" not in df.columns:
                df[f"{period} Slope"] = df.apply(lambda r: self.calculate_slope(r, period), axis=1)

        # Prepare heatmap data structure
        slope_columns = [f"{p} Slope" for p in periods]
        heatmap_data = df.set_index("Ticker")[slope_columns].T

        # Convert to format suitable for frontend visualization
        result = {
            "periods": periods,
            "tickers": list(df["Ticker"]),
            "data": []
        }

        for period_idx, period in enumerate(periods):
            period_data = []
            for ticker in result["tickers"]:
                slope_val = heatmap_data.loc[f"{period} Slope", ticker] if ticker in heatmap_data.columns else None
                period_data.append({
                    "period": period,
                    "ticker": ticker,
                    "slope": slope_val,
                    "value": float(slope_val) if slope_val is not None and not np.isnan(slope_val) else None
                })
            result["data"].append(period_data)

        return result

    def get_eps_trends_chart_data(self, row: dict) -> dict:
        """
        Prepare EPS trends data for chart visualization
        Based on the plot_stock_eps_trends_plotly function from the notebook
        """
        time_points = [90, 60, 30, 7, 0]

        # Quarterly data
        quarterly_data = []
        for period in ["Curr Qtr", "Next Qtr"]:
            eps_values = [
                row.get(f"{period} 90"),
                row.get(f"{period} 60"),
                row.get(f"{period} 30"),
                row.get(f"{period} 7"),
                row.get(f"{period} Curr")
            ]
            quarterly_data.append({
                "name": period,
                "data": [{"x": x, "y": y} for x, y in zip(time_points, eps_values) if y is not None]
            })

        # Yearly data
        yearly_data = []
        for period in ["Curr Yr", "Next Yr"]:
            eps_values = [
                row.get(f"{period} 90"),
                row.get(f"{period} 60"),
                row.get(f"{period} 30"),
                row.get(f"{period} 7"),
                row.get(f"{period} Curr")
            ]
            yearly_data.append({
                "name": period,
                "data": [{"x": x, "y": y} for x, y in zip(time_points, eps_values) if y is not None]
            })

        return {
            "ticker": row.get("Ticker", ""),
            "quarterly": quarterly_data,
            "yearly": yearly_data
        }

    def analyze_single_ticker(self, ticker: str) -> dict:
        """Analyze EPS trends for a single ticker and return structured data"""
        try:
            api_ticker = f"{ticker}.US" if not ticker.endswith(".US") else ticker
            row = self._row_for(api_ticker)

            # Calculate slopes
            periods = ["Curr Qtr", "Next Qtr", "Curr Yr", "Next Yr"]
            for period in periods:
                slope = self.calculate_slope(row, period)
                row[f"{period} Slope"] = slope

            # Add chart data
            row["chart_data"] = self.get_eps_trends_chart_data(row)

            return row

        except Exception as e:
            logger.error(f"EPS trends analysis failed for {ticker}: {e}")
            return {"Ticker": ticker, "Error": str(e)}