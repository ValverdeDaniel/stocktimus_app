import React from 'react';

function AnalysisHistory({ sessions, onLoadSession, onDeleteSession }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No analysis history available</p>
        <p className="text-gray-500 text-sm mt-2">
          Your saved analysis sessions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Analysis History</h2>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="bg-gray-800 rounded p-4 border border-gray-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-white mb-1">
                  {session.session_name || `Session ${session.id}`}
                </h3>

                <div className="text-sm text-gray-400 space-y-1">
                  <div>
                    <span className="font-medium">Tickers:</span> {session.tickers.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Analysis Types:</span> {session.analysis_types.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">Analyzed:</span> {session.total_tickers_analyzed} stocks
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {formatDate(session.created_date)}
                  </div>
                  {session.session_duration_seconds && (
                    <div>
                      <span className="font-medium">Duration:</span> {session.session_duration_seconds}s
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => onLoadSession(session.id)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Load
                </button>
                <button
                  onClick={() => onDeleteSession(session.id)}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalysisHistory;