import React from 'react';

export default function SkeletonCard({ type = 'default', count = 1 }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'course':
        return (
          <div className="card overflow-hidden">
            <div className="skeleton h-44 w-full" />
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton h-6 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div className="skeleton h-8 w-24 rounded" />
                <div className="skeleton h-8 w-20 rounded" />
              </div>
            </div>
          </div>
        );
      case 'post':
        return (
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
            <div className="skeleton h-5 w-4/5 rounded" />
            <div className="skeleton h-14 w-full rounded" />
            <div className="flex gap-4 pt-2">
              <div className="skeleton h-6 w-16 rounded" />
              <div className="skeleton h-6 w-16 rounded" />
            </div>
          </div>
        );
      case 'exam':
        return (
          <div className="card p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="skeleton h-6 w-48 rounded" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="skeleton h-10 rounded" />
              <div className="skeleton h-10 rounded" />
              <div className="skeleton h-10 rounded" />
            </div>
            <div className="skeleton h-10 w-full rounded" />
          </div>
        );
      default:
        return (
          <div className="card p-5 space-y-3">
            <div className="skeleton h-5 w-1/3 rounded" />
            <div className="skeleton h-8 w-1/2 rounded" />
            <div className="skeleton h-4 w-full rounded" />
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
      ))}
    </>
  );
}

