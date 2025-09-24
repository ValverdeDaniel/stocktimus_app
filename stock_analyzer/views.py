import time
import math
from decimal import Decimal
from datetime import datetime

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
import pandas as pd
import logging

from .models import StockFundamentals, EPSTrendData, StockAnalysisSession, WatchedStock
from .serializers import (
    AnalysisRequestSerializer, AnalysisResponseSerializer,
    FundamentalsResultSerializer, EPSTrendsResultSerializer,
    ExportRequestSerializer, WatchedStockSerializer
)
from .services.fundamentals_service import FundamentalsService
from .services.eps_trends_service import EPSTrendsService

logger = logging.getLogger(__name__)


def clean_nan_values(data):
    """Clean NaN and infinite values from data structure to make it JSON serializable"""
    if isinstance(data, dict):
        return {k: clean_nan_values(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_nan_values(item) for item in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    else:
        return data


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_stocks(request):
    """
    Main endpoint for stock analysis
    Supports both fundamentals and EPS trends analysis
    """
    start_time = time.time()

    # Validate request
    request_serializer = AnalysisRequestSerializer(data=request.data)
    if not request_serializer.is_valid():
        return Response({
            'error': 'Invalid request data',
            'details': request_serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    data = request_serializer.validated_data
    tickers = data['tickers']
    analysis_types = data['analysis_types']
    session_name = data.get('session_name', '')
    save_results = data.get('save_results', True)

    # Initialize results
    response_data = {
        'session_id': None,
        'session_name': session_name,
        'tickers_requested': tickers,
        'tickers_analyzed': [],
        'analysis_types': analysis_types,
        'errors': [],
        'created_date': datetime.now()
    }

    # Create analysis session
    session = None
    if save_results:
        session = StockAnalysisSession.objects.create(
            user=request.user,
            session_name=session_name,
            tickers=tickers,
            analysis_types=analysis_types,
            total_tickers_analyzed=0
        )
        response_data['session_id'] = session.id

    # Run fundamentals analysis
    if 'fundamentals' in analysis_types:
        try:
            fundamentals_service = FundamentalsService()
            fundamentals_df = fundamentals_service.analyze_multiple_tickers(tickers)

            # Convert to dict for serialization
            fundamentals_results = fundamentals_df.to_dict('records')
            # Clean NaN values for JSON serialization
            fundamentals_results = clean_nan_values(fundamentals_results)
            response_data['fundamentals_results'] = fundamentals_results

            # Save to database if requested
            if save_results:
                for result in fundamentals_results:
                    if 'Error' not in result:
                        try:
                            StockFundamentals.objects.create(
                                user=request.user,
                                ticker=result.get('Ticker'),
                                current_price=result.get('Current Price'),
                                all_time_high=result.get('All-Time High'),
                                ath_percent_change=result.get('ATH %Chg'),
                                six_month_high=result.get('6-Month High'),
                                recent_high_percent_change=result.get('Recent-High %Chg'),
                                five_year_high=result.get('5-Year High'),
                                current_pe=result.get('Current P/E'),
                                avg_5year_pe=result.get('Avg 5-Year P/E'),
                                fair_value_ttm=result.get('Fair Value (TTM)'),
                                fair_value_percent_change=result.get('Fair Value %Chg'),
                                avg_pe_fwd_eps=result.get('Avg P/E × Fwd EPS'),
                                macd_value=result.get('MACD (12,26,9)'),
                                macd_signal=result.get('MACD Signal'),
                                rsi_1year=result.get('RSI (1 yr)'),
                                live_price_time=result.get('Live Price Time')
                            )
                        except Exception as e:
                            logger.error(f"Error saving fundamentals for {result.get('Ticker')}: {e}")

        except Exception as e:
            logger.error(f"Fundamentals analysis failed: {e}")
            response_data['errors'].append(f"Fundamentals analysis failed: {str(e)}")

    # Run EPS trends analysis
    if 'eps_trends' in analysis_types:
        try:
            eps_service = EPSTrendsService()
            eps_df = eps_service.build_eps_trends(tickers)

            # Convert to dict for serialization
            eps_results = eps_df.to_dict('records')

            # Add chart data for each ticker
            for result in eps_results:
                if 'ERROR' not in result:
                    result['chart_data'] = eps_service.get_eps_trends_chart_data(result)

            # Clean NaN values for JSON serialization
            eps_results = clean_nan_values(eps_results)
            response_data['eps_trends_results'] = eps_results

            # Save to database if requested
            if save_results:
                for result in eps_results:
                    if 'ERROR' not in result:
                        try:
                            EPSTrendData.objects.create(
                                user=request.user,
                                ticker=result.get('Ticker'),
                                curr_qtr_current=result.get('Curr Qtr Curr'),
                                curr_qtr_7days=result.get('Curr Qtr 7'),
                                curr_qtr_30days=result.get('Curr Qtr 30'),
                                curr_qtr_60days=result.get('Curr Qtr 60'),
                                curr_qtr_90days=result.get('Curr Qtr 90'),
                                next_qtr_current=result.get('Next Qtr Curr'),
                                next_qtr_7days=result.get('Next Qtr 7'),
                                next_qtr_30days=result.get('Next Qtr 30'),
                                next_qtr_60days=result.get('Next Qtr 60'),
                                next_qtr_90days=result.get('Next Qtr 90'),
                                curr_yr_current=result.get('Curr Yr Curr'),
                                curr_yr_7days=result.get('Curr Yr 7'),
                                curr_yr_30days=result.get('Curr Yr 30'),
                                curr_yr_60days=result.get('Curr Yr 60'),
                                curr_yr_90days=result.get('Curr Yr 90'),
                                next_yr_current=result.get('Next Yr Curr'),
                                next_yr_7days=result.get('Next Yr 7'),
                                next_yr_30days=result.get('Next Yr 30'),
                                next_yr_60days=result.get('Next Yr 60'),
                                next_yr_90days=result.get('Next Yr 90'),
                                curr_qtr_slope=result.get('Curr Qtr Slope'),
                                next_qtr_slope=result.get('Next Qtr Slope'),
                                curr_yr_slope=result.get('Curr Yr Slope'),
                                next_yr_slope=result.get('Next Yr Slope')
                            )
                        except Exception as e:
                            logger.error(f"Error saving EPS trends for {result.get('Ticker')}: {e}")

        except Exception as e:
            logger.error(f"EPS trends analysis failed: {e}")
            response_data['errors'].append(f"EPS trends analysis failed: {str(e)}")

    # Update session with final stats
    if session:
        processing_time = time.time() - start_time
        session.session_duration_seconds = int(processing_time)
        session.total_tickers_analyzed = len([t for t in tickers if t not in response_data.get('errors', [])])
        session.save()

    response_data['processing_time'] = round(time.time() - start_time, 2)

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fundamentals_analysis(request):
    """Endpoint specifically for fundamentals analysis"""
    request.data['analysis_types'] = ['fundamentals']
    return analyze_stocks(request)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def eps_trends_analysis(request):
    """Endpoint specifically for EPS trends analysis"""
    request.data['analysis_types'] = ['eps_trends']
    return analyze_stocks(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analysis_history(request):
    """Get user's analysis history"""
    sessions = StockAnalysisSession.objects.filter(user=request.user)[:20]  # Last 20 sessions

    history = []
    for session in sessions:
        history.append({
            'id': session.id,
            'session_name': session.session_name,
            'tickers': session.tickers,
            'analysis_types': session.analysis_types,
            'total_tickers_analyzed': session.total_tickers_analyzed,
            'session_duration_seconds': session.session_duration_seconds,
            'created_date': session.created_date
        })

    return Response({
        'sessions': history,
        'total_sessions': StockAnalysisSession.objects.filter(user=request.user).count()
    })


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def watched_stocks(request):
    """Manage user's watched stocks"""
    if request.method == 'GET':
        watched = WatchedStock.objects.filter(user=request.user)
        serializer = WatchedStockSerializer(watched, many=True)
        return Response({'watched_stocks': serializer.data})

    elif request.method == 'POST':
        data = request.data.copy()
        data['user'] = request.user.id
        serializer = WatchedStockSerializer(data=data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        ticker = request.data.get('ticker')
        if not ticker:
            return Response({'error': 'Ticker required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            watched = WatchedStock.objects.get(user=request.user, ticker=ticker.upper())
            watched.delete()
            return Response({'message': f'Removed {ticker} from watched stocks'})
        except WatchedStock.DoesNotExist:
            return Response({'error': 'Ticker not in watched stocks'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_analysis(request):
    """Export analysis results to CSV or Excel"""
    request_serializer = ExportRequestSerializer(data=request.data)
    if not request_serializer.is_valid():
        return Response({
            'error': 'Invalid request data',
            'details': request_serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    data = request_serializer.validated_data
    session_id = data.get('session_id')
    tickers = data.get('tickers', [])
    analysis_types = data.get('analysis_types', ['fundamentals'])
    export_format = data.get('format', 'csv')

    try:
        # Collect data to export
        export_data = {}

        if 'fundamentals' in analysis_types:
            if session_id:
                # Get data from specific session
                session = StockAnalysisSession.objects.get(id=session_id, user=request.user)
                fundamentals = StockFundamentals.objects.filter(
                    user=request.user,
                    ticker__in=session.tickers
                ).order_by('-analysis_date')
            else:
                # Get data for specified tickers
                fundamentals = StockFundamentals.objects.filter(
                    user=request.user,
                    ticker__in=tickers
                ).order_by('-analysis_date')

            if fundamentals.exists():
                fund_data = []
                for fund in fundamentals:
                    fund_data.append({
                        'Ticker': fund.ticker,
                        'Current Price': fund.current_price,
                        'All-Time High': fund.all_time_high,
                        'ATH % Change': fund.ath_percent_change,
                        '6-Month High': fund.six_month_high,
                        'Recent High % Change': fund.recent_high_percent_change,
                        'Current P/E': fund.current_pe,
                        'Avg 5-Year P/E': fund.avg_5year_pe,
                        'Fair Value (TTM)': fund.fair_value_ttm,
                        'Fair Value % Change': fund.fair_value_percent_change,
                        'MACD': fund.macd_value,
                        'MACD Signal': fund.macd_signal,
                        'RSI (1yr)': fund.rsi_1year,
                        'Analysis Date': fund.analysis_date
                    })
                export_data['Fundamentals'] = pd.DataFrame(fund_data)

        if 'eps_trends' in analysis_types:
            if session_id:
                session = StockAnalysisSession.objects.get(id=session_id, user=request.user)
                eps_data = EPSTrendData.objects.filter(
                    user=request.user,
                    ticker__in=session.tickers
                ).order_by('-analysis_date')
            else:
                eps_data = EPSTrendData.objects.filter(
                    user=request.user,
                    ticker__in=tickers
                ).order_by('-analysis_date')

            if eps_data.exists():
                eps_rows = []
                for eps in eps_data:
                    eps_rows.append({
                        'Ticker': eps.ticker,
                        'Curr Qtr Current': eps.curr_qtr_current,
                        'Curr Qtr 7d': eps.curr_qtr_7days,
                        'Curr Qtr 30d': eps.curr_qtr_30days,
                        'Curr Qtr Slope': eps.curr_qtr_slope,
                        'Next Qtr Current': eps.next_qtr_current,
                        'Next Qtr 7d': eps.next_qtr_7days,
                        'Next Qtr 30d': eps.next_qtr_30days,
                        'Next Qtr Slope': eps.next_qtr_slope,
                        'Curr Yr Current': eps.curr_yr_current,
                        'Curr Yr Slope': eps.curr_yr_slope,
                        'Next Yr Current': eps.next_yr_current,
                        'Next Yr Slope': eps.next_yr_slope,
                        'Analysis Date': eps.analysis_date
                    })
                export_data['EPS Trends'] = pd.DataFrame(eps_rows)

        if not export_data:
            return Response({'error': 'No data found for export'}, status=status.HTTP_404_NOT_FOUND)

        # Generate export file
        filename = f"stock_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        if export_format == 'csv':
            # For CSV, combine all data into single file
            combined_df = pd.DataFrame()
            for sheet_name, df in export_data.items():
                df['Analysis_Type'] = sheet_name
                combined_df = pd.concat([combined_df, df], ignore_index=True)

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
            combined_df.to_csv(path_or_buf=response, index=False)
            return response

        else:  # Excel format
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'

            with pd.ExcelWriter(response, engine='openpyxl') as writer:
                for sheet_name, df in export_data.items():
                    df.to_excel(writer, sheet_name=sheet_name, index=False)

            return response

    except Exception as e:
        logger.error(f"Export failed: {e}")
        return Response({'error': f'Export failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
