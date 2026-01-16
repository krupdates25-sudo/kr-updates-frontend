import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

const FeedbackButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Show button after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    // Show message after button appears
    const messageTimer = setTimeout(() => {
      if (isVisible) {
        setShowMessage(true);
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(messageTimer);
    };
  }, [isVisible]);

  const handleClick = () => {
    // Dispatch custom event to open modal
    window.dispatchEvent(new CustomEvent('openFeedbackModal'));
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {/* Animated message bubble */}
      {showMessage && isVisible && (
        <div
          className="absolute bottom-16 right-0 mb-2 bg-white rounded-lg shadow-xl p-3 max-w-[200px] md:max-w-[250px] animate-fade-in"
          style={{
            animation: 'slideInUp 0.3s ease-out',
          }}
        >
          <p className="text-sm font-medium text-gray-800 mb-1">
            Enjoying KR Updates?
          </p>
          <p className="text-xs text-gray-600">
            Don't forget to share your feedback!
          </p>
          <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
        </div>
      )}

      {/* Animated button */}
      <button
        onClick={handleClick}
        className={`
          bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
          text-white rounded-full p-4 shadow-lg hover:shadow-xl
          transition-all duration-300 transform hover:scale-110
          flex items-center justify-center
          ${isVisible ? 'animate-bounce-in' : 'opacity-0 scale-0'}
        `}
        style={{
          animation: isVisible
            ? 'bounceIn 0.6s ease-out, pulse 2s infinite'
            : 'none',
        }}
        aria-label="Share feedback"
      >
        <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
      </button>

    </div>
  );
};

export default FeedbackButton;

