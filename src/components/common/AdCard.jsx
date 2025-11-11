import { useState } from 'react';
import {
  X,
  ExternalLink,
  BarChart3,
  Eye,
  MousePointer,
  Calendar,
  DollarSign,
} from 'lucide-react';
import advertisementService from '../../services/advertisementService';

const AdCard = ({
  ad,
  onClose,
  isDraggable = false,
  showAnalytics = false,
  onDragStart,
  onDragEnd,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      await advertisementService.trackClick(ad._id);
      window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
      // Still open the link even if tracking fails
      window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e) => {
    if (onDragStart) {
      e.dataTransfer.setData('text/plain', ad._id);
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(ad);
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd(ad);
    }
  };

  const getAdTypeStyles = () => {
    switch (ad.adType) {
      case 'banner':
        return 'w-full h-32 md:h-40 lg:h-48';
      case 'card':
        return 'w-full max-w-sm h-64';
      case 'sidebar':
        return 'w-full max-w-xs h-48';
      case 'popup':
        return 'w-full max-w-md h-56';
      default:
        return 'w-full h-40 lg:h-48';
    }
  };

  // Fix: Only mark as expired if endDate exists and is truly in the past
  let isExpired = false;
  let daysRemaining = null;
  if (ad.endDate) {
    let end;
    if (/^\d{4}-\d{2}-\d{2}$/.test(ad.endDate)) {
      // If endDate is 'YYYY-MM-DD', treat as local end of day
      end = new Date(ad.endDate + 'T23:59:59');
    } else {
      end = new Date(ad.endDate);
    }
    const now = new Date();
    if (!isNaN(end.getTime())) {
      isExpired = now > end;
      daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    }
  }

  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row transition-all duration-300 w-full ${
        isDraggable ? 'cursor-move' : 'cursor-pointer'
      } ${getAdTypeStyles()}`}
      onClick={!isDraggable ? handleClick : undefined}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ background: '#fff' }}
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(ad._id);
          }}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 p-1 sm:p-1.5 bg-gray-800 bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200 touch-manipulation"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      )}

      {/* Status Badges */}
      <div className="absolute top-1.5 right-10 sm:top-2 sm:right-12 z-10 flex space-x-1">
        {!ad.isActive && (
          <span className="bg-red-600 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium border border-white shadow">
            Inactive
          </span>
        )}
        {isExpired && (
          <span className="bg-gray-800 text-yellow-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold border border-white shadow">
            Expired
          </span>
        )}
        {!isExpired &&
          daysRemaining !== null &&
          daysRemaining <= 3 &&
          daysRemaining > 0 && (
            <span className="bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium border border-white shadow">
              {daysRemaining}d left
            </span>
          )}
      </div>

      {/* Left: Image */}
      <div className="flex-shrink-0 flex items-center justify-center bg-white md:w-[320px] w-full h-44 sm:h-52 md:h-auto p-0 rounded-t-xl md:rounded-t-none md:rounded-l-xl overflow-hidden">
        <img
          src={ad.imageUrl}
          alt={ad.title || 'Ad Image'}
          className="object-cover w-full h-full max-h-44 sm:max-h-52 md:max-h-none rounded-t-xl md:rounded-t-none md:rounded-l-xl"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x200?text=Ad+Image';
          }}
        />
      </div>

      {/* Right: Content */}
      <div className="flex flex-col justify-start flex-1 p-4 sm:p-6 bg-white rounded-b-xl md:rounded-b-none md:rounded-r-xl relative min-h-[180px] sm:min-h-[200px]">
        {/* Ad Tag */}
        <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider z-10 border border-yellow-300">
          Ad
        </span>
        <h3 className="font-bold text-base sm:text-lg md:text-xl lg:text-2xl mb-2 sm:mb-3 text-gray-900 pt-5 sm:pt-6 md:pt-0 pl-0 md:pl-8 break-words">
          {ad.title || 'Untitled Ad'}
        </h3>
        <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 pl-0 md:pl-8 break-words leading-relaxed">
          {ad.description || 'No description provided.'}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-auto pl-0 md:pl-8">
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            {ad.clientName || 'Unknown Client'}
          </span>
          <a
            href={ad.clickUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Visit</span>
          </a>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
          )}
        </div>
      </div>

      {/* Analytics Bar (if enabled) */}
      {showAnalytics && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{ad.impressions || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MousePointer className="w-3 h-3" />
                <span>{ad.clicks || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-3 h-3" />
                <span>{ad.ctr || 0}%</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{daysRemaining > 0 ? `${daysRemaining}d` : 'Expired'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Drag Handle (if draggable) */}
      {isDraggable && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="grid grid-cols-2 gap-1">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdCard;
