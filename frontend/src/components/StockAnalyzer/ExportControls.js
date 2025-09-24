import React, { useState } from 'react';

function ExportControls({ sessionId, analysisTypes, onExport }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format) => {
    setIsExporting(true);

    try {
      await onExport({
        session_id: sessionId,
        analysis_types: analysisTypes,
        format: format
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </button>

      <button
        onClick={() => handleExport('excel')}
        disabled={isExporting}
        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? 'Exporting...' : 'Export Excel'}
      </button>
    </div>
  );
}

export default ExportControls;