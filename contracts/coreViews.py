from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated, AllowAny  # ✅ Added AllowAny
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
    permission_classes = [IsAuthenticated]
    queryset = OptionContract.objects.all()
    serializer_class = OptionContractSerializer

class ScreenerInputList(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ScreenerInput.objects.all()
    serializer_class = ScreenerInputSerializer

class WatchlistEntryList(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = WatchlistEntry.objects.all()
    serializer_class = WatchlistEntrySerializer

class SavedScreenerParameterListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]  # ✅    
    serializer_class = SavedScreenerParameterSerializer

    def get_queryset(self):
        return SavedScreenerParameter.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # ✅

class SavedScreenerParameterDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]    
    serializer_class = SavedScreenerParameterSerializer

    def get_queryset(self):
        return SavedScreenerParameter.objects.filter(user=self.request.user)

# --- Screener & Watchlist Execution ---
class RunScreenerAPIView(APIView):
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]

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

                current_premium = result.get('Current Premium', result.get('current_premium', 0))
                final_cost = cost_input if cost_input is not None and cost_input > 0 else current_premium

                # --- Rename and standardize keys for WatchlistTable ---
                result['Average Cost per Contract'] = round(final_cost, 2)
                result['Equity Invested'] = round(num_contracts * final_cost, 2)
                result['Number of Contracts'] = num_contracts

                # Ensure all columns exist (for consistent CSV exports)
                required_columns = [
                    "Underlying Scenario % Change", "Simulated Underlying (+)", "Simulated Underlying (-)",
                    "Simulated Premium (+)", "Simulated Premium (+) % Change", "Simulated Premium (-)",
                    "Simulated Premium (-) % Change", "Days to Gain", "Simulated Equity (+)", "Simulated Equity (-)",
                    "Bid", "Ask", "Volume", "Open Interest", "Implied Volatility",
                    "Delta", "Theta", "Gamma", "Vega", "Rho"
                ]
                for col in required_columns:
                    result.setdefault(col, "NA" if col in ["Delta", "Theta", "Gamma", "Vega", "Rho"] else 0)

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
    permission_classes = [IsAuthenticated]  # ✅
    serializer_class = SavedContractSerializer

    def get_queryset(self):
        return SavedContract.objects.filter(user=self.request.user)  # ✅ Only this user’s contracts

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

            # Extract values using the correct field names from simulation
            premium = result.get("Current Premium", 0.0)
            if premium is None or (isinstance(premium, float) and math.isnan(premium)):
                premium = 0.0

            underlying_price = result.get("Current Underlying", 0.0)
            if underlying_price is None or (isinstance(underlying_price, float) and math.isnan(underlying_price)):
                underlying_price = 0.0

            avg_cost = avg_cost_input if avg_cost_input is not None else premium
            equity = number_of_contracts * avg_cost


            serializer.save(
                user=self.request.user,  # ✅ Save user
                initial_days_to_gain=initial_days_to_gain,
                number_of_contracts=number_of_contracts,
                average_cost_per_contract=avg_cost,
                initial_cost_per_contract=avg_cost,
                underlying_price_at_add=underlying_price,
                current_underlying_price=underlying_price,
                initial_premium=premium,
                current_premium=premium,
                initial_equity=equity,
                current_equity=equity
            )
        except Exception as e:
            raise serializers.ValidationError(f"Simulator failed: {str(e)}")

class SavedContractDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]  # ✅
    serializer_class = SavedContractSerializer

    def get_queryset(self):
        return SavedContract.objects.filter(user=self.request.user)  # ✅ Only delete user's contracts

