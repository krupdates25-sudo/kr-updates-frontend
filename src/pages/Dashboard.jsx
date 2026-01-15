import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import ArticleCard from '../components/common/ArticleCard';
import CompactArticleRowCard from '../components/common/CompactArticleRowCard';
import WideArticleRowCard from '../components/common/WideArticleRowCard';
import EducationCarousel from '../components/common/EducationCarousel';
// import PostModal from '../components/common/PostModal'; // Commented out - posts now navigate directly to details page
import { useAuth } from '../contexts/AuthContext';
import { LoadingSkeleton } from '../components/common/LoadMoreButton';
import { useSocket } from '../contexts/SocketContext';
import AdContainer from '../components/common/AdContainer';
import BreakingNewsBanner from '../components/common/BreakingNewsBanner';
import { useSettings } from '../contexts/SettingsContext';
import { setHomepageSEO } from '../utils/seo';

import usePagination from '../hooks/usePagination';
import {
  Plus,
  Facebook,
  Youtube,
  Instagram,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import postService from '../services/postService';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('feed');
  const [sortBy, setSortBy] = useState('latest');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTag, setActiveTag] = useState(null);
  const breakingRef = useRef(null);
  const hasUserScrolledRef = useRef(false);
  const [breakingInView, setBreakingInView] = useState(true);
  const [breakingStory, setBreakingStory] = useState(null);
  const { joinPost, leavePost, socket, connected } = useSocket();
  const isAuthenticated = !!user;
  // PostModal removed - posts now navigate directly to details page
  // const [selectedPostId, setSelectedPostId] = useState(null);
  // const [selectedPost, setSelectedPost] = useState(null);
  // const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Refresh user data when component mounts to get latest permissions
  // Removed automatic refresh to prevent multiple API calls
  // Profile is already loaded from AuthContext on app initialization

  // Set SEO meta tags for homepage
  useEffect(() => {
    setHomepageSEO();
  }, []);

  useEffect(() => {
    if (location.state?.filterCategory) {
      setFilterBy(location.state.filterCategory);
      // Clear the state to prevent re-filtering on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

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

    // Admin can always create posts
    if (user.role === 'admin') {
      return true;
    }

    // For moderators and users, check canPublish permission
    if (user.role === 'moderator' || user.role === 'user') {
      const canPublish = user.canPublish === true;
      return canPublish;
    }
    return false;
  }, [user]);

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
          description: post.excerpt || '',
          // Keep both `featuredImage` and `image` for compatibility across card components.
          // IMPORTANT: do NOT generate random URLs here (it causes re-downloads + layout jank).
          featuredImage: post.featuredImage,
          image: post.featuredImage?.url || undefined,
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
          readTime: `${Math.max(1, Number(post.readingTime || 0) || 0) || 3} min read`,
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
              limit: params.limit || 20,
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
    limit: 20,
    dependencies: [activeTab],
    transformData: transformArticleData,
  });

  // Infinite scroll sentinel (auto-load older posts)
  const loadMoreSentinelRef = useRef(null);

  // Avoid auto-loading page 2 immediately on first paint (common cause of "slow even for 8 posts").
  // We only start auto-loading after the user actually scrolls.
  useEffect(() => {
    const onScroll = () => {
      if (hasUserScrolledRef.current) return;
      if (window.scrollY > 50) {
        hasUserScrolledRef.current = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!loadMoreSentinelRef.current) return;
    if (activeTab !== 'feed') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!hasUserScrolledRef.current) return;
        if (loading || loadingMore) return;
        if (!hasMore) return;
        loadMore();
      },
      { root: null, rootMargin: '200px 0px', threshold: 0.05 }
    );

    observer.observe(loadMoreSentinelRef.current);
    return () => observer.disconnect();
  }, [activeTab, hasMore, loadMore, loading, loadingMore]);

  // Join/leave post rooms for real-time updates (only for authenticated users)
  useEffect(() => {
    if (!isAuthenticated || !articles || articles.length === 0) return;
    
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
  }, [articles, joinPost, leavePost, isAuthenticated]);

  // Listen for real-time updates on posts (likes, comments, shares, trending status) - only for authenticated users
  useEffect(() => {
    if (!isAuthenticated || !socket || !connected) return;
    
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
  }, [socket, connected, activeTab, refresh, isAuthenticated]);

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

    // Optional tag filter (keeps breaking/recommended sections unchanged)
    const tagFiltered = filtered.filter((article) => {
      if (!activeTag) return true;
      const tags = Array.isArray(article.tags) ? article.tags : [];
      return tags.some(
        (t) => String(t).toLowerCase() === String(activeTag).toLowerCase()
      );
    });

    // Sort articles
    return [...tagFiltered].sort((a, b) => {
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
  }, [articles, filterBy, sortBy, activeTag]);

  const topTags = useMemo(() => {
    // Only show on main feed for now
    if (activeTab !== 'feed') return [];
    const counts = new Map();
    for (const a of articles) {
      const tags = Array.isArray(a.tags) ? a.tags : [];
      for (const t of tags) {
        const key = String(t || '').trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [articles, activeTab]);

  const educationPosts = useMemo(() => {
    const isEducation = (a) => {
      const cat = String(a.category || '').toLowerCase();
      if (cat === 'education' || cat.includes('education')) return true;
      const tags = Array.isArray(a.tags) ? a.tags : [];
      return tags.some((t) => String(t || '').toLowerCase() === 'education');
    };

    return [...articles]
      .filter(isEducation)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 4);
  }, [articles]);

  const followProfiles = useMemo(() => {
    const profiles = Array.isArray(settings?.socialProfiles)
      ? settings.socialProfiles
      : [];

    // Backward compat (should rarely happen because backend now backfills)
    const derived =
      profiles.length > 0
        ? profiles
        : [
            {
              platform: 'youtube',
              url: settings?.socialLinks?.youtube || 'https://www.youtube.com/',
              enabled: true,
              placements: ['dashboard_follow'],
            },
            {
              platform: 'facebook',
              url: settings?.socialLinks?.facebook || 'https://www.facebook.com/',
              enabled: true,
              placements: ['dashboard_follow'],
            },
          ];

    return derived.filter(
      (p) =>
        p &&
        p.enabled &&
        typeof p.url === 'string' &&
        p.url.trim() &&
        Array.isArray(p.placements) &&
        p.placements.includes('dashboard_follow')
    );
  }, [settings]);

  const followLine = useMemo(() => {
    const names = followProfiles
      .map((p) => String(p.platform || '').toLowerCase())
      .map((p) => (p === 'youtube' ? 'YouTube' : p === 'facebook' ? 'Facebook' : p === 'instagram' ? 'Instagram' : p))
      .filter(Boolean);

    if (names.length === 0) return '';
    if (names.length === 1) return `Get daily updates on ${names[0]}`;
    if (names.length === 2) return `Get daily updates on ${names[0]} and ${names[1]}`;
    return `Get daily updates on ${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  }, [followProfiles]);

  // Content protection - prevent copying
  useEffect(() => {
    const hasClosest = (target) =>
      target && typeof target.closest === 'function';

    const handleContextMenu = (e) => {
      if (!hasClosest(e.target)) return;
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
      if (!hasClosest(e.target)) return;
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
      if (!hasClosest(e.target)) return;
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
      if (!hasClosest(e.target)) return;
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
      if (!hasClosest(e.target)) return;
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

  // Show a sticky mini breaking bar when the main breaking banner is scrolled out of view.
  useEffect(() => {
    if (activeTab !== 'feed') return;
    if (!breakingRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setBreakingInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(breakingRef.current);
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <PageLayout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      hideSidebar={!isAuthenticated}
      hideBottomNav={!isAuthenticated}
      headerProps={{
        topTags,
        activeTag,
        onTagSelect: (tag) => {
          setActiveTag((prev) =>
            prev && String(prev).toLowerCase() === String(tag).toLowerCase()
              ? null
              : tag
          );
        },
      }}
    >
      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Loading Skeleton for initial load */}
        {loading && <LoadingSkeleton />}

        {/* Sticky mini breaking subheader (only when banner not visible) */}
        {activeTab === 'feed' && !breakingInView && breakingStory?.title && (
          <div className="sticky top-14 sm:top-16 z-20 mb-3">
            <button
              onClick={() => {
                // Scroll to breaking section
                breakingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-[100%] bg-red-500 backdrop-blur border border-red-100  px-3 py-2 flex items-center gap-2 shadow-sm"
            >
              <span className="inline-flex items-center gap-2 text-gray-200 font-bold text-xs uppercase tracking-wider">
                <span className="relative inline-flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-300"
                    style={{ boxShadow: '0 0 10px rgba(247, 245, 245, 0.8)' }}
                  />
                </span>
                Breaking
              </span>
              <span className="text-sm font-semibold text-gray-200 truncate">
                {breakingStory.title}
              </span>
            </button>
          </div>
        )}

        {/* Breaking News Banner - Show at top of feed */}
        {activeTab === 'feed' && (
          <div ref={breakingRef}>
            <BreakingNewsBanner onCurrentStoryChange={setBreakingStory} />
          </div>
        )}

        {/* Top Ad - Always show */}
        <div className="mb-4 sm:mb-6 w-full">
          <AdContainer
            position="top"
            postIndex={0}
            className="w-full"
          />
        </div>

        {/* Articles */}
        {!loading && filteredAndSortedArticles.length > 0 && (
          <>
            {/* Mobile: compact list */}
            <div className="sm:hidden space-y-3">
              {filteredAndSortedArticles.map((article) => (
                <CompactArticleRowCard key={article.id} article={article} />
              ))}
            </div>

            {/* Website (tablet/desktop): image-left/content-right row cards in a 2-column grid */}
            <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAndSortedArticles.map((article) => (
                <WideArticleRowCard key={article.id} article={article} />
              ))}
            </div>

                {/* Extra Sections (real content + modern cards) */}
                <div className="mt-6 sm:mt-10 space-y-6">
                  {/* Education (band background without viewport overflow) */}
                  <section className="-mx-3 sm:-mx-4 md:-mx-6 border-y border-blue-100 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 py-5 sm:py-7">
                    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
                      {/* OUTER header */}
                      <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
                        <div className="min-w-0">
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                            Education Updates
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600">
                            Latest exams, results, admissions & scholarships
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/explore?category=education')}
                          className="shrink-0 text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                          View all
                        </button>
                      </div>

                      {/* Inner container (clean white for cards) */}
                      <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur p-3 sm:p-4 shadow-sm">

                    {educationPosts.length > 0 ? (
                      <EducationCarousel posts={educationPosts} />
                    ) : (
                      <div className="text-sm text-gray-600">
                        No education posts yet. Seed posts and refresh.
                      </div>
                    )}
                      </div>
                    </div>
                  </section>

                  {/* Follow */}
                  {followProfiles.length > 0 && (
                    <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          Follow KRUPDATES
                        </h3>
                        <p className="text-sm text-gray-600">
                          {followLine || 'Get daily updates'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followProfiles.map((p) => {
                          const platform = String(p.platform || '').toLowerCase();
                          if (platform === 'youtube') {
                            return (
                              <a
                                key="youtube"
                                href={p.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Youtube className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-base font-extrabold text-gray-900">
                                      YouTube
                                    </p>
                                    <p className="text-sm text-gray-600 leading-snug">
                                      Subscribe for video updates and breaking clips
                                    </p>
                                    <p className="mt-2 inline-flex items-center text-sm font-semibold text-red-700 group-hover:text-red-800">
                                      Subscribe →
                                    </p>
                                  </div>
                                </div>
                              </a>
                            );
                          }

                          if (platform === 'facebook') {
                            return (
                              <a
                                key="facebook"
                                href={p.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Facebook className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-base font-extrabold text-gray-900">
                                      Facebook
                                    </p>
                                    <p className="text-sm text-gray-600 leading-snug">
                                      Follow for daily posts, reels, and community updates
                                    </p>
                                    <p className="mt-2 inline-flex items-center text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                                      Follow →
                                    </p>
                                  </div>
                                </div>
                              </a>
                            );
                          }

                          if (platform === 'instagram') {
                            return (
                              <a
                                key="instagram"
                                href={p.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Instagram className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-base font-extrabold text-gray-900">
                                      Instagram
                                    </p>
                                    <p className="text-sm text-gray-600 leading-snug">
                                      Follow for photos, reels, and daily updates
                                    </p>
                                    <p className="mt-2 inline-flex items-center text-sm font-semibold text-pink-700 group-hover:text-pink-800">
                                      Follow →
                                    </p>
                                  </div>
                                </div>
                              </a>
                            );
                          }

                          return null;
                        })}
                      </div>
                    </section>
                  )}
                </div>

                {/* Infinite scroll sentinel */}
                {activeTab === 'feed' && (
                  <div className="pt-6">
                    <div ref={loadMoreSentinelRef} className="h-8" />
                    {loadingMore && (
                      <div className="text-center text-sm text-gray-500">
                        Loading more…
                      </div>
                    )}
                    {!!error && (
                      <div className="text-center text-sm text-red-600 mt-3">
                        Failed to load more posts.
                        <button
                          onClick={refresh}
                          className="ml-2 font-semibold text-blue-700 hover:text-blue-800"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    {!hasMore && loadedCount > 0 && (
                      <div className="text-center text-sm text-gray-400 mt-3">
                        You’re all caught up.
                      </div>
                    )}
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
