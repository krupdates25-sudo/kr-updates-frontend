import { memo } from 'react';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OptimisticImage from './OptimisticImage';

const CompactArticleRowCard = ({ article }) => {
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
    <div className="bg-white rounded-xl border border-gray-200 p-3 flex gap-3 items-start">
      {/* Bigger cover image for mobile so it doesn't look like a tiny thumbnail */}
      <div className="w-32 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <OptimisticImage
          src={imageUrl}
          alt={article.title}
          className="w-full h-full"
          imgClassName="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {article.category && (
          <span className="inline-flex w-fit px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 mb-1">
            {article.category}
          </span>
        )}

        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
          {article.title}
        </h3>

        {article.description && (
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
            {article.description}
          </p>
        )}

        {/* Bottom row: meta left, button right (wrap-safe) */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{article.readTime?.split(' ')[0] || '5'}m</span>
            <span className="text-gray-300">•</span>
            <span>{formatDate(article.publishedAt || new Date())}</span>
          </div>

          <button
            onClick={() =>
              navigate(`/post/${postSlug}`, { state: { initialPost: article } })
            }
            className="ml-auto whitespace-nowrap inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Continue reading
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(CompactArticleRowCard);


