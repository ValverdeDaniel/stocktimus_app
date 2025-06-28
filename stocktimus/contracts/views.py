from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import (
    OptionContract,
    ScreenerInput,
    WatchlistEntry,
    SavedScreenerParameter
)
from .serializers import (
    OptionContractSerializer,
    ScreenerInputSerializer,
    WatchlistEntrySerializer,
    SavedScreenerParameterSerializer
)
from .utils.options_analysis import run_multiple_analyses  # ✅ updated import for screener
from .utils.watchlist_analysis import whole_watchlist       # ✅ new import for watchlist

import math  # 👈 needed for NaN/infinity checking

# --- Float Cleaning Utility ---
def clean_floats(obj):
    if isinstance(obj, dict):
        return {k: clean_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_floats(i) for i in obj]
    elif isinstance(obj, float):
        if math.isinf(obj) or math.isnan(obj):
            return None  # You can customize this to "N/A" or 0 if needed
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
    queryset = SavedScreenerParameter.objects.all()  # ✅ ensures GET works

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=None)  # ✅ explicitly set to None

class SavedScreenerParameterDeleteAPIView(generics.DestroyAPIView):
    serializer_class = SavedScreenerParameterSerializer

    def get_queryset(self):
        return SavedScreenerParameter.objects.all()

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

