from django.contrib import admin
from .models import OptionContract, ScreenerInput, WatchlistEntry, Ticker

admin.site.register(OptionContract)
admin.site.register(ScreenerInput)
admin.site.register(WatchlistEntry)
admin.site.register(Ticker)