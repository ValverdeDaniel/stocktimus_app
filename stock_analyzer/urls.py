from django.urls import path
from . import views

urlpatterns = [
    # Main analysis endpoints
    path('analyze/', views.analyze_stocks, name='analyze_stocks'),
    path('fundamentals/', views.fundamentals_analysis, name='fundamentals_analysis'),
    path('eps-trends/', views.eps_trends_analysis, name='eps_trends_analysis'),

    # Data management
    path('history/', views.analysis_history, name='analysis_history'),
    path('watched-stocks/', views.watched_stocks, name='watched_stocks'),
    path('export/', views.export_analysis, name='export_analysis'),
]