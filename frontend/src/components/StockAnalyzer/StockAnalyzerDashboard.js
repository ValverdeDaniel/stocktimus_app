import React, { useState, useEffect } from 'react';
import TickerInputSection from './TickerInputSection';
import FundamentalsTable from './FundamentalsTable';
import EPSTrendsChart from './EPSTrendsChart';
import AnalysisHistory from './AnalysisHistory';
import ExportControls from './ExportControls';
import apiClient from '../../services/api';

function StockAnalyzerDashboard() {
  const [analysisData, setAnalysisData] = useState({
    fundamentals: [],
    epseTrends: [],
    sessionId: null,
    sessionName: '',
    processing: false,
    errors: []
  });

  const [activeTab, setActiveTab] = useState('input'); // 'input', 'fundamentals', 'eps-trends', 'history'
  const [watchedStocks, setWatchedStocks] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  useEffect(() => {
    // Load watched stocks on component mount
    loadWatchedStocks();
    loadAnalysisHistory();
  }, []);

  const loadWatchedStocks = async () => {
    try {
      const response = await apiClient.get('/stock-analyzer/watched-stocks/');
      setWatchedStocks(response.data.watched_stocks || []);
    } catch (error) {
      console.error('Error loading watched stocks:', error);
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const response = await apiClient.get('/stock-analyzer/history/');
      setAnalysisHistory(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const handleAnalysisSubmit = async (formData) => {
    setAnalysisData(prev => ({ ...prev, processing: true, errors: [] }));

    // Debug logging
    console.log('Submitting analysis request:', formData);

    try {
      const response = await apiClient.post('/stock-analyzer/analyze/', formData);
      console.log('Analysis response:', response.data);

      setAnalysisData({
        fundamentals: response.data.fundamentals_results || [],
        epsTrends: response.data.eps_trends_results || [],
        sessionId: response.data.session_id,
        sessionName: response.data.session_name,
        processing: false,
        errors: response.data.errors || []
      });

      // Switch to appropriate tab based on analysis types
      if (formData.analysis_types.includes('fundamentals')) {
        setActiveTab('fundamentals');
      } else if (formData.analysis_types.includes('eps_trends')) {
        setActiveTab('eps-trends');
      }

      // Refresh history
      loadAnalysisHistory();

    } catch (error) {
      console.error('Analysis failed:', error);
      console.error('Error response:', error.response?.data);

      // Extract detailed error information
      const errorMessage = error.response?.data?.error || 'Analysis failed';
      const errorDetails = error.response?.data?.details || {};

      let detailedErrors = [errorMessage];

      // Add specific validation errors if available
      if (typeof errorDetails === 'object' && errorDetails !== null) {
        Object.entries(errorDetails).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach(msg => detailedErrors.push(`${field}: ${msg}`));
          } else {
            detailedErrors.push(`${field}: ${messages}`);
          }
        });
      }

      setAnalysisData(prev => ({
        ...prev,
        processing: false,
        errors: detailedErrors
      }));
    }
  };

  const handleAddToWatchlist = async (ticker, notes = '') => {
    try {
      await apiClient.post('/stock-analyzer/watched-stocks/', {
        ticker: ticker.toUpperCase(),
        notes
      });
      loadWatchedStocks();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };


  const handleExport = async (exportOptions) => {
    try {
      const response = await apiClient.post('/stock-analyzer/export/', exportOptions, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'stock_analysis.csv';

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'input':
        return (
          <TickerInputSection
            onAnalysisSubmit={handleAnalysisSubmit}
            watchedStocks={watchedStocks}
            onAddToWatchlist={handleAddToWatchlist}
            processing={analysisData.processing}
            errors={analysisData.errors}
          />
        );

      case 'fundamentals':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Fundamentals Analysis</h2>
              <ExportControls
                sessionId={analysisData.sessionId}
                analysisTypes={['fundamentals']}
                onExport={handleExport}
              />
            </div>
            <FundamentalsTable
              data={analysisData.fundamentals}
              onAddToWatchlist={handleAddToWatchlist}
              watchedStocks={watchedStocks}
            />
          </div>
        );

      case 'eps-trends':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">EPS Trends Analysis</h2>
              <ExportControls
                sessionId={analysisData.sessionId}
                analysisTypes={['eps_trends']}
                onExport={handleExport}
              />
            </div>
            <EPSTrendsChart
              data={analysisData.epsTrends}
              onAddToWatchlist={handleAddToWatchlist}
              watchedStocks={watchedStocks}
            />
          </div>
        );

      case 'history':
        return (
          <AnalysisHistory
            sessions={analysisHistory}
            onLoadSession={(sessionId) => {
              // Load session data - could implement this later
              console.log('Load session:', sessionId);
            }}
            onDeleteSession={(sessionId) => {
              // Delete session - could implement this later
              console.log('Delete session:', sessionId);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stock Analyzer</h1>
          <p className="text-gray-400">
            Comprehensive fundamental analysis and EPS trends tracking
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'input', label: 'Analysis Input', icon: '🔍' },
              { key: 'fundamentals', label: 'Fundamentals', icon: '📊' },
              { key: 'eps-trends', label: 'EPS Trends', icon: '📈' },
              { key: 'history', label: 'History', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {renderTabContent()}
        </div>

        {/* Status Bar */}
        {analysisData.processing && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing analysis...
            </div>
          </div>
        )}

        {/* Error Display */}
        {analysisData.errors.length > 0 && (
          <div className="fixed bottom-4 left-4 max-w-md">
            {analysisData.errors.map((error, index) => (
              <div key={index} className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg mb-2">
                {error}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StockAnalyzerDashboard;