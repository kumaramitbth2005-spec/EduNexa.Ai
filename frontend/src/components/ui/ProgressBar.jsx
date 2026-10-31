import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  color = 'primary',
  showLabel = false,
  height = 'h-2.5',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const colorVariants = {
    primary: 'bg-primary-600 dark:bg-primary-500',
    green: 'bg-emerald-500 dark:bg-emerald-400',
    yellow: 'bg-amber-500 dark:bg-amber-400',
    red: 'bg-rose-500 dark:bg-rose-400',
    purple: 'bg-purple-600 dark:bg-purple-500',
  };

  const selectedColor = colorVariants[color] || colorVariants.primary;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${height} ${selectedColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

