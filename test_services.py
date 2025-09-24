
from stock_analyzer.services.fundamentals_service import FundamentalsService
from stock_analyzer.services.eps_trends_service import EPSTrendsService
import json

print('Testing FundamentalsService...')
fs = FundamentalsService()
result = fs.analyze_fundamentals('AAPL')
print('AAPL fundamental analysis result:')
print(json.dumps(result, indent=2, default=str))

print('\nTesting EPSTrendsService...')
eps = EPSTrendsService()
result2 = eps.analyze_single_ticker('MSFT')
print('MSFT EPS trends result:')
print(json.dumps(result2, indent=2, default=str))

