from django.urls import path

# Use relative imports, which is a standard Django practice
from .coreViews import (
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
    remove_contract_from_group,
    RunBulkWatchlistAPIView,
    TickerSearchAPIView,
)
from .views.optionSearch import option_chain

urlpatterns = [
    # --- Screener & Watchlist Execution ---
    path('run-screener/', RunScreenerAPIView.as_view(), name='run-screener'),
    path('run-watchlist/', RunWatchlistAPIView.as_view(), name='run-watchlist'),
    path('run-bulk-watchlist/', RunBulkWatchlistAPIView.as_view(), name='run-bulk-watchlist'),

    # --- Saved Screener Parameters ---
    path('saved-parameters/', SavedScreenerParameterListCreateAPIView.as_view(), name='saved-parameter-list'),
    path('saved-parameters/<int:pk>/', SavedScreenerParameterDeleteAPIView.as_view(), name='saved-parameter-detail'),

    # --- Saved Contracts (Portfolio) ---
    path('saved-contracts/', SavedContractListCreateAPIView.as_view(), name='saved-contract-list'),
    path('saved-contracts/<int:pk>/', SavedContractDeleteAPIView.as_view(), name='saved-contract-detail'),
    path('saved-contracts/<int:contract_id>/reset-days/', reset_days_to_gain, name='saved-contract-reset-days'),
    path('saved-contracts/<int:contract_id>/refresh/', refresh_contract_data, name='saved-contract-refresh'),

    # --- Watchlist Groups ---
    path('watchlist-groups/', WatchlistGroupListCreateAPIView.as_view(), name='watchlist-group-list'),
    path('watchlist-groups/<int:pk>/', WatchlistGroupUpdateDeleteAPIView.as_view(), name='watchlist-group-detail'),
    # ✅ Corrected path to be more descriptive and match frontend calls
    path('watchlist-groups/<int:group_id>/assign-contracts/', assign_contracts_to_group, name='assign-contracts-to-group'),
    path('watchlist-groups/<int:group_id>/contracts/<int:contract_id>/', remove_contract_from_group, name='remove-contract-from-group'),

    # --- Ticker & Option Chain Search ---
    # ✅ Corrected path from 'tickers/' to 'ticker-search/' to fix 404 error
    path('ticker-search/', TickerSearchAPIView.as_view(), name='ticker-search'),
    path('options-chain/', option_chain, name='fetch-option-chain'),
    
    # --- Deprecated/Legacy (Can be removed if not used by your app) ---
    path('options/', OptionContractList.as_view(), name='options-list'),
    path('screener/', ScreenerInputList.as_view(), name='screener-list'),
    path('watchlist/', WatchlistEntryList.as_view(), name='watchlist-list'),
]
