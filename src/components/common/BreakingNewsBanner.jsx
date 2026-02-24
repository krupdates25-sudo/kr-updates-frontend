import { memo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { breakingNewsService } from '../../services/breakingNewsService';
import { useSocket } from '../../contexts/SocketContext';

const BreakingNewsBanner = ({ onCurrentStoryChange } = {}) => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();

  // Always compute (may be undefined when stories empty) so hooks can run unconditionally
  const currentStory = stories[currentIndex];

  // Let parent know which story is currently active (for sticky mini header, etc.)
  // IMPORTANT: This hook must never be conditional (fixes "Rendered more hooks than during the previous render")
  useEffect(() => {
    if (typeof onCurrentStoryChange === 'function') {
      onCurrentStoryChange(currentStory || null);
    }
  }, [currentStory?._id, currentIndex, stories.length, onCurrentStoryChange]);

  // Fetch breaking news stories
  useEffect(() => {
    fetchStories();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (socket && connected) {
      socket.on('breakingNewsUpdated', (data) => {
        console.log('Breaking news updated:', data);
        fetchStories();
      });

      socket.on('breakingNewsCreated', (data) => {
        console.log('Breaking news created:', data);
        fetchStories();
      });

      return () => {
        socket.off('breakingNewsUpdated');
        socket.off('breakingNewsCreated');
      };
    }
  }, [socket, connected]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await breakingNewsService.getStories();
      if (response.success) {
        // Filter only active stories that haven't expired
        // NOTE: Some legacy stories may not have `isActive` or `expiresAt` set.
        // Treat missing `isActive` as active, and missing `expiresAt` as non-expired.
        const now = new Date();
        const activeStories = (response.data || []).filter((story) => {
          const isActive = story?.isActive !== false;
          const notExpired = !story?.expiresAt || new Date(story.expiresAt) > now;
          return isActive && notExpired;
        });
        // Sort by priority (highest first) and then by creation date
        activeStories.sort((a, b) => {
          if (b.priority !== a.priority) {
            return b.priority - a.priority;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setStories(activeStories);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error fetching breaking news:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-rotate stories every 8 seconds
  useEffect(() => {
    if (stories.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % stories.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [stories.length]);

  if (loading || stories.length === 0) {
    return null;
  }

  const handleReadMore = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (currentStory?._id) {
      navigate(`/breaking-news/${currentStory._id}`);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  return (
    <div className="relative w-full mb-3 sm:mb-4 md:mb-6 overflow-hidden rounded-lg sm:rounded-xl shadow-lg">
      {/* Banner Container */}
      <div
        className="relative min-h-[180px] sm:min-h-[220px] md:min-h-[280px] lg:min-h-[320px] bg-gradient-to-r from-red-600 via-red-500 to-orange-500 flex items-center cursor-pointer group overflow-hidden"
        onClick={handleReadMore}
      >
        {/* Background Image with proper cover cropping */}
        {currentStory.image?.url && (
          <img
            src={currentStory.image.url}
            alt={currentStory.image.alt || currentStory.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            loading="eager"
            decoding="async"
          />
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10" />

        {/* Content */}
        <div className="relative z-10 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
            {/* Left Content */}
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              {/* Breaking News Badge - Skewed */}
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4 flex-wrap">
                <span 
                  className="inline-block px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-red-600 text-white text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg transform -skew-x-12 hover:bg-red-700 transition-colors"
                  style={{
                    transform: 'skewX(-12deg)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <span style={{ transform: 'skewX(12deg)', display: 'inline-block' }}>
                    Breaking News
                  </span>
                </span>
                <span className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs md:text-sm font-semibold rounded-full">
                  {currentStory.category}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1.5 sm:mb-2 md:mb-3 line-clamp-2 group-hover:text-red-200 transition-colors leading-tight">
                {currentStory.title}
              </h2>

              {/* Excerpt */}
              {currentStory.excerpt && (
                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/90 line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-3 md:mb-4 leading-relaxed">
                  {currentStory.excerpt}
                </p>
              )}

              {/* Read More Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReadMore(e);
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg group/btn text-xs sm:text-sm md:text-base"
              >
                <span>Read More</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Navigation Arrows (only show if multiple stories) */}
            {stories.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                  aria-label="Previous story"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                  aria-label="Next story"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
          </div>

          {/* Story Indicators */}
          {stories.length > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 mt-3 sm:mt-4 md:mt-6">
              {stories.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`h-1 sm:h-1.5 md:h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white w-4 sm:w-6 md:w-8'
                      : 'bg-white/50 w-1 sm:w-1.5 md:w-2 hover:bg-white/75'
                  }`}
                  aria-label={`Go to story ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {stories.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="sm:hidden absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white flex items-center justify-center"
              aria-label="Previous story"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="sm:hidden absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white flex items-center justify-center"
              aria-label="Next story"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(BreakingNewsBanner);


