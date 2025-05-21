import requests
from datetime import datetime, timedelta
import os
import sys
import time
import datetime as dt
import math
import numpy as np
import pandas as pd

def get_historical_prices(symbol, years, api_key):
    base_url = f'https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/day/'
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365 * years)
    url = f"{base_url}{start_date.strftime('%Y-%m-%d')}/{end_date.strftime('%Y-%m-%d')}?apiKey={api_key}"
    response = requests.get(url)
    if response.status_code == 200:
        result =  response.json().get('results', [])
        # Convert the list of dictionaries to a pandas DataFrame
        df = pd.DataFrame(result)
        # Add the 'ticker' column
        df['ticker'] = symbol

        # Convert the timestamp 't' from milliseconds to datetime
        df['date'] = pd.to_datetime(df['t'], unit='ms')

        # Select and rename the desired columns
        df = df[['ticker', 'date', 'c', 'v']].rename(columns={'c': 'price', 'v': 'volume'})

        # Optional: Sort the DataFrame by date
        df = df.sort_values('date').reset_index(drop=True)
        return df
    else:
        print(f"Error: {response.status_code}")
        return None