import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import ArticleCard from '../components/common/ArticleCard';
// import PostModal from '../components/common/PostModal'; // Commented out - posts now navigate directly to details page
import { useAuth } from '../contexts/AuthContext';
import { LoadingSkeleton } from '../components/common/LoadMoreButton';
import { useSocket } from '../contexts/SocketContext';
import AdContainer from '../components/common/AdContainer';
import BreakingNewsBanner from '../components/common/BreakingNewsBanner';

import usePagination from '../hooks/usePagination';
import {
  Plus,
  Search,
  Clock,
  Users,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import postService from '../services/postService';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [sortBy, setSortBy] = useState('latest');
  const [filterBy, setFilterBy] = useState('all');
  const { joinPost, leavePost, socket, connected } = useSocket();
  // PostModal removed - posts now navigate directly to details page
  // const [selectedPostId, setSelectedPostId] = useState(null);
  // const [selectedPost, setSelectedPost] = useState(null);
  // const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Refresh user data when component mounts to get latest permissions
  // Removed automatic refresh to prevent multiple API calls
  // Profile is already loaded from AuthContext on app initialization

  // PostModal removed - posts now navigate directly to details page
  // Handle search navigation from Header
  useEffect(() => {
    console.log('Dashboard - Location state changed:', location.state);

    // Navigate to post details page if postId is provided
    if (location.state?.postId) {
      const postSlug = location.state.postSlug || String(location.state.postId || '');
      if (postSlug) {
        navigate(`/post/${postSlug}`, { replace: true });
      }
      return;
    }

    if (location.state?.filterCategory) {
      setFilterBy(location.state.filterCategory);
      // Clear the state to prevent re-filtering on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Handle custom event for category filter
  useEffect(() => {
    const handleSetCategoryFilter = (event) => {
      setFilterBy(event.detail.category);
    };

    window.addEventListener('setCategoryFilter', handleSetCategoryFilter);

    return () => {
      window.removeEventListener('setCategoryFilter', handleSetCategoryFilter);
    };
  }, []);

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

  // Listen for real-time updates on posts (likes, comments, shares, trending status)
  useEffect(() => {
    if (socket && connected) {
      const handlePostUpdate = (data) => {
        console.log('Post updated:', data);
        // Refresh posts when they're updated
        if (activeTab === 'feed' || activeTab === 'trending') {
          refresh();
        }
      };

      const handlePostCreated = (data) => {
        console.log('New post created:', data);
        // Refresh posts when new ones are created
        if (activeTab === 'feed') {
          refresh();
        }
      };

      const handleTrendingUpdate = (data) => {
        console.log('Trending posts updated:', data);
        // Refresh trending posts
        if (activeTab === 'trending') {
          refresh();
        }
      };

      socket.on('postUpdated', handlePostUpdate);
      socket.on('postCreated', handlePostCreated);
      socket.on('trendingUpdated', handleTrendingUpdate);

      return () => {
        socket.off('postUpdated', handlePostUpdate);
        socket.off('postCreated', handlePostCreated);
        socket.off('trendingUpdated', handleTrendingUpdate);
      };
    }
  }, [socket, connected, activeTab, refresh]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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

  // Content protection - prevent copying
  useEffect(() => {
    const handleContextMenu = (e) => {
      // Allow context menu on buttons and interactive elements
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      // Prevent context menu on article content
      if (e.target.closest('[data-protected-content]')) {
        e.preventDefault();
        return false;
      }
    };

    const handleCopy = (e) => {
      // Allow copying from inputs and textareas
      if (e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      // Prevent copying from article content
      if (e.target.closest('[data-protected-content]')) {
        e.preventDefault();
        return false;
      }
    };

    const handleCut = (e) => {
      // Allow cutting from inputs and textareas
      if (e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      // Prevent cutting from article content
      if (e.target.closest('[data-protected-content]')) {
        e.preventDefault();
        return false;
      }
    };

    const handleSelectStart = (e) => {
      // Allow selection in inputs and textareas
      if (e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      // Prevent text selection on article content
      if (e.target.closest('[data-protected-content]')) {
        e.preventDefault();
        return false;
      }
    };

    const handleKeyDown = (e) => {
      // Prevent Ctrl+A (Select All), Ctrl+C (Copy), Ctrl+X (Cut) on article content
      if (e.target.closest('[data-protected-content]')) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'c' || e.key === 'x')) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <PageLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        {/* Loading Skeleton for initial load */}
        {loading && <LoadingSkeleton />}

        {/* Breaking News Banner - Show at top of feed */}
        {activeTab === 'feed' && <BreakingNewsBanner />}

        {/* Top Ad - Always show */}
        <div className="mb-4 sm:mb-6 w-full">
          <AdContainer
            position="top"
            postIndex={0}
            className="w-full"
          />
        </div>

        {/* Articles Grid */}
        {!loading && filteredAndSortedArticles.length > 0 && (
          <>
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
              data-protected-content
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
            >
                  {filteredAndSortedArticles.map((article, index) => (
                    <div
                      key={article.id}
                      className="group animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                      data-protected-content
                    >
                      <ArticleCard
                        article={article}
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

                {/* Middle Ad - Show after 4+ articles */}
                {filteredAndSortedArticles.length >= 4 && (
                  <div className="mt-6 sm:mt-8">
                    <AdContainer
                      position="middle"
                      postIndex={Math.floor(filteredAndSortedArticles.length / 2)}
                      className="w-full"
                    />
                  </div>
                )}

              </>
            )}

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
    </PageLayout>
  );
};

export default Dashboard;
