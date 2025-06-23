from rest_framework import serializers
from .models import OptionContract, ScreenerInput, WatchlistEntry

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