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
from rest_framework import serializers
# ✅ ADDED: This import is required for date calculations
from datetime import datetime

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

# (Keep all your existing imports, including datetime)
# ...

class RunWatchlistAPIView(APIView):
    def post(self, request):
        try:
            contracts_input = request.data.get("contracts", [])
            if not contracts_input:
                return Response({"error": "No contracts provided."}, status=status.HTTP_400_BAD_REQUEST)

            today = datetime.now().date()

            # --- Pre-process input ---
            for contract in contracts_input:
                if not contract.get('days_to_gain'):
                    try:
                        exp_date = datetime.strptime(contract['expiration'], "%Y-%m-%d").date()
                        days_until_exp = (exp_date - today).days
                        contract['days_to_gain'] = max(1, int(days_until_exp * 0.5))
                    except (ValueError, TypeError):
                        contract['days_to_gain'] = 30

            # --- Create a lookup map for original inputs ---
            input_map = {
                (c['ticker'], c['option_type'], str(float(c['strike'])), c['expiration']): c
                for c in contracts_input
            }


            print("🚀 Incoming watchlist contracts (processed):", contracts_input)

            # --- Run simulation ---
            df = whole_watchlist(contracts_input)

            if df.empty:
                print("⚠️ Simulation returned empty DataFrame — likely no contracts matched.")
                return Response([
                    {
                        "Ticker": "N/A",
                        "Note": "Simulation returned no results. Check if contract exists on EODHD UnicornBay."
                    }
                ], status=status.HTTP_200_OK)

            results = df.to_dict(orient="records")

            # --- Post-process output using the input map ---
            processed_results = []
            for result in results:
                result_key = (
                    result.get('Ticker'),
                    result.get('Option Type'),
                    str(result.get('Strike')),
                    result.get('Expiration')
                )
                original_contract = input_map.get(result_key)

                if not original_contract:
                    print(f"❓ No matching original contract for result: {result_key}")
                    continue

                try:
                    num_contracts = int(original_contract.get('number_of_contracts') or 1)
                except (ValueError, TypeError):
                    num_contracts = 1

                cost_input_str = original_contract.get('average_cost_per_contract')
                try:
                    cost_input = float(cost_input_str) if cost_input_str else None
                except (ValueError, TypeError):
                    cost_input = None

                current_premium = result.get('current_premium', 0)
                final_cost = cost_input if cost_input is not None and cost_input > 0 else current_premium

                result['average_cost_per_contract'] = round(final_cost, 2)
                result['equity_invested'] = round(num_contracts * final_cost, 2)
                result['number_of_contracts'] = num_contracts

                processed_results.append(result)

            cleaned_data = clean_floats(processed_results)
            print(f"✅ Returning {len(cleaned_data)} simulated contract(s).")
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
        ticker = data.get("ticker")
        option_type = data.get("option_type")
        strike = data.get("strike")
        expiration = data.get("expiration")
        today = timezone.now().date()

        days_until_exp = (expiration - today).days
        initial_days_to_gain = data.get("initial_days_to_gain") or int(days_until_exp * 0.5)
        number_of_contracts = data.get("number_of_contracts", 1)
        avg_cost_input = data.get("average_cost_per_contract")

        simulation_input = [{
            "ticker": ticker,
            "option_type": option_type,
            "strike": strike,
            "expiration": expiration.isoformat(),
            "days_to_gain": initial_days_to_gain,
            "number_of_contracts": number_of_contracts,
            "average_cost_per_contract": avg_cost_input if avg_cost_input is not None else 0,
        }]

        try:
            result_df = whole_watchlist(simulation_input)
            if result_df.empty:
                raise ValueError("Watchlist simulator returned empty result")

            result = result_df.iloc[0]
            print("✅ Simulation result:", result.to_dict())

            premium = result.get("current_premium")
            if premium is None or math.isnan(premium):
                premium = 0.0

            avg_cost = avg_cost_input if avg_cost_input is not None else premium
            underlying_price = result.get("current_underlying_price", 0.0)

            serializer.save(
                user=None,
                initial_days_to_gain=initial_days_to_gain,
                number_of_contracts=number_of_contracts,
                average_cost_per_contract=avg_cost,
                initial_cost_per_contract=avg_cost,
                underlying_price_at_add=underlying_price,
                current_underlying_price=underlying_price
            )
        except Exception as e:
            raise serializers.ValidationError(f"Simulator failed: {str(e)}")

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
        simulated_premium = 4.25
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
    


# --- Remove a Contract from a Group ---
@api_view(['DELETE'])
def remove_contract_from_group(request, group_id, contract_id):
    try:
        group = WatchlistGroup.objects.get(pk=group_id)
    except WatchlistGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        contract = SavedContract.objects.get(pk=contract_id)
    except SavedContract.DoesNotExist:
        return Response({'error': 'Contract not found'}, status=status.HTTP_404_NOT_FOUND)

    group.contracts.remove(contract)
    return Response({'message': f'Contract {contract_id} removed from group {group.name}.'}, status=status.HTTP_200_OK)
