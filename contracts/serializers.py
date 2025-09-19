from rest_framework import serializers
from .models import (
    OptionContract,
    ScreenerInput,
    WatchlistEntry,
    SavedScreenerParameter,
    SavedContract,
    WatchlistGroup,
    Ticker,
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
            'user': {'required': False}
        }


class SavedContractSerializer(serializers.ModelSerializer):
    # This field computes a value from the model method
    dynamic_days_to_gain = serializers.SerializerMethodField()

    class Meta:
        model = SavedContract
        fields = [
            'id', 'user', 'label', 'ticker', 'option_type', 'strike',
            'expiration', 'initial_days_to_gain', 'number_of_contracts',
            'average_cost_per_contract', 'initial_cost_per_contract',
            'underlying_price_at_add', 'current_underlying_price',
            'first_added_to_group_date', 'last_reset_date', 'last_refresh_date',
            'created_at', 'dynamic_days_to_gain',
        ]
        # ✅ UPDATED: Consolidated all read_only_fields and extra_kwargs
        read_only_fields = [
            'user', 'initial_cost_per_contract', 'underlying_price_at_add',
            'current_underlying_price', 'first_added_to_group_date',
            'last_reset_date', 'last_refresh_date', 'created_at',
            'dynamic_days_to_gain',
        ]
        # Ensures optional fields sent from the frontend aren't strictly required
        extra_kwargs = {
            'initial_days_to_gain': {'required': False, 'allow_null': True},
            'number_of_contracts': {'required': False, 'allow_null': True},
            'average_cost_per_contract': {'required': False, 'allow_null': True},
        }

    def get_dynamic_days_to_gain(self, obj):
        return obj.dynamic_days_to_gain()

    # ✅ ADDED: This new method is the key to fixing the validation error.
    def to_internal_value(self, data):
        """
        Intercepts incoming data to handle optional numeric fields sent as empty strings.
        This runs BEFORE the standard validation.
        """
        mutable_data = data.copy()

        # Convert empty strings for optional numeric fields to None
        if mutable_data.get('average_cost_per_contract') == '':
            mutable_data['average_cost_per_contract'] = None

        # The frontend sends 'days_to_gain', which maps to our model's 'initial_days_to_gain'
        if mutable_data.get('days_to_gain') == '':
            mutable_data['days_to_gain'] = None
        
        if mutable_data.get('initial_days_to_gain') == '':
             mutable_data['initial_days_to_gain'] = None

        if mutable_data.get('number_of_contracts') == '':
            mutable_data['number_of_contracts'] = None

        # Continue with the standard validation process using the cleaned data
        return super().to_internal_value(mutable_data)


class WatchlistGroupSerializer(serializers.ModelSerializer):
    # Nests the full contract details when viewing a group
    contracts = SavedContractSerializer(many=True, read_only=True)

    class Meta:
        model = WatchlistGroup
        fields = '__all__'
        extra_kwargs = {
            'user': {'required': False}
        }


class TickerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticker
        fields = ['code', 'name']