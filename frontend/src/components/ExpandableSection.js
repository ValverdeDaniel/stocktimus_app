import React, { useState } from 'react';

function ExpandableSection({
  title,
  icon = "▼",
  children,
  defaultExpanded = false,
  className = "",
  headerClassName = "",
  onExpand
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // Call onExpand when expanding for the first time
    if (newExpanded && onExpand) {
      onExpand();
    }
  };

  return (
    <div className={`mt-2 ${className}`}>
      {/* Header with toggle */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors ${headerClassName}`}
      >
        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          {icon}
        </span>
        {title}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-2 pl-4 border-l-2 border-gray-600">
          {children}
        </div>
      )}
    </div>
  );
}

export default ExpandableSection;