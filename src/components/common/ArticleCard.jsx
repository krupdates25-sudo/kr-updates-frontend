import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Clock,
  TrendingUp,
  User,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/postService';
import useLike from '../../hooks/useLike';

const ArticleCard = ({
  article,
  onLike,
  onBookmark,
  onShare,
  showRank,
  showTrendingScore,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareCount, setShareCount] = useState(
    article?.shareCount ?? article?.shares ?? 0
  );
  const { socket } = useSocket();
  const { user } = useAuth();

  // Use the custom like hook with confetti effects
  const {
    isLiked,
    likeCount,
    setLikeCount,
    isLoading,
    handleLike: defaultHandleLike,
  } = useLike(
    article?._id || article?.id,
    article?.isLiked || false, // Use the isLiked status from backend
    article?.likeCount ?? article?.likes ?? 0
  );

  // Use passed onLike or default like handler
  const handleLikeClick = onLike || defaultHandleLike;

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    if (!socket || !article) return;

    const postId = article._id || article.id;

    const handleLikeUpdate = (data) => {
      if (data.postId === postId) {
        setLikeCount(data.likeCount);
      }
    };

    const handleShareUpdate = (data) => {
      if (data.postId === postId) {
        setShareCount(data.shareCount);
      }
    };

    // Register event listeners
    socket.on('likeUpdate', handleLikeUpdate);
    socket.on('shareUpdate', handleShareUpdate);

    // Cleanup event listeners
    return () => {
      socket.off('likeUpdate', handleLikeUpdate);
      socket.off('shareUpdate', handleShareUpdate);
    };
  }, [socket, article._id, article.id, setLikeCount]);

  const handleCardClick = () => {
    // Dispatch event to open modal in parent component
    const openModalEvent = new CustomEvent('openPostModal', {
      detail: {
        postId: article._id || article.id,
        post: article,
      },
    });
    window.dispatchEvent(openModalEvent);
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    if (onBookmark) {
      onBookmark();
    } else {
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    if (onShare) {
      onShare();
    } else {
      // Default share functionality
    }
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation(); // Prevent opening the modal when clicking author

    // Simple debug to verify we have the correct author ID
    console.log('Author ID:', article.author?._id || article.author?.id);
    console.log('Post ID:', article._id || article.id);
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
        className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-[500px] flex flex-col hover:-translate-y-1"
        style={{ borderColor: '#5755FE20' }}
        onClick={handleCardClick}
      >
        {/* Featured Media (Image or Video) */}
        {(article.featuredImage?.url ||
          article.featuredVideo?.url ||
          article.image) && (
          <div
            className="h-48 overflow-hidden flex-shrink-0 relative"
            style={{ backgroundColor: '#5755FE08' }}
          >
            {article.featuredVideo?.url ? (
              <video
                src={article.featuredVideo.url}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}

        {/* Placeholder for posts without media */}
        {!article.featuredImage?.url &&
          !article.featuredVideo?.url &&
          !article.image && (
            <div
              className="h-48 overflow-hidden flex-shrink-0 relative flex items-center justify-center"
              style={{ backgroundColor: '#5755FE08' }}
            >
              <div className="text-center p-6">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#5755FE20' }}
                >
                  <svg
                    className="w-8 h-8"
                    style={{ color: '#5755FE' }}
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
                <p className="text-sm font-medium" style={{ color: '#5755FE' }}>
                  {article.category || 'Article'}
                </p>
                <p className="text-xs text-gray-500 mt-1">No image available</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          )}

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Rank and Trending Score */}
          {(showRank || showTrendingScore) && (
            <div className="flex items-center justify-between mb-3">
              {showRank && (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                    #{showRank}
                  </div>
                </div>
              )}
              {showTrendingScore && (
                <div className="flex items-center space-x-1 text-xs text-orange-600">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">
                    {Math.round(showTrendingScore)} pts
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {article.tags?.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 text-xs font-medium rounded-full hover:bg-purple-100 transition-colors cursor-pointer"
                style={{ backgroundColor: '#5755FE15', color: '#5755FE' }}
              >
                #{tag}
              </span>
            ))}
            {article.tags?.length > 3 && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{article.tags.length - 3}
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 transition-colors"
            style={{ '&:hover': { color: '#5755FE' } }}
          >
            {article.title}
          </h2>

          {/* Description */}
          {article.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed text-sm flex-1 max-w-prose mx-auto">
              {article.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" style={{ color: '#5755FE' }} />
                <span>{article.readTime || '5 min read'}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp
                  className="w-3.5 h-3.5"
                  style={{ color: '#5755FE' }}
                />
                <span>{formatDate(article.publishedAt || new Date())}</span>
              </div>
            </div>

            {article.category && (
              <span
                className="px-2 py-1 text-xs font-semibold rounded-full"
                style={{ backgroundColor: '#5755FE20', color: '#5755FE' }}
              >
                {article.category}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end mt-auto">
            {/* Action buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleLikeClick}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isLiked
                    ? 'text-red-500 bg-red-50 hover:bg-red-100 shadow-sm'
                    : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} ${
                    isLoading ? 'animate-pulse' : ''
                  }`}
                />
              </button>

              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isBookmarked
                    ? 'shadow-sm'
                    : 'text-gray-500 hover:bg-purple-50'
                }`}
                style={
                  isBookmarked
                    ? { color: '#5755FE', backgroundColor: '#5755FE15' }
                    : {}
                }
              >
                <Bookmark
                  className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`}
                />
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg text-gray-500 hover:bg-purple-50 transition-all duration-200"
                style={{ '&:hover': { color: '#5755FE' } }}
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Admin delete button */}
              {user?.role === 'admin' && (
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Engagement stats */}
          <div
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

            {/* Quality indicator */}
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
          </div>
        </div>
      </article>
    </>
  );
};

export default ArticleCard;
