from django.urls import path
from . import views

urlpatterns = [
    path('options/', views.OptionContractList.as_view(), name='options-list'),
    path('screener/', views.ScreenerInputList.as_view(), name='screener-list'),
    path('watchlist/', views.WatchlistEntryList.as_view(), name='watchlist-list'),

    # 🔍 Screener execution endpoint
    path('run-screener/', views.RunScreenerAPIView.as_view(), name='run-screener'),

    # 💾 Saved parameter endpoints
    path('saved-parameters/', views.SavedScreenerParameterListCreateAPIView.as_view(), name='saved-parameters'),
    path('saved-parameters/<int:pk>/', views.SavedScreenerParameterDeleteAPIView.as_view(), name='delete-parameter'),
]
