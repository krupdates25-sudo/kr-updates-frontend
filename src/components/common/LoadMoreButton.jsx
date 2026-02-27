import { Loader2, CheckCircle } from 'lucide-react';

const LoadMoreButton = ({
  loading,
  loadingMore,
  hasMore,
  error,
  totalCount,
  loadedCount,
  onLoadMore,
  onRetry,
}) => {
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load more posts
        </h3>
        <p className="text-gray-600 text-center mb-4 max-w-md">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // End of content state - Don't show anything when reached end
  if (!hasMore && loadedCount > 0 && !loading) {
    return null;
  }

  // Show Load More button
  if (hasMore && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        {/* Progress indicator */}
        {totalCount > 0 && (
          <div className="mb-6 text-center">
            <div className="text-sm text-gray-500 mb-2">
              Showing {loadedCount} of {totalCount} posts
            </div>
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((loadedCount / totalCount) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Load More Button */}
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
          <div className="flex items-center gap-3">
            {loadingMore ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading More...</span>
              </>
            ) : (
              <>
                <span>Load More Articles</span>
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <span className="text-xs">+</span>
                </div>
              </>
            )}
          </div>
        </button>

        {/* Hint text */}
        <p className="text-sm text-gray-500 mt-4 text-center">
          Click to load {Math.min(8, totalCount - loadedCount)} more posts
        </p>
      </div>
    );
  }

  return null;
};

// Loading skeleton for initial load
export const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 py-6">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse flex flex-col h-full"
        >
          <div className="aspect-video bg-gray-200"></div>
          <div className="p-6 flex-1">
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="flex items-center justify-between mt-auto pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadMoreButton;
