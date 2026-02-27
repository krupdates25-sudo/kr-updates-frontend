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
import { useLanguageLocation } from '../contexts/LanguageLocationContext';
import { setHomepageSEO } from '../utils/seo';

import usePagination from '../hooks/usePagination';
import {
  Plus,
  Facebook,
  Youtube,
  Instagram,
  Trophy,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import postService from '../services/postService';
import { getHindiSchedule, getStateNewsFeed } from '../services/bhaskarService';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const { location: currentLocation, setLocation } = useLanguageLocation();
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

  const [hindiSchedule, setHindiSchedule] = useState(null);
  const [hindiScheduleLoading, setHindiScheduleLoading] = useState(false);
  const [hindiScheduleError, setHindiScheduleError] = useState(null);

  const [bhaskarStateFeed, setBhaskarStateFeed] = useState(null);
  const [bhaskarStateLoading, setBhaskarStateLoading] = useState(false);
  const [bhaskarStateError, setBhaskarStateError] = useState(null);

  // Load Hindi schedule once for dashboard carousel
  useEffect(() => {
    if (hindiSchedule) return;
    let cancelled = false;
    const loadSchedule = async () => {
      setHindiScheduleLoading(true);
      setHindiScheduleError(null);
      try {
        const data = await getHindiSchedule();
        if (!cancelled) setHindiSchedule(data);
      } catch (e) {
        if (!cancelled) setHindiScheduleError(e.message || 'Unable to load Hindi match updates.');
      } finally {
        if (!cancelled) setHindiScheduleLoading(false);
      }
    };

    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [hindiSchedule]);

  // Load Bhaskar state-news feed (for filtered Hindi regional stories)
  useEffect(() => {
    if (bhaskarStateFeed) return;
    let cancelled = false;

    const loadStateFeed = async () => {
      setBhaskarStateLoading(true);
      setBhaskarStateError(null);
      try {
        const data = await getStateNewsFeed();
        if (!cancelled) setBhaskarStateFeed(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setBhaskarStateError(e.message || 'Unable to load Bhaskar state news.');
      } finally {
        if (!cancelled) setBhaskarStateLoading(false);
      }
    };

    loadStateFeed();
    return () => {
      cancelled = true;
    };
  }, [bhaskarStateFeed]);

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
          default: {
            response = await postService.getAllPosts({
              ...params,
              ...(currentLocation && currentLocation !== 'All' ? { location: currentLocation } : {}),
              // Backend optimization: avoid expensive countDocuments; backend computes hasMore via limit+1
              noCount: true,
            });
            break;
          }
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
    [activeTab, currentLocation]
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
    dependencies: [activeTab, currentLocation],
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

        {/* ── Match updates label ── */}
        <div className="mb-2 sm:mb-3 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.2em]">
            Match updates
          </span>
        </div>

        {/* ── English: T20 World Cup card (click-through to full scores page) ── */}
        <div
          onClick={() => navigate('/t20-worldcup')}
          className="mb-4 sm:mb-6 cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/t20-worldcup')}
        >
          <div className="bg-gradient-to-r from-[#0d1117] via-[#161b2e] to-[#1e2a4a] text-white px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden">
            {/* Decorative glows — no emoji */}
            <div className="absolute -top-8 right-8 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />
            {/* Subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '24px 24px' }}
            />

            {/* Left: icon + text */}
            <div className="relative flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
              {/* Trophy icon — lucide */}
              <div className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                  <p
                    className="text-xs sm:text-sm font-extrabold tracking-tight leading-snug"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    ICC Men's T20 World Cup
                  </p>
                  {/* Live pulse dot */}
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-white/60 font-medium">
                  T20 World Cup live scores, results & fixtures
                </p>
              </div>
            </div>

            {/* Right: compact button */}
            <div className="relative flex-shrink-0 flex items-center gap-1.5 bg-white/10 group-hover:bg-white/20 border border-white/15 transition-colors text-white text-[11px] sm:text-[12px] font-semibold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap">
              View scores
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* ── Hindi: match updates (carousel, minimal & modern) ── */}
        <div className="mb-4 sm:mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-800">
              हिंदी मैच अपडेट्स (ICC MT20 WC 2026)
            </p>
            {hindiScheduleLoading && (
              <span className="text-[10px] text-gray-400">Loading…</span>
            )}
          </div>
          {hindiScheduleError && (
            <p className="text-xs text-red-500">{hindiScheduleError}</p>
          )}

          {!hindiScheduleLoading && !hindiScheduleError && hindiSchedule && (
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-3 w-max min-w-full snap-x snap-mandatory pb-0.5">
                {[...hindiSchedule.upcoming.slice(0, 6), ...hindiSchedule.completed.slice(0, 4)].map((m) => {
                  const isCompleted = !!m.result;
                  const accent = isCompleted ? 'emerald' : 'indigo';
                  const badge = isCompleted ? 'Result' : 'Upcoming';
                  const primaryLine = m.result || m.status || '';

                  return (
                    <div
                      key={m.id}
                      className={`snap-start w-[320px] sm:w-[360px] rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden ${isCompleted ? 'border-emerald-100' : 'border-indigo-100'
                        }`}
                    >
                      <div className={`px-4 py-3 bg-gradient-to-br ${isCompleted ? 'from-emerald-50 via-white to-white' : 'from-indigo-50 via-white to-white'
                        }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-gray-900 leading-snug whitespace-normal break-words">
                              {m.matchNumber || 'Match'}
                            </p>
                            <p className="text-[12px] text-gray-600 mt-0.5 whitespace-normal break-words">
                              {m.venue}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${accent === 'emerald'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-indigo-100 text-indigo-700'
                              }`}
                          >
                            {badge}
                          </span>
                        </div>

                        {primaryLine && (
                          <p
                            className={`mt-3 text-[12px] font-semibold leading-snug whitespace-normal break-words ${accent === 'emerald' ? 'text-emerald-700' : 'text-indigo-700'
                              }`}
                          >
                            {primaryLine}
                          </p>
                        )}

                        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                          <span className="font-medium">{m.dateIST}</span>
                          <span className="font-extrabold text-gray-700">{m.timeIST}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Bhaskar state news (filtered by selected location) ── */}
        <div className="mb-4 sm:mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-800">
              Bhaskar state updates
            </p>
            {bhaskarStateLoading && (
              <span className="text-[10px] text-gray-400">Loading…</span>
            )}
          </div>

          {bhaskarStateError && (
            <p className="text-xs text-red-500">{bhaskarStateError}</p>
          )}

          {!bhaskarStateLoading && !bhaskarStateError && Array.isArray(bhaskarStateFeed) && (
            (() => {
              const block = currentLocation && currentLocation !== 'All'
                ? bhaskarStateFeed.find((b) => b.location === currentLocation)
                : null;
              const stories = block?.stories || [];
              if (!block) return null;
              if (!stories.length) {
                return <p className="text-[11px] text-gray-500">No Bhaskar stories for {block.location}.</p>;
              }
              const StoryCard = ({ story }) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => navigate(`/bhaskar/story/${story.id}`, { state: { story } })}
                  className="w-full text-left rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
                  title={story.title}
                >
                  <div className="flex gap-3 p-3">
                    <div className="w-28 h-20 sm:w-32 sm:h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {story.image ? (
                        <img
                          src={story.image}
                          alt={story.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-extrabold text-gray-900 leading-snug line-clamp-2">
                        {story.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {block.location}
                      </p>
                    </div>
                  </div>
                </button>
              );

              return (
                <>
                  {/* Mobile: list */}
                  <div className="sm:hidden space-y-3">
                    {stories.slice(0, 10).map((s) => (
                      <StoryCard key={s.id} story={s} />
                    ))}
                  </div>

                  {/* Desktop: same grid sizing as custom news */}
                  <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {stories.slice(0, 10).map((s) => (
                      <StoryCard key={s.id} story={s} />
                    ))}
                  </div>
                </>
              );
            })()
          )}
        </div>

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
          articles.length === 0 &&
          !(Array.isArray(bhaskarStateFeed) &&
            currentLocation &&
            currentLocation !== 'All' &&
            bhaskarStateFeed.find((b) => b.location === currentLocation)?.stories?.length > 0) && (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              {/* Animated SVG Illustration */}
              <div className="relative mb-8 select-none">
                <svg
                  width="220"
                  height="180"
                  viewBox="0 0 220 180"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-lg"
                >
                  {/* Background blob */}
                  <ellipse cx="110" cy="155" rx="80" ry="16" fill="#E8ECFF" />
                  {/* Newspaper / document */}
                  <rect x="45" y="28" width="130" height="115" rx="12" fill="#ffffff" stroke="#C7D2FE" strokeWidth="2" />
                  {/* Header strip */}
                  <rect x="45" y="28" width="130" height="28" rx="12" fill="#6366F1" />
                  <rect x="45" y="44" width="130" height="12" fill="#6366F1" />
                  {/* Lines of text */}
                  <rect x="62" y="72" width="96" height="7" rx="3.5" fill="#E0E7FF" />
                  <rect x="62" y="86" width="72" height="7" rx="3.5" fill="#E0E7FF" />
                  <rect x="62" y="100" width="84" height="7" rx="3.5" fill="#E0E7FF" />
                  <rect x="62" y="114" width="52" height="7" rx="3.5" fill="#E0E7FF" />
                  {/* Newspaper header text (white bars) */}
                  <rect x="62" y="35" width="60" height="5" rx="2.5" fill="white" opacity="0.8" />
                  <rect x="130" y="35" width="28" height="5" rx="2.5" fill="white" opacity="0.5" />
                  {/* Magnifying glass — animated */}
                  <g style={{ transformOrigin: "155px 85px", animation: "searchBob 2.4s ease-in-out infinite" }}>
                    <circle cx="155" cy="72" r="26" fill="#EEF2FF" stroke="#6366F1" strokeWidth="3" />
                    <circle cx="155" cy="72" r="18" fill="white" stroke="#A5B4FC" strokeWidth="2" />
                    {/* X inside glass */}
                    <line x1="148" y1="65" x2="162" y2="79" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="162" y1="65" x2="148" y2="79" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Handle */}
                    <line x1="174" y1="91" x2="182" y2="101" stroke="#6366F1" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                  {/* Floating dots */}
                  <circle cx="38" cy="55" r="6" fill="#A5B4FC" style={{ animation: "floatA 3s ease-in-out infinite" }} />
                  <circle cx="185" cy="120" r="5" fill="#FCA5A5" style={{ animation: "floatB 3.6s ease-in-out infinite" }} />
                  <circle cx="60" cy="150" r="4" fill="#6EE7B7" style={{ animation: "floatA 2.8s ease-in-out infinite 0.4s" }} />
                </svg>
                {/* Inline keyframes */}
                <style>{`
                  @keyframes searchBob {
                    0%, 100% { transform: translateY(0) rotate(-6deg); }
                    50% { transform: translateY(-10px) rotate(6deg); }
                  }
                  @keyframes floatA {
                    0%, 100% { transform: translateY(0); opacity: 0.7; }
                    50% { transform: translateY(-8px); opacity: 1; }
                  }
                  @keyframes floatB {
                    0%, 100% { transform: translateY(0); opacity: 0.6; }
                    50% { transform: translateY(10px); opacity: 1; }
                  }
                `}</style>
              </div>
              {/* Text */}
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
                No news found
                {currentLocation && currentLocation !== "All" ? ` in ${currentLocation}` : ""}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 max-w-xs text-center leading-relaxed mb-8">
                We couldn't find any stories for this location right now. Try a different area or browse all the latest
                news.
              </p>
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => setLocation("All")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white text-sm font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all duration-200"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Browse All News
                </button>
                <button
                  onClick={() => setLocation("Kishangarh Renwal")}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-50 active:scale-95 transition-all duration-200"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Kishangarh Renwal
                </button>
              </div>
            </div>
          )}

      </div>
    </PageLayout>
  );
};

export default Dashboard;