@api_view(['PATCH'])
def reset_days_to_gain(request, contract_id):
    try:
        contract = SavedContract.objects.get(id=contract_id, user=request.user)
        contract.last_reset_date = timezone.now()
        contract.save()
        return Response({"message": "Countdown reset successfully."})
    except SavedContract.DoesNotExist:
        return Response({"error": "Contract not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
def refresh_contract_data(request, contract_id):
    try:
        contract = SavedContract.objects.get(id=contract_id, user=request.user)

        # Run simulation to get current values
        simulation_input = [{
            "ticker": contract.ticker,
            "option_type": contract.option_type,
            "strike": contract.strike,
            "expiration": contract.expiration.isoformat(),
            "days_to_gain": contract.dynamic_days_to_gain(),
            "number_of_contracts": contract.number_of_contracts,
            "average_cost_per_contract": contract.average_cost_per_contract,
        }]

        result_df = whole_watchlist(simulation_input)
        if not result_df.empty:
            result = result_df.iloc[0]

            # Extract current values using correct field names
            current_premium = result.get("Current Premium", 0)
            current_underlying = result.get("Current Underlying", 0)


            # Update current values
            if current_premium and not math.isnan(current_premium):
                contract.current_premium = current_premium
            if current_underlying and not math.isnan(current_underlying):
                contract.current_underlying_price = current_underlying

            # Recalculate current equity
            if contract.current_premium:
                contract.current_equity = contract.number_of_contracts * contract.current_premium

            contract.last_refresh_date = timezone.now()
            contract.save()

        return Response({"message": "Contract refreshed successfully."})
    except SavedContract.DoesNotExist:
        return Response({"error": "Contract not found."}, status=status.HTTP_404_NOT_FOUND)


# --- Watchlist Groups CRUD ---
class WatchlistGroupListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]    
    serializer_class = WatchlistGroupSerializer

    def get_queryset(self):
        return WatchlistGroup.objects.filter(user=self.request.user)  # ✅

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # ✅

class WatchlistGroupUpdateDeleteAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]    
    serializer_class = WatchlistGroupSerializer

    def get_queryset(self):
        return WatchlistGroup.objects.filter(user=self.request.user)  # ✅

# --- Assign Contracts to Group ---
@api_view(['POST'])
def assign_contracts_to_group(request, group_id):
    contract_ids = request.data.get('contract_ids', [])
    mode = request.data.get('mode', 'append')

    if mode not in ['append', 'replace']:
        return Response({'error': 'Invalid mode'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        group = WatchlistGroup.objects.get(pk=group_id, user=request.user)  # ✅ only user's group
    except WatchlistGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    contracts = SavedContract.objects.filter(id__in=contract_ids, user=request.user)  # ✅ only user's contracts
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


# --- Simulate Watchlist Group Contracts ---
class SimulateGroupContractsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        try:
            group = WatchlistGroup.objects.get(pk=group_id, user=request.user)
            contracts_qs = group.contracts.filter(user=request.user)
            if not contracts_qs.exists():
                return Response({'error': 'No contracts in this group.'}, status=400)

            # Prepare contract data for simulation
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
                for c in contracts_qs
            ]

            df = whole_watchlist(contracts_data)
            if df.empty:
                return Response([{
                    "Ticker": "N/A",
                    "Note": "Simulation returned no results. Check if contract exists on EODHD UnicornBay."
                }], status=200)

            results = df.to_dict(orient="records")
            processed_results = []

            # Create a quick lookup for contracts by key
            contract_lookup = {
                (
                    str(c.ticker).upper(),
                    str(c.option_type).lower(),
                    str(float(c.strike)),
                    str(c.expiration)
                ): c for c in contracts_qs
            }

            for result in results:
                # Try to match scenario row to a contract by ticker/type/strike/expiration
                key = (
                    str(result.get("Ticker") or result.get("ticker", "")).upper(),
                    str(result.get("Option Type") or result.get("option_type", "")).lower(),
                    str(float(result.get("Strike") or result.get("strike", 0))),
                    str(result.get("Expiration") or result.get("expiration", ""))
                )
                contract = contract_lookup.get(key)

                # Use contract fields if found, else default to row
                if contract:
                    num_contracts = int(contract.number_of_contracts or 1)
                    cost_basis = contract.average_cost_per_contract or 0

                    # Update contract's current values from simulation
                    current_premium = result.get("Current Premium", 0)
                    current_underlying = result.get("Current Underlying", 0)


                    if current_premium and not math.isnan(current_premium):
                        contract.current_premium = current_premium
                    if current_underlying and not math.isnan(current_underlying):
                        contract.current_underlying_price = current_underlying

                    # Recalculate current equity
                    if contract.current_premium:
                        contract.current_equity = num_contracts * contract.current_premium

                    contract.save()

                    # Add percent change calculations to result
                    result["Underlying % Change"] = round(contract.underlying_percent_change(), 2)
                    result["Premium % Change"] = round(contract.premium_percent_change(), 2)
                    result["Equity % Change"] = round(contract.equity_percent_change(), 2)
                    result["Days Remaining"] = contract.dynamic_days_to_gain()
                else:
                    num_contracts = int(result.get("Number of Contracts", 1))
                    cost_basis = result.get("Average Cost per Contract", result.get("Current Premium", 0)) or 0
                    current_premium = result.get("Current Premium", result.get("current_premium", 0))

                final_cost = cost_basis if cost_basis > 0 else current_premium

                # Add/overwrite computed fields for table
                result["Average Cost per Contract"] = round(final_cost, 2)
                result["Equity Invested"] = round(num_contracts * final_cost, 2)
                result["Number of Contracts"] = num_contracts

                # Ensure all expected columns are present
                required_columns = [
                    "Underlying Scenario % Change", "Simulated Underlying (+)", "Simulated Underlying (-)",
                    "Simulated Premium (+)", "Simulated Premium (+) % Change", "Simulated Premium (-)",
                    "Simulated Premium (-) % Change", "Days to Gain", "Simulated Equity (+)", "Simulated Equity (-)",
                    "Bid", "Ask", "Volume", "Open Interest", "Implied Volatility",
                    "Delta", "Theta", "Gamma", "Vega", "Rho"
                ]
                for col in required_columns:
                    result.setdefault(col, "NA" if col in ["Delta", "Theta", "Gamma", "Vega", "Rho"] else 0)

                # (Optional) Update contract record if you want, but only once per contract
                # (Could keep a set() of updated contract keys to avoid repeated .save())

                processed_results.append(result)

            return Response(clean_floats(processed_results), status=200)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)


