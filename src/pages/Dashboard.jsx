import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import ArticleCard from '../components/common/ArticleCard';
import PostModal from '../components/common/PostModal';
import RateLimitMonitor from '../components/common/RateLimitMonitor';
import LoadMoreButton, {
  LoadingSkeleton,
} from '../components/common/LoadMoreButton';
import { useSocket } from '../contexts/SocketContext';
import AdContainer from '../components/common/AdContainer';

import usePagination from '../hooks/usePagination';
import {
  Filter,
  SortAsc,
  Plus,
  Search,
  Clock,
  Users,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import postService from '../services/postService';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [sortBy, setSortBy] = useState('latest');
  const [filterBy, setFilterBy] = useState('all');
  const { joinPost, leavePost } = useSocket();
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Refresh user data when component mounts to get latest permissions
  useEffect(() => {
    if (user) {
      console.log('🔄 Dashboard: Refreshing user profile on mount');
      refreshProfile().catch(console.warn);
    }
  }, [user, refreshProfile]);

  // Handle search navigation from Header
  useEffect(() => {
    console.log('Dashboard - Location state changed:', location.state);

    if (location.state?.openPostModal && location.state?.postId) {
      console.log(
        'Dashboard - Opening post modal for ID:',
        location.state.postId
      );
      setSelectedPostId(location.state.postId);
      setIsPostModalOpen(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true });
    }

    if (location.state?.filterCategory) {
      setFilterBy(location.state.filterCategory);
      // Clear the state to prevent re-filtering on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Handle custom event for opening post modal when already on dashboard
  useEffect(() => {
    const handleOpenPostModal = (event) => {
      console.log('Dashboard - Opening modal for post:', event.detail.postId);
      setSelectedPostId(event.detail.postId);
      setSelectedPost(event.detail.post);
      setIsPostModalOpen(true);
    };

    const handleSetCategoryFilter = (event) => {
      setFilterBy(event.detail.category);
    };

    window.addEventListener('openPostModal', handleOpenPostModal);
    window.addEventListener('setCategoryFilter', handleSetCategoryFilter);

    return () => {
      window.removeEventListener('openPostModal', handleOpenPostModal);
      window.removeEventListener('setCategoryFilter', handleSetCategoryFilter);
    };
  }, []);

  // Debug modal state
  console.log('Dashboard - Modal state:', { isPostModalOpen, selectedPostId });

  // Check if user can create posts
  const canCreatePosts = useMemo(() => {
    if (!user) return false;

    console.log('🔍 Dashboard Permission check - User:', user);
    console.log('🔍 Dashboard Permission check - Role:', user.role);
    console.log('🔍 Dashboard Permission check - canPublish:', user.canPublish);
    console.log(
      '🔍 Dashboard Permission check - canPublish type:',
      typeof user.canPublish
    );

    // Admin can always create posts
    if (user.role === 'admin') {
      console.log('🔍 Dashboard Admin user - can create posts');
      return true;
    }

    // For moderators and users, check canPublish permission
    if (user.role === 'moderator' || user.role === 'user') {
      const canPublish = user.canPublish === true;
      console.log(
        '🔍 Dashboard Non-admin user - canPublish check result:',
        canPublish
      );
      return canPublish;
    }

    console.log('🔍 Dashboard Unknown role - cannot create posts');
    return false;
  }, [user]);

  console.log('Dashboard - canCreatePosts:', canCreatePosts);

  // Transform API data to match component structure
  const transformArticleData = useCallback((posts) => {
    // Handle case where posts might not be an array
    if (!Array.isArray(posts)) {
      console.warn('Posts data is not an array:', posts);
      return [];
    }

    return posts
      .map((post) => {
        // Ensure we have author data before transforming
        if (!post.author || !post.author._id) {
          console.warn('Post missing author data:', post._id, post.author);
          return null; // Skip posts without proper author data
        }

        return {
          _id: post._id, // Keep the MongoDB ID for API calls
          id: post._id,
          title: post.title,
          description: post.excerpt || post.content?.substring(0, 150) + '...',
          image:
            post.featuredImage?.url ||
            `https://images.unsplash.com/photo-${Math.floor(
              Math.random() * 1000000
            )}?w=800&h=400&fit=crop`,
          author: {
            _id: post.author._id, // IMPORTANT: This should be the USER ID, not post ID
            id: post.author._id, // Alternative ID field
            name: `${post.author.firstName} ${post.author.lastName}`,
            firstName: post.author.firstName,
            lastName: post.author.lastName,
            title: post.author.title || 'Content Creator',
            username: post.author.username,
            profileImage: post.author.profileImage,
            role: post.author.role,
          },
          tags: post.tags || [],
          category: post.category,
          readTime: `${Math.ceil(
            (post.content?.length || 500) / 200
          )} min read`,
          publishedAt: post.publishedAt,
          likeCount: post.likeCount ?? 0, // Use nullish coalescing to preserve 0 values
          likes: post.likeCount ?? 0, // Keep for backward compatibility
          isLiked: post.isLiked || false, // Include like status from backend
          comments: post.commentCount ?? 0,
          shares: post.shareCount ?? 0,
          slug: post.slug,
        };
      })
      .filter(Boolean); // Remove null entries (posts without author data)
  }, []);

  // Fetch function for pagination
  const fetchPosts = useCallback(
    async (params) => {
      // Debug logging for admins
      if (import.meta.env.DEV) {
        console.log(
          `🔍 API Call: Fetching ${activeTab} posts with params:`,
          params
        );
      }

      try {
        let response;

        switch (activeTab) {
          case 'trending':
            response = await postService.getTrendingPosts();
            break;
          case 'javascript':
          case 'react':
          case 'nodejs':
          case 'python':
            response = await postService.getPostsByCategory(activeTab);
            break;
          default:
            response = await postService.getAllPosts(params);
        }

        // The postService returns the API response object which contains:
        // { statusCode, data: { data: [...], pagination, totalCount, hasMore }, message, success }

        // For getAllPosts (paginated), check if response.data has nested structure
        if (
          (activeTab === 'feed' ||
            !['trending', 'javascript', 'react', 'nodejs', 'python'].includes(
              activeTab
            )) &&
          response.data &&
          response.data.totalCount !== undefined
        ) {
          return {
            data: response.data.data || [],
            totalCount: response.data.totalCount,
            hasMore: response.data.hasMore,
            pagination: response.data.pagination || {
              page: params.page || 1,
              limit: params.limit || 8,
              totalCount: response.data.totalCount,
              hasMore: response.data.hasMore,
            },
          };
        }

        // For other endpoints (trending, categories), treat as single page
        if (response && response.data && Array.isArray(response.data)) {
          return {
            data: response.data,
            totalCount: response.data.length,
            hasMore: false, // These endpoints typically return all available items
            pagination: {
              page: 1,
              limit: response.data.length,
              totalCount: response.data.length,
              hasMore: false,
            },
          };
        }

        // If response.data is not an array, return empty result
        return {
          data: [],
          totalCount: 0,
          hasMore: false,
          pagination: {
            page: 1,
            limit: 0,
            totalCount: 0,
            hasMore: false,
          },
        };
      } catch (error) {
        console.error('Error fetching articles:', error);

        // Check if it's a rate limit error
        if (error.response?.status === 429) {
          console.warn(
            '🚨 Rate limit exceeded! Try refreshing less frequently.'
          );
        }

        throw error;
      }
    },
    [activeTab]
  );

  // Use pagination hook with 8 posts per page
  const {
    data: articles,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    loadedCount,
    loadMore,
    refresh,
  } = usePagination(fetchPosts, {
    limit: 8,
    dependencies: [activeTab],
    transformData: transformArticleData,
  });

  // Join/leave post rooms for real-time updates
  useEffect(() => {
    if (articles && articles.length > 0) {
      // Join rooms for all visible posts
      articles.forEach((article) => {
        if (article._id) {
          joinPost(article._id);
        }
      });

      // Cleanup: leave rooms when articles change
      return () => {
        articles.forEach((article) => {
          if (article._id) {
            leavePost(article._id);
          }
        });
      };
    }
  }, [articles, joinPost, leavePost]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'feed':
        return 'My Feed';
      case 'trending':
        return 'Trending';
      case 'bookmarks':
        return 'Bookmarks';
      case 'history':
        return 'History';
      case 'following':
        return 'Following';
      case 'javascript':
        return 'JavaScript';
      case 'react':
        return 'React';
      case 'nodejs':
        return 'Node.js';
      case 'python':
        return 'Python';
      default:
        return 'Dashboard';
    }
  };

  const filteredAndSortedArticles = useMemo(() => {
    // Filter articles
    const filtered = articles.filter((article) => {
      if (filterBy === 'all') return true;
      return article.category.toLowerCase() === filterBy.toLowerCase();
    });

    // Sort articles
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.publishedAt) - new Date(a.publishedAt);
        case 'popular':
          return b.likes - a.likes;
        case 'comments':
          return b.comments - a.comments;
        default:
          return 0;
      }
    });
  }, [articles, filterBy, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main Content Area */}
      <div className="lg:ml-72 relative z-10">
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />

        {/* Main Content */}
        <main className="min-h-screen">
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {getPageTitle()}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Discover the latest articles and insights from the community
                  </p>
                </div>

                {/* New Post Button */}
                {canCreatePosts && (
                  <button
                    onClick={() => navigate('/new-post')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Post</span>
                  </button>
                )}

                {/* Filters and Sort */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="relative">
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value)}
                      className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      <option value="development">Development</option>
                      <option value="design">Design</option>
                      <option value="industry">Industry</option>
                      <option value="security">Security</option>
                      <option value="data science">Data Science</option>
                    </select>
                    <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" />
                  </div>

                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="latest">Latest</option>
                      <option value="popular">Most Popular</option>
                      <option value="comments">Most Discussed</option>
                    </select>
                    <SortAsc className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Articles Section with Load More */}
          <div>
            {/* Loading Skeleton for initial load */}
            {loading && <LoadingSkeleton />}

            {/* Articles Grid */}
            {!loading && filteredAndSortedArticles.length > 0 && (
              <div className="px-6 py-8">
                {/* Ads Banner at top */}
                <div className="mb-4 sm:mb-8 px-2 sm:px-0">
                  <AdContainer
                    position="top"
                    postIndex={0}
                    className="col-span-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredAndSortedArticles.map((article, index) => (
                    <div
                      key={article.id}
                      className="group animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ArticleCard
                        article={article}
                        onLike={(postId) => {
                          // Handle like functionality
                          console.log('Like post:', postId);
                        }}
                        onBookmark={(postId) => {
                          // Handle bookmark functionality
                          console.log('Bookmark post:', postId);
                        }}
                        onShare={(postId) => {
                          // Handle share functionality
                          console.log('Share post:', postId);
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Ads Banner at bottom */}
                {filteredAndSortedArticles.length > 6 && (
                  <div className="mt-4 sm:mt-6 px-2 sm:px-0">
                    <AdContainer
                      position="bottom"
                      postIndex={filteredAndSortedArticles.length}
                      className="col-span-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Load More Button */}
            <LoadMoreButton
              loading={loading}
              loadingMore={loadingMore}
              hasMore={hasMore}
              error={error}
              totalCount={totalCount}
              loadedCount={loadedCount}
              onLoadMore={loadMore}
              onRetry={refresh}
            />

            {/* Empty State */}
            {!loading &&
              filteredAndSortedArticles.length === 0 &&
              articles.length === 0 && (
                <div className="text-center py-16 px-6">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-4xl">📝</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No articles found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Try adjusting your filters or check back later for new
                    content.
                  </p>
                </div>
              )}
          </div>
        </main>
      </div>

      {/* Rate Limit Monitor for Admins */}
      <RateLimitMonitor />

      {/* Post Modal for search results */}
      {isPostModalOpen && selectedPostId && (
        <PostModal
          isOpen={isPostModalOpen}
          onClose={() => {
            console.log('Dashboard - Closing post modal');
            setIsPostModalOpen(false);
            setSelectedPostId(null);
            setSelectedPost(null);
          }}
          postId={selectedPostId}
          post={selectedPost}
        />
      )}
    </div>
  );
};

export default Dashboard;
