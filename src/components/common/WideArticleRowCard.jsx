import { Clock, Trash2, Pencil, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/postService';

const WideArticleRowCard = ({ article }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCardClick = () => {
    // Navigate directly to post details page using ObjectId (faster)
    const postId = article._id || article.id;
    if (!postId) {
      console.error('No valid post ID found:', article);
      return;
    }
    navigate(`/post/${postId}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    const postId = article._id || article.id;
    navigate(`/edit-post/${postId}`);
  };

  const handleDeletePost = async (e) => {
    e.stopPropagation(); // Prevent card click

    if (!user || user.role !== 'admin') {
      alert('Only admins can delete posts.');
      return;
    }

    const postId = article._id || article.id;
    if (!postId) {
      console.error('No valid post ID found:', article);
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${article.title}"? This action cannot be undone.`
    );

    if (!isConfirmed) return;

    try {
      await postService.deletePost(postId);
      alert('Post deleted successfully');
      // Refresh the page to show updated list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const imageUrl = article.featuredImage?.url || article.image;
  const title = article.title || '';
  const description = article.excerpt || article.description || article.subheading || '';
  const category = article.category || '';
  const readTime = article.readTime || article.readingTime || '5 min read';
  const date = article.publishedAt || article.createdAt || article.date;

  return (
    <article
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-row h-full"
      onClick={handleCardClick}
    >
      {/* Image on Left */}
      {imageUrl && (
        <div className="w-32 sm:w-40 md:w-48 aspect-video flex-shrink-0 overflow-hidden bg-gray-100">
          {article.featuredVideo?.url ? (
            <video
              src={article.featuredVideo.url}
              className="w-full h-full object-cover"
              muted
              playsInline
              poster={article.featuredVideo.thumbnail || imageUrl}
            />
          ) : (
            <img
              src={imageUrl}
              alt={article.featuredImage?.alt || title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
              onError={(e) => {
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
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Video
            </div>
          )}
        </div>
      )}

      {/* Content on Right */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 min-w-0">
        {/* Category */}
        {category && (
          <span className="inline-block px-2 py-0.5 bg-[var(--color-primary)] text-white text-xs font-medium rounded-full mb-2 w-fit">
            {category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
            {description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
          <div className="flex items-center gap-3">
            {date && (
              <span>{formatDate(date)}</span>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{readTime}</span>
            </div>
            {article.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-500" />
                <span>{article.location}</span>
              </div>
            )}
            {(article.viewCount !== undefined || article.views !== undefined) && (
              <span>{article.viewCount || article.views || 0} views</span>
            )}
          </div>
          {/* Admin buttons */}
          {user?.role === 'admin' && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleEdit}
                className="p-1.5 text-[var(--color-primary)] hover:text-[var(--color-accent)] hover:bg-gray-100 rounded-full transition-colors"
                title="Edit post"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={handleDeletePost}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                title="Delete post"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default WideArticleRowCard;
