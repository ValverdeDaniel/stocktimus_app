from rest_framework import serializers
from .models import (
    OptionContract,
    ScreenerInput,
    WatchlistEntry,
    SavedScreenerParameter,
    SavedContract,
    WatchlistGroup,
    Ticker,  # ✅ Add this import
)


class OptionContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionContract
        fields = '__all__'


class ScreenerInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScreenerInput
        fields = '__all__'


class WatchlistEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchlistEntry
        fields = '__all__'


class SavedScreenerParameterSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedScreenerParameter
        fields = '__all__'
        extra_kwargs = {
            'user': {'required': False}  # Allow saving without auth for now
        }


class SavedContractSerializer(serializers.ModelSerializer):
    dynamic_days_to_gain = serializers.SerializerMethodField()

    class Meta:
        model = SavedContract
        fields = [
            'id',
            'user',
            'label',
            'ticker',
            'option_type',
            'strike',
            'expiration',
            'initial_days_to_gain',
            'number_of_contracts',
            'average_cost_per_contract',
            'initial_cost_per_contract',
            'first_added_to_group_date',
            'last_reset_date',
            'last_refresh_date',
            'created_at',
            'dynamic_days_to_gain',
        ]
        read_only_fields = [
            'first_added_to_group_date',
            'last_reset_date',
            'last_refresh_date',
            'created_at',
            'dynamic_days_to_gain',
        ]

    def get_dynamic_days_to_gain(self, obj):
        return obj.dynamic_days_to_gain()


class WatchlistGroupSerializer(serializers.ModelSerializer):
    contracts = SavedContractSerializer(many=True, read_only=True)

    class Meta:
        model = WatchlistGroup
        fields = '__all__'


# ✅ NEW: Add TickerSerializer for dropdown search
class TickerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticker
        fields = ['code', 'name']
