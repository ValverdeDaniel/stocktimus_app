from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import OptionContract, ScreenerInput, WatchlistEntry
from .serializers import OptionContractSerializer, ScreenerInputSerializer, WatchlistEntrySerializer
from .utils import run_multiple_analyses  # 👈 your screener logic

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

# --- Custom Screener Logic Endpoint ---
class RunScreenerAPIView(APIView):
    def post(self, request):
        try:
            param_sets = request.data.get("param_sets", [])
            if not param_sets:
                return Response({"error": "No param_sets provided."}, status=status.HTTP_400_BAD_REQUEST)

            df = run_multiple_analyses(param_sets)
            return Response(df.to_dict(orient="records"), status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
