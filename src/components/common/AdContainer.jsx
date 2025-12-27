import { useState, useEffect, useRef } from 'react';
import { Move, X, BarChart3 } from 'lucide-react';
import AdCard from './AdCard';
import { useAds } from '../../contexts/AdContext';

const AdContainer = ({
  position = 'random',
  postIndex = 0,
  isDraggable = false,
  onPositionChange,
  onRemove,
  className = '',
}) => {
  const { fetchAds, getAds, cacheVersion } = useAds();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedAd, setDraggedAd] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const hasFetchedRef = useRef(false);
  const positionRef = useRef(position);

  // Update position ref when position changes
  useEffect(() => {
    if (positionRef.current !== position) {
      positionRef.current = position;
      hasFetchedRef.current = false;
    }
  }, [position]);

  useEffect(() => {
    let isMounted = true;
    const cacheKey = `${position}_2`;
    
    // Reset fetch flag when position changes
    if (positionRef.current !== position) {
      hasFetchedRef.current = false;
      positionRef.current = position;
    }
    
    const loadAds = async () => {
      // Check cache first - synchronous check
      const cached = getAds(position, 2);
      if (cached.ads.length > 0) {
        if (isMounted) {
          setAds(cached.ads);
          setLoading(false);
          hasFetchedRef.current = true;
        }
        return;
      }

      // Only fetch if we haven't fetched for this position yet
      if (!hasFetchedRef.current) {
        setLoading(true);
        hasFetchedRef.current = true;
        
        try {
          const result = await fetchAds(position, 2);
          if (isMounted) {
            setAds(result.data || []);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error fetching ads:', error);
          if (isMounted) {
            setAds([]);
            setLoading(false);
          }
        }
      } else if (cached.loading) {
        // Already fetching, just set loading state
        setLoading(true);
      }
    };

    loadAds();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]); // Only depend on position, not cacheVersion to prevent excessive re-renders

  const handleAdClose = async (adId) => {
    // Remove ad from display (user can manually close ads)
    setAds((prev) => prev.filter((ad) => ad._id !== adId));

    // Optionally track this as a user interaction
    try {
      // You could add an endpoint to track ad dismissals
      console.log('Ad dismissed:', adId);
    } catch (error) {
      console.error('Error tracking ad dismissal:', error);
    }
  };

  const handleDragStart = (ad) => {
    setDraggedAd(ad);
  };

  const handleDragEnd = () => {
    setDraggedAd(null);
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!draggedAd || !onPositionChange) return;

    try {
      // Update the ad position based on where it was dropped
      const newPosition = getPositionFromIndex(postIndex);
      await advertisementService.updateAdvertisementPosition(
        draggedAd._id,
        newPosition,
        draggedAd.priority
      );

      if (onPositionChange) {
        onPositionChange(draggedAd._id, newPosition, postIndex);
      }

      // Refresh ads for this container
      const result = await fetchAds(position, 2);
      setAds(result.data || []);
    } catch (error) {
      console.error('Error updating ad position:', error);
    }
  };

  const getPositionFromIndex = (index) => {
    if (index <= 2) return 'top';
    if (index >= 8) return 'bottom';
    return 'middle';
  };

  const getAdSpacing = () => {
    // Determine spacing based on post position - responsive for mobile
    if (postIndex <= 2) return 'my-3 sm:my-4'; // Less spacing at top
    if (postIndex >= 8) return 'my-4 sm:my-6'; // More spacing at bottom
    return 'my-4 sm:my-5'; // Medium spacing in middle
  };

  // Don't show loading skeleton or empty ads - just return null
  if (loading || !ads || ads.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative ${getAdSpacing()} ${className} ${
        isDragOver ? 'ring-2 ring-purple-500 ring-opacity-50' : ''
      }`}
      onDragOver={isDraggable ? handleDragOver : undefined}
      onDragLeave={isDraggable ? handleDragLeave : undefined}
      onDrop={isDraggable ? handleDrop : undefined}
    >
      {/* Ad Container Header (for admin/management mode) */}
      {isDraggable && (
        <div className="absolute -top-2 left-2 z-10 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          Ad Zone {postIndex + 1}
        </div>
      )}

      {/* Remove Container Button (for management mode) */}
      {isDraggable && onRemove && (
        <button
          onClick={() => onRemove(postIndex)}
          className="absolute -top-2 right-2 z-10 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
          title="Remove ad container"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Ads Display */}
      <div className="space-y-3 sm:space-y-4">
        {ads.map((ad, index) => (
          <div key={ad._id} className="relative">
            {/* Ad Position Indicator - Only show in admin mode */}
            {isDraggable && (
              <div className="absolute -top-1 -left-1 z-10 bg-blue-600 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                {index + 1}
              </div>
            )}

            <AdCard
              ad={ad}
              onClose={handleAdClose}
              isDraggable={isDraggable}
              showAnalytics={isDraggable}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
        ))}
      </div>

      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-purple-100 bg-opacity-75 border-2 border-dashed border-purple-400 rounded-lg flex items-center justify-center">
          <div className="text-purple-600 text-center">
            <Move className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Drop ad here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdContainer;
