import requests
import pandas as pd
from django.core.management.base import BaseCommand
from contracts.models import Ticker

API_KEY = "67ffece4b2ae08.94077168"
EXCHANGE = "US"
EODHD_URL = f"https://eodhd.com/api/exchange-symbol-list/{EXCHANGE}?api_token={API_KEY}&fmt=json"

class Command(BaseCommand):
    help = "Fetches tickers from EODHD and stores them in the database."

    def handle(self, *args, **kwargs):
        self.stdout.write("📡 Fetching tickers from EODHD...")
        
        try:
            response = requests.get(EODHD_URL)
            response.raise_for_status()
            data = response.json()
            df = pd.DataFrame(data)

            count_created = 0
            for _, row in df.iterrows():
                ticker, created = Ticker.objects.update_or_create(
                    code=row["Code"],
                    defaults={
                        "name": row.get("Name", ""),
                        "type": row.get("Type", ""),
                    }
                )
                if created:
                    count_created += 1

            self.stdout.write(self.style.SUCCESS(f"✅ {count_created} new tickers added or updated."))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"❌ Error: {e}"))
