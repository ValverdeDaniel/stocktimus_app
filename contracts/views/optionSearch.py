import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

POLYGON_API_KEY = "NFtDR0vf_a82vRcKZwLtagApGCNJpm4X"

@api_view(['GET'])
def option_chain(request):
    ticker = request.GET.get('ticker', '').upper()
    if not ticker:
        return Response({'error': 'Ticker is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Fetch snapshot options chain from Polygon
        url = f"https://api.polygon.io/v3/snapshot/options/{ticker}"
        params = { "apiKey": POLYGON_API_KEY }
        response = requests.get(url, params=params)

        if response.status_code != 200:
            return Response({'error': 'Polygon API request failed'}, status=response.status_code)

        data = response.json()
        options = data.get("results", [])

        # Extract unique expiration dates
        expirations = sorted({
            opt.get("details", {}).get("expiration_date")
            for opt in options
            if opt.get("details", {}).get("expiration_date")
        })

        # Extract unique strike prices
        strikes = sorted({
            opt.get("details", {}).get("strike_price")
            for opt in options
            if opt.get("details", {}).get("strike_price") is not None
        })

        # Use the underlying asset's reported price
        current_price = (
            options[0].get("underlying_asset", {}).get("price")
            if options else None
        )

        return Response({
            "expirations": expirations,
            "strikes": strikes,
            "currentPrice": current_price
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
