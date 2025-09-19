from django.core.management.base import BaseCommand
from contracts.models import Ticker

class Command(BaseCommand):
    help = "Search tickers by code or name using icontains for a list"

    def handle(self, *args, **kwargs):
        search_terms = ["AAPL", "MSFT", "TSLA", "META", "U", "RDDT", 'AMD', 'GM', 'F']
        search_terms = [s.upper() for s in search_terms]

        for term in search_terms:
            self.stdout.write(f"\n🔎 Searching for '{term}':")

            # Exact match first
            exact_matches = Ticker.objects.filter(code__iexact=term)

            # Partial matches, excluding duplicates
            partial_matches = (
                Ticker.objects.filter(code__icontains=term)
                | Ticker.objects.filter(name__icontains=term)
            ).exclude(code__iexact=term)

            # Combine
            results = list(exact_matches) + list(partial_matches[:10])

            if results:
                for t in results:
                    self.stdout.write(f"✅ {t.code} — {t.name} | Type: {t.type}")
            else:
                self.stdout.write("❌ No match found.")
