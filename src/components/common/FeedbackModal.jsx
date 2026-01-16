import { useState, useEffect } from 'react';
import { X, Star, Send, CheckCircle } from 'lucide-react';
import feedbackService from '../../services/feedbackService';
import { useAuth } from '../../contexts/AuthContext';

const FeedbackModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOpenModal = () => {
      // This will be handled by parent component
    };

    window.addEventListener('openFeedbackModal', handleOpenModal);
    return () => {
      window.removeEventListener('openFeedbackModal', handleOpenModal);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await feedbackService.submitFeedback({
        rating,
        description: description.trim(),
      });

      setIsSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(
        err?.message || 'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setHoveredRating(0);
      setDescription('');
      setError('');
      setIsSubmitted(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 md:p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              {isSubmitted ? 'Thank You!' : 'Share Your Feedback'}
            </h2>
            <p className="text-sm md:text-base text-blue-100 mt-1">
              {isSubmitted
                ? 'Your feedback helps us improve'
                : 'We value your opinion'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-scale-in">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Feedback Submitted!
              </h3>
              <p className="text-gray-600">
                Thank you for helping us improve KR Updates.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  How would you rate your experience? *
                </label>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-10 h-10 md:w-12 md:h-12 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-2 text-center md:text-left">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Tell us more (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What did you like? What can we improve?"
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {description.length}/1000
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
};

export default FeedbackModal;

