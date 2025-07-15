from django.urls import path

# ✅ Import from coreViews instead of views.py (which no longer exists)
from contracts.coreViews import (
    OptionContractList,
    ScreenerInputList,
    WatchlistEntryList,
    RunScreenerAPIView,
    RunWatchlistAPIView,
    SavedScreenerParameterListCreateAPIView,
    SavedScreenerParameterDeleteAPIView,
    SavedContractListCreateAPIView,
    SavedContractDeleteAPIView,
    reset_days_to_gain,
    refresh_contract_data,
    WatchlistGroupListCreateAPIView,
    WatchlistGroupUpdateDeleteAPIView,
    assign_contracts_to_group,
    remove_contract_from_group,  # ✅ NEW import
    RunBulkWatchlistAPIView,
    TickerSearchAPIView,
)

# ✅ Import from views/optionSearch.py
from contracts.views.optionSearch import option_chain

urlpatterns = [
    # --- Existing endpoints ---
    path('options/', OptionContractList.as_view(), name='options-list'),
    path('screener/', ScreenerInputList.as_view(), name='screener-list'),
    path('watchlist/', WatchlistEntryList.as_view(), name='watchlist-list'),

    # 🔍 Screener execution endpoint
    path('run-screener/', RunScreenerAPIView.as_view(), name='run-screener'),
    path('run-watchlist/', RunWatchlistAPIView.as_view(), name='run-watchlist'),

    # 💾 Saved parameter endpoints
    path('saved-parameters/', SavedScreenerParameterListCreateAPIView.as_view(), name='saved-parameters'),
    path('saved-parameters/<int:pk>/', SavedScreenerParameterDeleteAPIView.as_view(), name='delete-parameter'),

    # 💾 Saved contracts endpoints
    path('saved-contracts/', SavedContractListCreateAPIView.as_view(), name='saved-contracts'),
    path('saved-contracts/<int:pk>/', SavedContractDeleteAPIView.as_view(), name='delete-contract'),

    # ✅ Reset/Refresh contract support
    path('saved-contracts/<int:contract_id>/reset-days/', reset_days_to_gain, name='reset-days-to-gain'),
    path('saved-contracts/<int:contract_id>/refresh/', refresh_contract_data, name='refresh-contract-data'),

    # 📂 Watchlist groups endpoints
    path('watchlist-groups/', WatchlistGroupListCreateAPIView.as_view(), name='watchlist-groups'),
    path('watchlist-groups/<int:pk>/', WatchlistGroupUpdateDeleteAPIView.as_view(), name='update-delete-group'),
    path('watchlist-groups/<int:group_id>/assign/', assign_contracts_to_group, name='assign-contracts-to-group'),

    # ❌ Remove a contract from a specific group (not delete the contract)
    path('watchlist-groups/<int:group_id>/contracts/<int:contract_id>/', remove_contract_from_group, name='remove-contract-from-group'),

    # 🚀 Bulk watchlist simulation endpoint
    path('run-bulk-watchlist/', RunBulkWatchlistAPIView.as_view(), name='run-bulk-watchlist'),

    # 🔍 Ticker search endpoint
    path('tickers/', TickerSearchAPIView.as_view(), name='ticker-search'),

    # ✅ Polygon.io options chain fetch endpoint
    path('options-chain/', option_chain, name='fetch_option_chain'),
]
