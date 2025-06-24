from rest_framework import serializers
from .models import OptionContract, ScreenerInput, WatchlistEntry, SavedScreenerParameter

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
