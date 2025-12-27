import { useState, useEffect, useRef } from 'react';
import AdCard from './AdCard';
import { useAds } from '../../contexts/AdContext';

/**
 * SidebarAd Component - Google Ads style sidebar advertisement
 * - Fixed/sticky position while content scrolls
 * - Shifts content to accommodate ad width
 * - Only shows on desktop (lg breakpoint and above)
 */
const SidebarAd = ({ position = 'sidebar', className = '' }) => {
  const { fetchAds, getAds, cacheVersion } = useAds();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSticky, setIsSticky] = useState(false);
  const adRef = useRef(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadAds = async () => {
      // Check cache first
      const cached = getAds(position, 1); // Only 1 ad for sidebar
      if (cached.ads.length > 0) {
        if (isMounted) {
          setAds(cached.ads);
          setLoading(false);
          hasFetchedRef.current = true;
        }
        return;
      }

      // Only fetch if we haven't fetched yet
      if (!hasFetchedRef.current) {
        setLoading(true);
        hasFetchedRef.current = true;
        
        try {
          const result = await fetchAds(position, 1);
          if (isMounted) {
            setAds(result.data || []);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching sidebar ads:', error);
          if (isMounted) {
            setAds([]);
            setLoading(false);
          }
        }
      } else if (cached.loading) {
        setLoading(true);
      }
    };

    loadAds();

    return () => {
      isMounted = false;
    };
  }, [position, cacheVersion, fetchAds, getAds]);

  // Handle sticky positioning
  useEffect(() => {
    const handleScroll = () => {
      if (adRef.current) {
        const rect = adRef.current.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        setIsSticky(isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleAdClose = (adId) => {
    setAds((prev) => prev.filter((ad) => ad._id !== adId));
  };

  if (loading) {
    return (
      <div className={`hidden lg:block w-64 xl:w-72 flex-shrink-0 ${className}`}>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse sticky top-4">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return null; // Don't render sidebar if no ads
  }

  return (
    <aside
      ref={adRef}
      className={`hidden lg:flex lg:flex-col w-64 xl:w-72 flex-shrink-0 self-start ${className}`}
    >
      <div className="sticky top-4 space-y-4">
        {ads.map((ad) => (
          <div key={ad._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <AdCard
              ad={ad}
              onClose={handleAdClose}
              isDraggable={false}
              showAnalytics={false}
            />
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarAd;