# --- Bulk Simulation Endpoint ---
class RunBulkWatchlistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        contract_ids = request.data.get('contract_ids', [])
        contracts = SavedContract.objects.filter(id__in=contract_ids, user=request.user)

        if not contracts:
            return Response({'error': 'No valid contracts found.'}, status=400)

        # --- Prepare contracts data for simulation ---
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

        if df.empty:
            return Response([
                {
                    "Ticker": "N/A",
                    "Note": "Bulk simulation returned no results. Check if contracts exist on EODHD UnicornBay."
                }
            ], status=200)

        results = df.to_dict(orient="records")
        processed_results = []

        # --- Post-process results for consistency with WatchlistTable ---
        for result, contract in zip(results, contracts_data):
            try:
                num_contracts = int(contract.get('number_of_contracts') or 1)
            except (ValueError, TypeError):
                num_contracts = 1

            cost_input = contract.get('average_cost_per_contract') or 0
            current_premium = result.get('Current Premium', result.get('current_premium', 0))
            final_cost = cost_input if cost_input > 0 else current_premium

            result['Average Cost per Contract'] = round(final_cost, 2)
            result['Equity Invested'] = round(num_contracts * final_cost, 2)
            result['Number of Contracts'] = num_contracts

            # Ensure all expected columns are present
            required_columns = [
                "Underlying Scenario % Change", "Simulated Underlying (+)", "Simulated Underlying (-)",
                "Simulated Premium (+)", "Simulated Premium (+) % Change", "Simulated Premium (-)",
                "Simulated Premium (-) % Change", "Days to Gain", "Simulated Equity (+)", "Simulated Equity (-)",
                "Bid", "Ask", "Volume", "Open Interest", "Implied Volatility",
                "Delta", "Theta", "Gamma", "Vega", "Rho"
            ]
            for col in required_columns:
                result.setdefault(col, "NA" if col in ["Delta", "Theta", "Gamma", "Vega", "Rho"] else 0)

            processed_results.append(result)

        cleaned_data = clean_floats(processed_results)
        return Response(cleaned_data, status=200)


# --- Ticker Search ---
class TickerSearchAPIView(generics.ListAPIView):
    serializer_class = TickerSerializer
    permission_classes = [AllowAny]  # ✅ Make ticker search public (no auth required)

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
        group = WatchlistGroup.objects.get(pk=group_id, user=request.user)  # ✅
    except WatchlistGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        contract = SavedContract.objects.get(pk=contract_id, user=request.user)  # ✅
    except SavedContract.DoesNotExist:
        return Response({'error': 'Contract not found'}, status=status.HTTP_404_NOT_FOUND)

    group.contracts.remove(contract)
    return Response({'message': f'Contract {contract_id} removed from group {group.name}.'}, status=status.HTTP_200_OK)
