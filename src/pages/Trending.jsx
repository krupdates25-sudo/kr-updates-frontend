import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  User,
  Filter,
  Search,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import postService from '../services/postService';
import ArticleCard from '../components/common/ArticleCard';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

const Trending = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTrendingPosts();
  }, [timeFilter, sortBy]);

  const fetchTrendingPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getTrendingPosts({
        timeFilter,
        sortBy,
        limit: 50,
        search: searchTerm,
      });

      // Ensure we always have an array - backend returns { data: posts }
      const postsData = response.data?.data || [];
      setPosts(Array.isArray(postsData) ? postsData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching trending posts:', err);
      setError('Failed to load trending posts');
      setPosts([]); // Ensure posts is always an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTrendingPosts();
  };

  const handleLike = async (postId) => {
    if (!user) return;

    try {
      const response = await postService.toggleLike(postId);
      setPosts((prev) =>
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

  const handleBookmark = async (postId) => {
    if (!user) return;

    try {
      const response = await postService.toggleBookmark(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, isBookmarked: response.data.bookmarked }
            : post
        )
      );
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleShare = async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.origin + `/post/${post.slug}`,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.origin + `/post/${post.slug}`
        );
        alert('Link copied to clipboard!');
      }
      await postService.sharePost(post._id, { platform: 'native' });
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const filteredPosts = (Array.isArray(posts) ? posts : []).filter(
    (post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const getTrendingScore = (post) => {
    const likes = post.likeCount ?? 0;
    const comments = post.commentCount ?? 0;
    const shares = post.shareCount ?? 0;
    const views = post.viewCount ?? 0;

    // Weighted scoring: likes×1 + comments×2 + shares×3 + views×0.1
    return likes + comments * 2 + shares * 3 + views * 0.1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-300 relative">
        {/* Glassmorphism overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        />

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          activeTab="trending"
        />

        {/* Main Content Area */}
        <div className="lg:ml-72 relative z-10">
          {/* Header */}
          <Header onSidebarToggle={handleSidebarToggle} />

          {/* Loading Content */}
          <main className="min-h-screen">
            <div className="px-6 py-6">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
                      <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Glassmorphism overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        activeTab="trending"
      />

      {/* Main Content Area */}
      <div className="lg:ml-72 relative z-10">
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />

        {/* Main Content */}
        <main className="min-h-screen">
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                    Trending Posts
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
                    Discover the most popular articles based on engagement
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search trending posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="trending">Trending Score</option>
                    <option value="views">Most Viewed</option>
                    <option value="likes">Most Liked</option>
                    <option value="comments">Most Discussed</option>
                    <option value="recent">Most Recent</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {filteredPosts.length === 0 && !loading ? (
              <div className="text-center py-16">
                <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchTerm
                    ? 'No trending posts found'
                    : 'No trending posts yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? 'Try adjusting your search terms or filters'
                    : 'Check back later for trending content'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post, index) => (
                  <ArticleCard
                    key={post._id}
                    article={{
                      _id: post._id,
                      id: post._id,
                      title: post.title,
                      description:
                        post.excerpt || post.content?.substring(0, 150) + '...',
                      image: post.featuredImage?.url,
                      author: {
                        _id: post.author?._id,
                        id: post.author?._id,
                        name: `${post.author?.firstName || ''} ${
                          post.author?.lastName || ''
                        }`,
                        firstName: post.author?.firstName,
                        lastName: post.author?.lastName,
                        username: post.author?.username,
                        profileImage: post.author?.profileImage,
                        role: post.author?.role,
                      },
                      tags: post.tags || [],
                      category: post.category,
                      readTime: `${Math.ceil(
                        (post.content?.length || 500) / 200
                      )} min read`,
                      publishedAt: post.publishedAt,
                      likeCount: post.likeCount ?? 0,
                      likes: post.likeCount ?? 0,
                      isLiked: post.isLiked || false,
                      comments: post.commentCount ?? 0,
                      shares: post.shareCount ?? 0,
                      slug: post.slug,
                    }}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onShare={handleShare}
                    showRank={true}
                    showTrendingScore={true}
                    rank={index + 1}
                    trendingScore={Math.round(getTrendingScore(post))}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Trending;
