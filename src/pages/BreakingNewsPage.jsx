import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { breakingNewsService } from '../services/breakingNewsService';

const BreakingNewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchStory();
    }
  }, [id]);

  const fetchStory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await breakingNewsService.getStoryById(id);
      if (response.success && response.data) {
        setStory(response.data);
      } else {
        setError('Story not found');
      }
    } catch (err) {
      console.error('Error fetching breaking news story:', err);
      setError('Failed to load breaking news story');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading breaking news...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !story) {
    return (
      <PageLayout>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Story Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The breaking news story you are looking for does not exist or is not available.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="feed">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm sm:text-base">Back</span>
        </button>

        {/* Breaking News Badge */}
        <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 flex-wrap">
          <span 
            className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg transform -skew-x-12"
            style={{ transform: 'skewX(-12deg)' }}
          >
            <span style={{ transform: 'skewX(12deg)', display: 'inline-block' }}>
              Breaking News
            </span>
          </span>
          <span className="px-2 sm:px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs sm:text-sm font-semibold rounded-full">
            {story.category}
          </span>
        </div>

        {/* Featured Image */}
        {story.image?.url && (
          <div className="mb-4 sm:mb-6 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <img
              src={story.image.url}
              alt={story.image.alt || story.title}
              className="w-full h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] object-contain"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">
          {story.title}
        </h1>

        {/* Excerpt */}
        {story.excerpt && (
          <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 font-medium leading-relaxed">
            {story.excerpt}
          </p>
        )}

        {/* Content */}
        <div 
          className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none mb-6 sm:mb-8"
          dangerouslySetInnerHTML={{ __html: story.content }}
        />
      </div>
    </PageLayout>
  );
};

export default BreakingNewsPage;

