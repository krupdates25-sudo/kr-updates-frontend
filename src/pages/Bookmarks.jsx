import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  BookmarkX,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Calendar,
  User,
  Search,
  Filter,
} from 'lucide-react';
import postService from '../services/postService';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import BottomNavigation from '../components/layout/BottomNavigation';
// import PostModal from '../components/common/PostModal'; // Commented out - posts now navigate directly to details page
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Bookmarks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // PostModal removed - posts now navigate directly to details page
  // const [selectedPostId, setSelectedPostId] = useState(null);
  // const [selectedPost, setSelectedPost] = useState(null);
  // const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    fetchBookmarksFromAPI();
  }, [page, sortBy]);

  const fetchBookmarksFromAPI = async () => {
    try {
      setLoading(true);
      const response = await postService.getUserBookmarks(page, 20);

      if (page === 1) {
        setBookmarks(response.data.bookmarks || []);
      } else {
        setBookmarks((prev) => [...prev, ...(response.data.bookmarks || [])]);
      }

      setHasMore(response.data.pagination?.pages > page);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId) => {
    try {
      await postService.toggleBookmark(postId);
      setBookmarks((prev) => prev.filter((post) => post._id !== postId));
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await postService.toggleLike(postId);
      setBookmarks((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                isLiked: response.data.liked,
                likeCount: response.data.likeCount,
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleShare = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.origin + `/post/${post.slug || String(post._id || '')}`,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.origin + `/post/${post.slug || String(post._id || '')}`
        );
        alert('Link copied to clipboard!');
      }
      await postService.sharePost(post._id, 'native');
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePostClick = (post) => {
    // Navigate directly to post details page
    // Always use slug if available, otherwise use MongoDB _id (ensure it's a string)
    const postSlug = post.slug || String(post._id || post.id || '');
    if (!postSlug) {
      console.error('No valid post identifier found:', post);
      return;
    }
    navigate(`/post/${postSlug}`);
  };

  const filteredBookmarks = bookmarks.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'mostLiked':
        return (b.likeCount ?? 0) - (a.likeCount ?? 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-white relative pb-16 lg:pb-0">
        {/* Sidebar - Only visible on mobile for Admin/Moderator */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          activeTab="bookmarks"
        />

        {/* Main Content Area */}
        <div className={`relative z-10 ${shouldShowSidebarOnMobile ? 'lg:ml-72' : 'lg:ml-0'}`}>
          {/* Header */}
          <Header onSidebarToggle={handleSidebarToggle} />

          {/* Loading Content */}
          <main className="min-h-screen">
            <div className="px-6 py-6">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative pb-20 lg:pb-0">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        activeTab="bookmarks"
      />

      {/* Main Content Area */}
      <div className="relative z-10 lg:ml-72">
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />

        {/* Main Content */}
        <main className="min-h-screen">
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                    <Bookmark className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
                    My Bookmarks
                  </h1>
                  <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">
                    {bookmarks.length} saved{' '}
                    {bookmarks.length === 1 ? 'article' : 'articles'}
                  </p>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative">
                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                    <input
                      type="text"
                      placeholder="Search bookmarks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                    />
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="pl-8 sm:pl-10 pr-6 sm:pr-8 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="mostLiked">Most Liked</option>
                      <option value="title">Title A-Z</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {sortedBookmarks.length === 0 && !loading ? (
              <div className="text-center py-16">
                <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No bookmarks found' : 'No bookmarks yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Start bookmarking articles you want to read later'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedBookmarks.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer"
                    onClick={() => handlePostClick(post)}
                  >
                    {/* Featured Image */}
                    {post.featuredImage?.url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt || post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <div className="p-4 sm:p-5 md:p-6">
                      {/* Category & Date */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {post.category}
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(post.createdAt)}
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{post.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-4">
                          {/* Likes and Comments removed */}
                          {/* <button
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center space-x-1 text-sm transition-colors ${
                              post.isLiked
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-gray-600 hover:text-red-600'
                            }`}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                post.isLiked ? 'fill-current' : ''
                              }`}
                            />
                            <span>{post.likeCount ?? 0}</span>
                          </button>

                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.commentCount ?? 0}</span>
                          </div> */}

                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Eye className="h-4 w-4" />
                            <span>{post.viewCount ?? 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(post);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Share post"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBookmark(post._id);
                            }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove bookmark"
                          >
                            <BookmarkX className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && sortedBookmarks.length > 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - For all users on mobile */}
      <BottomNavigation />

      {/* Post Modal removed - posts now navigate directly to details page */}
      {/* {isPostModalOpen && selectedPostId && (
        <PostModal
          isOpen={isPostModalOpen}
          onClose={() => {
            setIsPostModalOpen(false);
            setSelectedPostId(null);
            setSelectedPost(null);
          }}
          postId={selectedPostId}
          post={selectedPost}
        />
      )} */}
    </div>
  );
};

export default Bookmarks;
