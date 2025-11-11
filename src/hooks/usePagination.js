import { useState, useEffect, useCallback, useRef } from 'react';

const usePagination = (
  fetchFunction,
  {
    initialPage = 1,
    limit = 8,
    dependencies = [],
    transformData = (data) => data,
  }
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);

  // Track totals
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  // Track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);

  // Reset function for when dependencies change
  const resetData = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setTotalCount(0);
    setLoadedCount(0);
    setLoading(true);
    isFetchingRef.current = false;
  }, [initialPage]);

  // Fetch data function
  const fetchData = useCallback(
    async (pageNumber, isLoadMore = false) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = {
          page: pageNumber,
          limit,
        };

        const response = await fetchFunction(params);
        const newItems = transformData(response.data || []);

        // Extract pagination info from response
        const total = response.totalCount || response.total || newItems.length;
        const hasMoreItems =
          response.hasMore !== undefined
            ? response.hasMore
            : pageNumber * limit < total;

        setTotalCount(total);

        if (isLoadMore && pageNumber > initialPage) {
          // Append new data for load more
          setData((prevData) => {
            const newData = [...prevData, ...newItems];
            setLoadedCount(newData.length);
            return newData;
          });
        } else {
          // Replace data for initial load or filter change
          setData(newItems);
          setLoadedCount(newItems.length);
        }

        setHasMore(hasMoreItems && newItems.length > 0);
      } catch (err) {
        console.error('📛 Error fetching data:', err);
        setError(err.message || 'Failed to fetch data');

        if (!isLoadMore) {
          setData([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [fetchFunction, limit, transformData, initialPage]
  );

  // Load more function (manual trigger)
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  }, [hasMore, loadingMore, loading, page, fetchData]);

  // Reset data when dependencies change
  useEffect(() => {
    resetData();
  }, dependencies);

  // Fetch initial data
  useEffect(() => {
    if (page === initialPage) {
      fetchData(initialPage, false);
    }
  }, [page, initialPage, fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    resetData();
  }, [resetData]);

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    error,
    page,
    totalCount,
    loadedCount,
    loadMore,
    refresh,
  };
};

export default usePagination;
