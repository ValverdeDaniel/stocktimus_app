from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from django.http import JsonResponse
import requests
import math

from .models import (
    OptionContract,
    ScreenerInput,
    WatchlistEntry,
    SavedScreenerParameter,
    SavedContract,
    WatchlistGroup,
    Ticker,
)

from .serializers import (
    OptionContractSerializer,
    ScreenerInputSerializer,
    WatchlistEntrySerializer,
    SavedScreenerParameterSerializer,
    SavedContractSerializer,
    WatchlistGroupSerializer,
    TickerSerializer,
)

from .utils.options_analysis import run_multiple_analyses
from .utils.watchlist_analysis import whole_watchlist


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
        serializer.save(user=None)

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


# --- Saved Contracts: Create, Delete, Reset, Refresh ---
class SavedContractListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = SavedContractSerializer

    def get_queryset(self):
        return SavedContract.objects.all()

    def perform_create(self, serializer):
        data = serializer.validated_data
        cost = data.get("average_cost_per_contract")

        if cost is None:
            cost = 4.25  # Placeholder

        serializer.save(
            user=None,
            initial_cost_per_contract=cost,
            average_cost_per_contract=cost
        )

    def post(self, request, *args, **kwargs):
        print("🚨 Incoming data for SavedContract:", request.data)
        response = super().post(request, *args, **kwargs)
        if response.status_code == 400:
            print("❗ Serializer errors:", response.data)
        return response

class SavedContractDeleteAPIView(generics.DestroyAPIView):
    queryset = SavedContract.objects.all()
    serializer_class = SavedContractSerializer

@api_view(['PATCH'])
def reset_days_to_gain(request, contract_id):
    try:
        contract = SavedContract.objects.get(id=contract_id)
        contract.last_reset_date = timezone.now()
        contract.save()
        return Response({"message": "Countdown reset successfully."})
    except SavedContract.DoesNotExist:
        return Response({"error": "Contract not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
def refresh_contract_data(request, contract_id):
    try:
        contract = SavedContract.objects.get(id=contract_id)
        simulated_premium = 4.25  # Replace with live data later
        contract.average_cost_per_contract = simulated_premium
        contract.last_refresh_date = timezone.now()
        contract.save()
        return Response({"message": "Contract refreshed successfully."})
    except SavedContract.DoesNotExist:
        return Response({"error": "Contract not found."}, status=status.HTTP_404_NOT_FOUND)


# --- Watchlist Groups CRUD ---
class WatchlistGroupListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = WatchlistGroupSerializer

    def get_queryset(self):
        return WatchlistGroup.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=None)

class WatchlistGroupUpdateDeleteAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WatchlistGroup.objects.all()
    serializer_class = WatchlistGroupSerializer


# --- Assign Contracts to Group ---
@api_view(['POST'])
def assign_contracts_to_group(request, group_id):
    contract_ids = request.data.get('contract_ids', [])
    mode = request.data.get('mode', 'append')

    if mode not in ['append', 'replace']:
        return Response({'error': 'Invalid mode'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        group = WatchlistGroup.objects.get(pk=group_id)
    except WatchlistGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    contracts = SavedContract.objects.filter(id__in=contract_ids)
    if not contracts.exists():
        return Response({'error': 'No valid contracts found.'}, status=400)

    if mode == 'replace':
        group.contracts.set(contracts)
        action = 'Replaced'
    else:
        group.contracts.add(*contracts)
        action = 'Added'

    return Response({
        'message': f'{action} {contracts.count()} contracts in group "{group.name}".',
        'mode': mode,
        'group_id': group.id,
        'assigned_contract_ids': list(contracts.values_list('id', flat=True)),
    }, status=200)


# --- Bulk Simulation Endpoint ---
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
                'days_to_gain': c.dynamic_days_to_gain(),
                'number_of_contracts': c.number_of_contracts,
                'average_cost_per_contract': c.average_cost_per_contract,
            }
            for c in contracts
        ]

        df = whole_watchlist(contracts_data)
        cleaned_data = clean_floats(df.to_dict(orient="records")) if not df.empty else []
        return Response(cleaned_data, status=200)


# --- Ticker Search ---
class TickerSearchAPIView(generics.ListAPIView):
    serializer_class = TickerSerializer

    def get_queryset(self):
        search = self.request.query_params.get('search', '').upper()
        if not search:
            return Ticker.objects.none()

        exact_matches = Ticker.objects.filter(code__iexact=search)
        partial_matches = (
            Ticker.objects.filter(code__icontains=search)
            | Ticker.objects.filter(name__icontains=search)
        ).exclude(code__iexact=search)[:10]

        return list(exact_matches) + list(partial_matches)

