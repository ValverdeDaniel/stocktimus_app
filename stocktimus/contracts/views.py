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

class SavedScreenerParameterListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = SavedScreenerParameterSerializer
    queryset = SavedScreenerParameter.objects.all()  # ✅ makes sure GET works

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save(user=None)  # ✅ explicitly set to None


class SavedScreenerParameterDeleteAPIView(generics.DestroyAPIView):
    serializer_class = SavedScreenerParameterSerializer
    # permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedScreenerParameter.objects.all()  # 👈 same here

class RunScreenerAPIView(APIView):
    def post(self, request):
        try:
            param_sets = request.data.get("param_sets", [])
            if not param_sets:
                return Response({"error": "No param_sets provided."}, status=status.HTTP_400_BAD_REQUEST)

            print("🚀 Incoming param_sets:", param_sets)  # 👈 Add this for debugging

            df = run_multiple_analyses(param_sets)

            return Response(df.to_dict(orient="records"), status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()  # 👈 Print full traceback in terminal
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
