import React from 'react';

function LoadingOverlay({ isVisible, currentProgress = 0, totalProgress = 0, message = "Loading..." }) {
  if (!isVisible) return null;

  const percentage = totalProgress > 0 ? Math.round((currentProgress / totalProgress) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-600 shadow-2xl">
        <div className="text-center">
          {/* Spinner */}
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>

          {/* Progress Message */}
          <h3 className="text-lg font-semibold text-white mb-2">{message}</h3>

          {/* Contract Progress */}
          {totalProgress > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-300 mb-2">
                Processing {currentProgress} of {totalProgress} contracts ({percentage}%)
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Loading Message */}
          <p className="text-sm text-gray-400">
            Please wait while we process your request...
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;