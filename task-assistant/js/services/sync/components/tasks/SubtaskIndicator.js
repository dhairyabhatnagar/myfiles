import React from 'react';
import { calculateSubtaskProgress } from '../../types/subtask.types.js';

/**
 * SubtaskIndicator - Badge component showing subtask progress on task card
 * Displays count and progress, clickable to open subtask modal
 */
export function SubtaskIndicator({ subtasks, onClick, className = '' }) {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const progress = calculateSubtaskProgress(subtasks);
  
  // Determine color based on progress
  const getProgressColor = () => {
    if (progress.percentage === 0) {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    } else if (progress.percentage === 100) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    } else {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-sm font-medium
        hover:opacity-80 transition-opacity cursor-pointer
        ${getProgressColor()}
        ${className}
      `}
      title={`${progress.completed} of ${progress.total} subtasks complete (${progress.percentage}%)`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
        />
      </svg>
      <span>{progress.completed}/{progress.total}</span>
      {progress.percentage > 0 && (
        <span className="text-xs">({progress.percentage}%)</span>
      )}
    </button>
  );
}

/**
 * SubtaskProgressBar - Slim progress bar for task cards
 * Alternative to the badge indicator
 */
export function SubtaskProgressBar({ subtasks, onClick, className = '' }) {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const progress = calculateSubtaskProgress(subtasks);

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`cursor-pointer ${className}`}
      title={`${progress.completed} of ${progress.total} subtasks complete`}
    >
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
          />
        </svg>
        <span>{progress.completed}/{progress.total}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${
            progress.percentage === 100 
              ? 'bg-green-500' 
              : progress.percentage > 0 
                ? 'bg-yellow-500' 
                : 'bg-gray-400'
          }`}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </div>
  );
}
