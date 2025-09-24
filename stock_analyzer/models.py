from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal


class StockFundamentals(models.Model):
    """
    Store fundamental analysis data for stocks, based on the fundamentalFunctions.ipynb notebook
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ticker = models.CharField(max_length=10, db_index=True)

    # Price data
    current_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    all_time_high = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ath_percent_change = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    six_month_high = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    recent_high_percent_change = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    five_year_high = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # P/E and valuation metrics
    current_pe = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    avg_5year_pe = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fair_value_ttm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fair_value_percent_change = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    avg_pe_fwd_eps = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Technical indicators
    macd_value = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    macd_signal = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    rsi_1year = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Metadata
    live_price_time = models.DateTimeField(null=True, blank=True)
    analysis_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'ticker', 'analysis_date']
        ordering = ['-analysis_date']

    def __str__(self):
        return f"{self.ticker} - {self.analysis_date.strftime('%Y-%m-%d %H:%M')}"


class EPSTrendData(models.Model):
    """
    Store EPS trend analysis data based on epsTrendFunctions.ipynb notebook
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ticker = models.CharField(max_length=10, db_index=True)

    # Current Quarter
    curr_qtr_current = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    curr_qtr_7days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    curr_qtr_30days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    curr_qtr_60days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    curr_qtr_90days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)

    # Next Quarter
    next_qtr_current = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    next_qtr_7days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    next_qtr_30days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    next_qtr_60days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    next_qtr_90days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)

    # Current Year
    curr_yr_current = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    curr_yr_7days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    curr_yr_30days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    curr_yr_60days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    curr_yr_90days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)

    # Next Year
    next_yr_current = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    next_yr_7days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    next_yr_30days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    next_yr_60days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    next_yr_90days = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)

    # Calculated slopes
    curr_qtr_slope = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)
    next_qtr_slope = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)
    curr_yr_slope = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)
    next_yr_slope = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)

    # Metadata
    analysis_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'ticker', 'analysis_date']
        ordering = ['-analysis_date']

    def __str__(self):
        return f"{self.ticker} EPS Trends - {self.analysis_date.strftime('%Y-%m-%d %H:%M')}"


class StockAnalysisSession(models.Model):
    """
    Store analysis sessions and parameters for historical tracking
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_name = models.CharField(max_length=100, blank=True)
    tickers = models.JSONField()  # List of ticker symbols analyzed
    analysis_types = models.JSONField()  # List of analysis types run: ['fundamentals', 'eps_trends']

    # Session metadata
    created_date = models.DateTimeField(auto_now_add=True)
    total_tickers_analyzed = models.IntegerField(default=0)
    session_duration_seconds = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-created_date']

    def __str__(self):
        name = self.session_name or f"Session {self.id}"
        return f"{name} - {len(self.tickers)} tickers - {self.created_date.strftime('%Y-%m-%d %H:%M')}"


class WatchedStock(models.Model):
    """
    User's saved stocks for quick re-analysis
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ticker = models.CharField(max_length=10)
    notes = models.TextField(blank=True)
    added_date = models.DateTimeField(auto_now_add=True)
    last_analyzed = models.DateTimeField(null=True, blank=True)

    # Analysis preferences
    auto_analyze_fundamentals = models.BooleanField(default=True)
    auto_analyze_eps_trends = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'ticker']
        ordering = ['ticker']

    def __str__(self):
        return f"{self.user.username} - {self.ticker}"
