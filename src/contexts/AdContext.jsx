import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import advertisementService from '../services/advertisementService';

const AdContext = createContext();

export const useAds = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within AdProvider');
  }
  return context;
};

export const AdProvider = ({ children }) => {
  // Use refs to store cache to avoid dependency issues
  const adsCacheRef = useRef({});
  const loadingCacheRef = useRef({});
  const fetchPromisesRef = useRef({});
  
  // State for triggering re-renders when cache updates
  const [cacheVersion, setCacheVersion] = useState(0);
  
  // Expose cache version for components to subscribe
  const getCacheVersion = useCallback(() => cacheVersion, [cacheVersion]);

  const fetchAds = useCallback(async (position = 'random', limit = 2) => {
    const cacheKey = `${position}_${limit}`;

    // If already loading, return the existing promise
    if (fetchPromisesRef.current[cacheKey]) {
      return fetchPromisesRef.current[cacheKey];
    }

    // If already cached, return cached data
    if (adsCacheRef.current[cacheKey] && adsCacheRef.current[cacheKey].length > 0) {
      return { data: adsCacheRef.current[cacheKey] };
    }

    // Set loading state
    loadingCacheRef.current[cacheKey] = true;
    setCacheVersion((v) => v + 1);

    // Create fetch promise
    const fetchPromise = (async () => {
      try {
        const response = await advertisementService.getActiveAdvertisements(
          position,
          limit
        );
        
        // Handle API response structure
        // Backend returns: { statusCode: 200, data: [...ads], message: "...", success: true }
        // Axios wraps it: response.data = { statusCode: 200, data: [...ads], ... }
        // So we need: response.data.data
        let adsData = [];
        if (response?.data) {
          if (Array.isArray(response.data)) {
            // Direct array (unlikely but handle it)
            adsData = response.data;
          } else if (response.data.data) {
            // Nested data property - this is the correct structure
            adsData = Array.isArray(response.data.data) ? response.data.data : [];
          }
        }
        
        console.log(`[AdContext] Fetched ${adsData.length} ads for position ${position}:`, adsData);

        // Cache the ads in ref
        adsCacheRef.current[cacheKey] = adsData;
        loadingCacheRef.current[cacheKey] = false;
        
        // Trigger re-render
        setCacheVersion((v) => v + 1);
        
        // Clear the promise reference
        delete fetchPromisesRef.current[cacheKey];
        
        return { data: adsData };
      } catch (error) {
        console.error(`Error fetching ads for position ${position}:`, error);
        adsCacheRef.current[cacheKey] = [];
        loadingCacheRef.current[cacheKey] = false;
        
        // Trigger re-render
        setCacheVersion((v) => v + 1);
        
        // Clear the promise reference
        delete fetchPromisesRef.current[cacheKey];
        
        return { data: [] };
      }
    })();

    // Store the promise
    fetchPromisesRef.current[cacheKey] = fetchPromise;

    return fetchPromise;
  }, []); // NO DEPENDENCIES - stable function

  const getAds = useCallback((position = 'random', limit = 2) => {
    const cacheKey = `${position}_${limit}`;
    return {
      ads: adsCacheRef.current[cacheKey] || [],
      loading: loadingCacheRef.current[cacheKey] || false,
    };
  }, []); // NO DEPENDENCIES - stable function

  const clearCache = useCallback(() => {
    adsCacheRef.current = {};
    loadingCacheRef.current = {};
    fetchPromisesRef.current = {};
    setCacheVersion((v) => v + 1);
  }, []);

  const refreshAds = useCallback(async (position = 'random', limit = 2) => {
    const cacheKey = `${position}_${limit}`;
    // Clear cache for this position
    delete adsCacheRef.current[cacheKey];
    delete loadingCacheRef.current[cacheKey];
    setCacheVersion((v) => v + 1);
    // Fetch fresh data
    return fetchAds(position, limit);
  }, [fetchAds]);

  return (
    <AdContext.Provider
      value={{
        fetchAds,
        getAds,
        clearCache,
        refreshAds,
        cacheVersion,
      }}
    >
      {children}
    </AdContext.Provider>
  );
};

