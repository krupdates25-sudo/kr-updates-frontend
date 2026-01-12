import { Clock } from 'lucide-react';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import OptimisticImage from './OptimisticImage';

const WideArticleRowCard = ({ article }) => {
  const navigate = useNavigate();
  const postSlug = article.slug || String(article._id || article.id || '');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const imageUrl = article.featuredImage?.url || article.image;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
      {/* Image - Responsive sizing */}
      <div className="w-full sm:w-32 md:w-44 h-32 sm:h-28 md:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        <OptimisticImage
          src={imageUrl}
          alt={article.title}
          className="w-full h-full"
          imgClassName="object-cover"
        />
      </div>

      {/* Content - Flex column to prevent overflow */}
      <div className="flex-1 min-w-0 flex flex-col w-full sm:w-auto">
        {article.category && (
          <span className="inline-flex w-fit px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 mb-2">
            {article.category}
          </span>
        )}

        <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2">
          {article.title}
        </h3>

        {article.description && (
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2">
            {article.description}
          </p>
        )}

        {/* Bottom section - Stack on mobile, row on desktop */}
        <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{article.readTime?.split(' ')[0] || '5'}m</span>
            <span className="text-gray-300">•</span>
            <span>{formatDate(article.publishedAt || new Date())}</span>
          </div>

          <button
            onClick={() =>
              navigate(`/post/${postSlug}`, { state: { initialPost: article } })
            }
            className="w-full sm:w-auto sm:ml-auto whitespace-nowrap inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 active:bg-blue-100 transition-colors"
          >
            Continue reading
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(WideArticleRowCard);





