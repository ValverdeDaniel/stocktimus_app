from django.urls import path
from . import views

urlpatterns = [
    # --- Existing endpoints ---
    path('options/', views.OptionContractList.as_view(), name='options-list'),
    path('screener/', views.ScreenerInputList.as_view(), name='screener-list'),
    path('watchlist/', views.WatchlistEntryList.as_view(), name='watchlist-list'),

    # 🔍 Screener execution endpoint
    path('run-screener/', views.RunScreenerAPIView.as_view(), name='run-screener'),

    # 🔍 Watchlist execution endpoint
    path('run-watchlist/', views.RunWatchlistAPIView.as_view(), name='run-watchlist'),

    # 💾 Saved parameter endpoints
    path('saved-parameters/', views.SavedScreenerParameterListCreateAPIView.as_view(), name='saved-parameters'),
    path('saved-parameters/<int:pk>/', views.SavedScreenerParameterDeleteAPIView.as_view(), name='delete-parameter'),

    # 💾 Saved contracts endpoints
    path('saved-contracts/', views.SavedContractListCreateAPIView.as_view(), name='saved-contracts'),
    path('saved-contracts/<int:pk>/', views.SavedContractDeleteAPIView.as_view(), name='delete-contract'),

    # 📂 Watchlist groups endpoints
    path('watchlist-groups/', views.WatchlistGroupListCreateAPIView.as_view(), name='watchlist-groups'),
    path('watchlist-groups/<int:pk>/', views.WatchlistGroupUpdateDeleteAPIView.as_view(), name='update-delete-group'),

    # ✅ NEW: Assign contracts to a group
    path('watchlist-groups/<int:group_id>/assign/', views.assign_contracts_to_group, name='assign-contracts-to-group'),

    # 🚀 Bulk watchlist simulation endpoint
    path('run-bulk-watchlist/', views.RunBulkWatchlistAPIView.as_view(), name='run-bulk-watchlist'),
]
