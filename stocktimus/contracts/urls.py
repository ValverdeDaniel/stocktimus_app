from django.urls import path
from . import views

urlpatterns = [
    path('options/', views.OptionContractList.as_view(), name='options-list'),
    path('screener/', views.ScreenerInputList.as_view(), name='screener-list'),
    path('watchlist/', views.WatchlistEntryList.as_view(), name='watchlist-list'),
]
