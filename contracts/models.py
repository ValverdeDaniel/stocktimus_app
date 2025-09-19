from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class OptionContract(models.Model):
    ticker = models.CharField(max_length=10)
    option_type = models.CharField(max_length=4)  # 'call' or 'put'
    strike = models.FloatField()
    expiration = models.DateField()
    premium = models.FloatField()
    implied_volatility = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.ticker} {self.option_type.upper()} {self.strike} ({self.expiration})"


class ScreenerInput(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    label = models.CharField(max_length=100)
    tickers = models.JSONField()
    strike_pct = models.FloatField()
    days_until_exp = models.IntegerField()
    days_to_gain = models.IntegerField()
    stock_gain_pct = models.FloatField()
    allocation = models.FloatField()

    def __str__(self):
        return f"{self.label} by {self.user.username}"


class WatchlistEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ticker = models.CharField(max_length=10)
    option_type = models.CharField(max_length=4)
    strike = models.FloatField()
    expiration = models.DateField()
    days_to_gain = models.IntegerField()
    number_of_contracts = models.IntegerField()
    average_cost_per_contract = models.FloatField()

    def __str__(self):
        return f"{self.ticker} {self.option_type.upper()} {self.strike}"


class SavedScreenerParameter(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    label = models.CharField(max_length=100)
    tickers = models.JSONField()
    option_type = models.CharField(max_length=10)
    days_until_exp = models.IntegerField()
    strike_pct = models.FloatField()
    days_to_gain = models.IntegerField()
    stock_gain_pct = models.FloatField()
    allocation = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.label


class SavedContract(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    label = models.CharField(max_length=100, blank=True, default='')
    ticker = models.CharField(max_length=10)
    option_type = models.CharField(max_length=4)
    strike = models.FloatField()
    expiration = models.DateField()

    initial_days_to_gain = models.IntegerField(null=True, blank=True)
    number_of_contracts = models.IntegerField(default=1)

    average_cost_per_contract = models.FloatField(null=True, blank=True)
    initial_cost_per_contract = models.FloatField(null=True, blank=True)

    underlying_price_at_add = models.FloatField(null=True, blank=True)
    current_underlying_price = models.FloatField(null=True, blank=True)

    # Optional enhancements
    latest_simulation_result = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    first_added_to_group_date = models.DateTimeField(auto_now_add=True)
    last_reset_date = models.DateTimeField(auto_now_add=True)
    last_refresh_date = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def dynamic_days_to_gain(self):
        elapsed = (timezone.now().date() - self.last_reset_date.date()).days
        return max(0, self.initial_days_to_gain - elapsed) if self.initial_days_to_gain else 0

    def __str__(self):
        return f"{self.label or self.ticker} ({self.option_type.upper()})"


class WatchlistGroup(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    contracts = models.ManyToManyField(SavedContract, related_name="groups")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Group: {self.name}"


class Ticker(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.code} — {self.name}"
