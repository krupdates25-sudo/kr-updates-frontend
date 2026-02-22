import { Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import postService from '../../services/postService';

const CompactArticleRowCard = ({ article }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-row"
      onClick={handleCardClick}
    >
      {/* Image on Left - Smaller for compact view */}
      {imageUrl && (
        <div className="w-24 sm:w-28 aspect-video flex-shrink-0 overflow-hidden bg-gray-100">
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
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop&auto=format';
              }}
            />
          )}
        </div>
      )}

      {/* Content on Right */}
      <div className="flex-1 flex flex-col p-3 min-w-0">
        {/* Category */}
        {category && (
          <span className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full mb-1.5 w-fit">
            {category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Description - Shorter for compact view */}
        {description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-1 flex-1">
            {description}
          </p>
        )}

        {/* Metadata - Compact */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
          <div className="flex items-center gap-2">
            {date && (
              <span>{formatDate(date)}</span>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{readTime}</span>
            </div>
          </div>
          {/* Admin Delete Button */}
          {user?.role === 'admin' && (
            <button
              onClick={handleDeletePost}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
              title="Delete post"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default CompactArticleRowCard;
