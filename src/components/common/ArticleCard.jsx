import {
  Clock,
  Trash2,
  Pencil,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/postService';

const ArticleCard = ({
  article,
  onBookmark,
  onShare,
  showRank,
  showTrendingScore,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigate directly to post details page
    // Always use slug if available, otherwise use MongoDB _id (ensure it's a string)
    const postSlug = article.slug || String(article._id || article.id || '');
    if (!postSlug) {
      console.error('No valid post identifier found:', article);
      return;
    }
    navigate(`/post/${postSlug}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const postId = article._id || article.id;
    navigate(`/edit-post/${postId}`);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await postService.deletePost(article._id || article.id);
      // Refresh the page or remove the post from the list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  return (
    <>
      <article
        className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col"
        style={{ borderColor: '#e5e7eb' }}
        onClick={handleCardClick}
      >
        {/* Featured Media (Image or Video) */}
        {(article.featuredImage?.url ||
          article.featuredVideo?.url ||
          article.image) && (
            <div
              className="aspect-video overflow-hidden flex-shrink-0 relative bg-gray-100 flex items-center justify-center"
            >
              {article.featuredVideo?.url ? (
                <video
                  src={article.featuredVideo.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  poster={
                    article.featuredVideo.thumbnail || article.featuredImage?.url
                  }
                />
              ) : (
                <img
                  src={article.featuredImage?.url || article.image}
                  alt={article.featuredImage?.alt || article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to placeholder image if the main image fails to load
                    e.target.src =
                      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop&auto=format';
                  }}
                />
              )}
              {article.featuredVideo?.url && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  Video
                </div>
              )}
            </div>
          )}

        {/* Placeholder for posts without media */}
        {!article.featuredImage?.url &&
          !article.featuredVideo?.url &&
          !article.image && (
            <div
              className="h-28 sm:h-32 md:h-36 overflow-hidden flex-shrink-0 relative flex items-center justify-center bg-white"
            >
              <div className="text-center p-4">
                <div
                  className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gray-100"
                >
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-500">
                  {article.category || 'Article'}
                </p>
              </div>
            </div>
          )}

        {/* Content */}
        <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
          {/* Category Tag */}
          {article.category && (
            <span className="px-1.5 sm:px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 mb-1.5 sm:mb-2 w-fit">
              {article.category}
            </span>
          )}

          {/* Title (Heading) */}
          <h2 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
            {article.title || article.heading}
          </h2>

          {/* Subheading (Description) */}
          {article.description && (
            <p className="text-xs text-gray-600 mb-1.5 sm:mb-2 line-clamp-2 leading-snug">
              {article.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500 mb-1.5 sm:mb-2">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{article.readTime?.split(' ')[0] || '5'}m</span>
            </div>
            <span className="text-xs">•</span>
            {article.location && (
              <>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  <span className="text-xs">{article.location}</span>
                </div>
                <span className="text-xs">•</span>
              </>
            )}
            <span className="text-xs">{formatDate(article.publishedAt || new Date())}</span>
          </div>

          {/* Actions - Only Delete Button */}
          <div className="flex items-center justify-end gap-1 mt-auto pt-1.5 sm:pt-2 border-t border-gray-100">
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={handleEdit}
                  className="p-1 sm:p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                  title="Edit post"
                >
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 sm:p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                  title="Delete post"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </>
            )}
          </div>

          {/* Engagement stats - REMOVED (likes, comments) */}
          {/* <div
            className="flex items-center gap-4 mt-4 pt-3 border-t"
            style={{ borderColor: '#5755FE20' }}
          >
            <div
              className="flex items-center gap-1 text-xs text-gray-500 transition-colors"
              style={{ '&:hover': { color: '#5755FE' } }}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="font-medium">{likeCount}</span>
            </div>

            <div
              className="flex items-center gap-1 text-xs text-gray-500 transition-colors"
              style={{ '&:hover': { color: '#5755FE' } }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="font-medium">{article.comments ?? 0}</span>
            </div>

            <div
              className="flex items-center gap-1 text-xs text-gray-500 transition-colors"
              style={{ '&:hover': { color: '#5755FE' } }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="font-medium">{shareCount}</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <Sparkles
                className="w-3.5 h-3.5"
                style={{ color: '#5755FE80' }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: '#5755FE' }}
              >
                Premium
              </span>
            </div>
          </div> */}
        </div>
      </article >
    </>
  );
};

export default ArticleCard;
