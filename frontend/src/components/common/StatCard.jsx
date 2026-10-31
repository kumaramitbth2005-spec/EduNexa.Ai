import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'primary', change, subtitle }) {
  const colorMap = {
    primary: 'from-primary-500 to-indigo-600 text-primary-500 bg-primary-50 dark:bg-primary-950/40 border-primary-100 dark:border-primary-900',
    green: 'from-emerald-500 to-teal-600 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900',
    amber: 'from-amber-500 to-orange-600 text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900',
    purple: 'from-purple-500 to-pink-600 text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900',
    blue: 'from-blue-500 to-cyan-600 text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900',
  };

  const selectedColor = colorMap[color] || colorMap.primary;

  return (
    <div className="card p-5 relative overflow-hidden transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white tracking-tight">{value}</h3>
          {change && (
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
              {change}
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${selectedColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br opacity-5 pointer-events-none" />
    </div>
  );
}

