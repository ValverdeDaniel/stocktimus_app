from rest_framework import serializers
from .models import StockFundamentals, EPSTrendData, StockAnalysisSession, WatchedStock


class StockFundamentalsSerializer(serializers.ModelSerializer):
    """Serializer for StockFundamentals model"""

    class Meta:
        model = StockFundamentals
        fields = '__all__'
        read_only_fields = ('user', 'analysis_date')


class EPSTrendDataSerializer(serializers.ModelSerializer):
    """Serializer for EPSTrendData model"""

    class Meta:
        model = EPSTrendData
        fields = '__all__'
        read_only_fields = ('user', 'analysis_date')


class StockAnalysisSessionSerializer(serializers.ModelSerializer):
    """Serializer for StockAnalysisSession model"""

    class Meta:
        model = StockAnalysisSession
        fields = '__all__'
        read_only_fields = ('user', 'created_date')


class WatchedStockSerializer(serializers.ModelSerializer):
    """Serializer for WatchedStock model"""

    class Meta:
        model = WatchedStock
        fields = '__all__'
        read_only_fields = ('user', 'added_date', 'last_analyzed')


class AnalysisRequestSerializer(serializers.Serializer):
    """Serializer for analysis requests"""
    tickers = serializers.ListField(
        child=serializers.CharField(max_length=10),
        allow_empty=False,
        help_text="List of ticker symbols to analyze"
    )
    analysis_types = serializers.ListField(
        child=serializers.ChoiceField(choices=['fundamentals', 'eps_trends']),
        default=['fundamentals'],
        allow_empty=False,
        help_text="Types of analysis to perform"
    )
    session_name = serializers.CharField(
        max_length=100,
        required=False,
        help_text="Optional name for this analysis session"
    )
    save_results = serializers.BooleanField(
        default=True,
        help_text="Whether to save analysis results to database"
    )


class FundamentalsResultSerializer(serializers.Serializer):
    """Serializer for fundamentals analysis results"""
    Ticker = serializers.CharField()
    Current_Price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, source='Current Price')
    All_Time_High = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, source='All-Time High')
    ATH_Percent_Change = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True, source='ATH %Chg')
    Six_Month_High = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, source='6-Month High')
    Recent_High_Percent_Change = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True, source='Recent-High %Chg')
    Five_Year_High = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, source='5-Year High')
    Current_PE = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True, source='Current P/E')
    Avg_5Year_PE = serializers.DecimalField(max_digits=8, decimal_places=2, allow_null=True, source='Avg 5-Year P/E')
    Fair_Value_TTM = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, source='Fair Value (TTM)')
    Fair_Value_Percent_Change = serializers.DecimalField(max_digits=6, decimal_places=2, allow_null=True, source='Fair Value %Chg')
    Avg_PE_Fwd_EPS = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True, source='Avg P/E × Fwd EPS')
    MACD = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='MACD (12,26,9)')
    MACD_Signal = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='MACD Signal')
    RSI_1Year = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True, source='RSI (1 yr)')
    Live_Price_Time = serializers.DateTimeField(allow_null=True, source='Live Price Time')
    Error = serializers.CharField(required=False)


class EPSTrendsResultSerializer(serializers.Serializer):
    """Serializer for EPS trends analysis results"""
    Ticker = serializers.CharField()

    # Current Quarter
    Curr_Qtr_Curr = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Qtr Curr')
    Curr_Qtr_7 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Qtr 7')
    Curr_Qtr_30 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Qtr 30')
    Curr_Qtr_60 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Qtr 60')
    Curr_Qtr_90 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Qtr 90')

    # Next Quarter
    Next_Qtr_Curr = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Qtr Curr')
    Next_Qtr_7 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Qtr 7')
    Next_Qtr_30 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Qtr 30')
    Next_Qtr_60 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Qtr 60')
    Next_Qtr_90 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Qtr 90')

    # Current Year
    Curr_Yr_Curr = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Yr Curr')
    Curr_Yr_7 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Yr 7')
    Curr_Yr_30 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Yr 30')
    Curr_Yr_60 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Yr 60')
    Curr_Yr_90 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Curr Yr 90')

    # Next Year
    Next_Yr_Curr = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Yr Curr')
    Next_Yr_7 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Yr 7')
    Next_Yr_30 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Yr 30')
    Next_Yr_60 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Yr 60')
    Next_Yr_90 = serializers.DecimalField(max_digits=8, decimal_places=4, allow_null=True, source='Next Yr 90')

    # Slopes
    Curr_Qtr_Slope = serializers.DecimalField(max_digits=8, decimal_places=6, allow_null=True, source='Curr Qtr Slope')
    Next_Qtr_Slope = serializers.DecimalField(max_digits=8, decimal_places=6, allow_null=True, source='Next Qtr Slope')
    Curr_Yr_Slope = serializers.DecimalField(max_digits=8, decimal_places=6, allow_null=True, source='Curr Yr Slope')
    Next_Yr_Slope = serializers.DecimalField(max_digits=8, decimal_places=6, allow_null=True, source='Next Yr Slope')

    # Chart data
    chart_data = serializers.JSONField(required=False)

    Error = serializers.CharField(required=False)


class AnalysisResponseSerializer(serializers.Serializer):
    """Serializer for analysis response"""
    session_id = serializers.IntegerField(allow_null=True)
    session_name = serializers.CharField(allow_null=True)
    tickers_requested = serializers.ListField(child=serializers.CharField())
    tickers_analyzed = serializers.ListField(child=serializers.CharField())
    analysis_types = serializers.ListField(child=serializers.CharField())

    fundamentals_results = FundamentalsResultSerializer(many=True, required=False)
    eps_trends_results = EPSTrendsResultSerializer(many=True, required=False)

    errors = serializers.ListField(child=serializers.CharField(), required=False)
    processing_time = serializers.DecimalField(max_digits=6, decimal_places=2)
    created_date = serializers.DateTimeField()


class ExportRequestSerializer(serializers.Serializer):
    """Serializer for export requests"""
    session_id = serializers.IntegerField(required=False)
    tickers = serializers.ListField(
        child=serializers.CharField(max_length=10),
        required=False
    )
    analysis_types = serializers.ListField(
        child=serializers.ChoiceField(choices=['fundamentals', 'eps_trends']),
        default=['fundamentals']
    )
    format = serializers.ChoiceField(
        choices=['csv', 'excel'],
        default='csv'
    )