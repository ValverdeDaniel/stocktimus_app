from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import (
    OptionContract,
    ScreenerInput,
    WatchlistEntry,
    SavedScreenerParameter,
    SavedContract,
    WatchlistGroup,
)
from .serializers import (
    OptionContractSerializer,
    ScreenerInputSerializer,
    WatchlistEntrySerializer,
    SavedScreenerParameterSerializer,
    SavedContractSerializer,
    WatchlistGroupSerializer,
)
from .utils.options_analysis import run_multiple_analyses  # ✅ screener
from .utils.watchlist_analysis import whole_watchlist      # ✅ watchlist
import math  # 👈 needed for NaN/infinity checking

# --- Float Cleaning Utility ---
def clean_floats(obj):
    if isinstance(obj, dict):
        return {k: clean_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_floats(i) for i in obj]
    elif isinstance(obj, float):
        if math.isinf(obj) or math.isnan(obj):
            return None
        return obj
    else:
        return obj

# --- Generic Model-Based Views ---
class OptionContractList(generics.ListCreateAPIView):
    queryset = OptionContract.objects.all()
    serializer_class = OptionContractSerializer

class ScreenerInputList(generics.ListCreateAPIView):
    queryset = ScreenerInput.objects.all()
    serializer_class = ScreenerInputSerializer

class WatchlistEntryList(generics.ListCreateAPIView):
    queryset = WatchlistEntry.objects.all()
    serializer_class = WatchlistEntrySerializer

class SavedScreenerParameterListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = SavedScreenerParameterSerializer
    queryset = SavedScreenerParameter.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=None)  # ✅ no auth → set user=None

class SavedScreenerParameterDeleteAPIView(generics.DestroyAPIView):
    serializer_class = SavedScreenerParameterSerializer

    def get_queryset(self):
        return SavedScreenerParameter.objects.all()

# --- Screener & Watchlist Execution ---
class RunScreenerAPIView(APIView):
    def post(self, request):
        try:
            param_sets = request.data.get("param_sets", [])
            if not param_sets:
                return Response({"error": "No param_sets provided."}, status=status.HTTP_400_BAD_REQUEST)

            print("🚀 Incoming param_sets:", param_sets)
            df = run_multiple_analyses(param_sets)
            cleaned_data = clean_floats(df.to_dict(orient="records"))
            return Response(cleaned_data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RunWatchlistAPIView(APIView):
    def post(self, request):
        try:
            contracts = request.data.get("contracts", [])
            if not contracts:
                return Response({"error": "No contracts provided."}, status=status.HTTP_400_BAD_REQUEST)

            print("🚀 Incoming watchlist contracts:", contracts)
            df = whole_watchlist(contracts)
            cleaned_data = clean_floats(df.to_dict(orient="records")) if not df.empty else []
            return Response(cleaned_data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SavedContractListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = SavedContractSerializer

    def get_queryset(self):
        return SavedContract.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=None)

    def post(self, request, *args, **kwargs):
        print("🚨 Incoming data for SavedContract:", request.data)
        response = super().post(request, *args, **kwargs)
        if response.status_code == 400:
            print("❗ Serializer errors:", response.data)
        return response

class SavedContractDeleteAPIView(generics.DestroyAPIView):
    queryset = SavedContract.objects.all()
    serializer_class = SavedContractSerializer

# --- Watchlist Groups CRUD ---
class WatchlistGroupListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = WatchlistGroupSerializer

    def get_queryset(self):
        return WatchlistGroup.objects.all()  # ✅ global access

    def perform_create(self, serializer):
        serializer.save(user=None)  # ✅ no auth → set user=None

class WatchlistGroupUpdateDeleteAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WatchlistGroup.objects.all()
    serializer_class = WatchlistGroupSerializer

# --- Bulk Simulation for Selected Contracts ---
class RunBulkWatchlistAPIView(APIView):
    def post(self, request):
        contract_ids = request.data.get('contract_ids', [])
        contracts = SavedContract.objects.filter(id__in=contract_ids)

        if not contracts:
            return Response({'error': 'No valid contracts found.'}, status=400)

        contracts_data = [
            {
                'ticker': c.ticker,
                'option_type': c.option_type,
                'strike': c.strike,
                'expiration': c.expiration.isoformat(),
                'days_to_gain': c.days_to_gain,
                'number_of_contracts': c.number_of_contracts,
                'average_cost_per_contract': c.average_cost_per_contract,
            }
            for c in contracts
        ]

        results = run_multiple_analyses(contracts_data)
        return Response(results, status=200)
