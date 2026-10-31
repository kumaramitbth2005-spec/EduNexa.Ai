import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary-200 dark:border-primary-900 rounded-2xl animate-ping opacity-20" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">EduNexa</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading your learning experience...</p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

