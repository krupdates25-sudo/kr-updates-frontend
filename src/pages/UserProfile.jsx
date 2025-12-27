import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Calendar,
  Mail,
  Globe,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  BookOpen,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Award,
  TrendingUp,
  Clock,
  Filter,
  Search,
  Grid,
  List,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import ArticleCard from '../components/common/ArticleCard';
import LoadMoreButton from '../components/common/LoadMoreButton';
import authService from '../services/authService';
import postService from '../services/postService';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    totalCount: 0,
    hasMore: false,
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  useEffect(() => {
    console.log('UserProfile mounted with userId:', userId);
    fetchUserProfile();
    fetchUserPosts();
  }, [userId]);

  useEffect(() => {
    if (filterCategory !== 'all' || sortBy !== 'newest' || searchQuery) {
      setPosts([]);
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchUserPosts(1, true);
    }
  }, [filterCategory, sortBy, searchQuery]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getUserProfile(userId);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (page = 1, reset = false) => {
    try {
      setPostsLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        author: userId,
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(searchQuery && { search: searchQuery }),
        sort:
          sortBy === 'newest'
            ? '-createdAt'
            : sortBy === 'oldest'
            ? 'createdAt'
            : sortBy === 'popular'
            ? '-likeCount'
            : sortBy === 'views'
            ? '-viewCount'
            : '-createdAt',
      };

      const response = await postService.getAllPosts(params);
      const newPosts = response.data.data || [];

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setPagination({
        page,
        limit: pagination.limit,
        totalCount: response.data.totalCount || 0,
        hasMore: response.data.hasMore || false,
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = pagination.page + 1;
    setPagination((prev) => ({ ...prev, page: nextPage }));
    fetchUserPosts(nextPage);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(posts.map((post) => post.category))];
    return categories.filter(Boolean);
  };

  const calculateStats = () => {
    const totalPosts = pagination.totalCount;
    const totalLikes = posts.reduce(
      (sum, post) => sum + (post.likeCount || 0),
      0
    );
    const totalViews = posts.reduce(
      (sum, post) => sum + (post.viewCount || 0),
      0
    );
    const totalComments = posts.reduce(
      (sum, post) => sum + (post.commentCount || 0),
      0
    );

    return { totalPosts, totalLikes, totalViews, totalComments };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-300 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The profile you're looking for doesn't exist.
          </p>
          <Link
            to="/dashboard"
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Glassmorphism overlay */}
      <div className="fixed inset-0 bg-white/10 backdrop-blur-sm pointer-events-none" />

      <div className="relative z-10">
        <Header onSidebarToggle={handleSidebarToggle} />
        <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />

        <main
          className={`transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8"
          >
            {/* Profile Header */}
            <motion.div
              variants={itemVariants}
              className="bg-white/90 backdrop-blur-md rounded-3xl border border-white/20 p-8 mb-8"
              style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Image & Basic Info */}
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative">
                    <img
                      src={
                        user.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.firstName + ' ' + user.lastName
                        )}&size=200&background=5755FE&color=fff&bold=true`
                      }
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    {user.role === 'admin' && (
                      <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white p-2 rounded-full">
                        <Award className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="text-center lg:text-left mt-4">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-lg text-purple-600 font-medium mb-2">
                      @{user.username}
                    </p>
                    <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-600 mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.role === 'admin'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role === 'admin' ? 'Administrator' : 'Sub Admin'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bio */}
                    {user.bio && (
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          About
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {user.bio}
                        </p>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Contact
                      </h3>

                      {user.email && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                      )}

                      {user.location && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{user.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Joined{' '}
                          {new Date(user.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Social Links */}
                    {(user.website ||
                      user.socialLinks?.twitter ||
                      user.socialLinks?.instagram ||
                      user.socialLinks?.linkedin ||
                      user.socialLinks?.github) && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Social
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {user.website && (
                            <a
                              href={user.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Globe className="w-4 h-4" />
                              <span className="text-sm">Website</span>
                            </a>
                          )}

                          {user.socialLinks?.twitter && (
                            <a
                              href={`https://twitter.com/${user.socialLinks.twitter}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            >
                              <Twitter className="w-4 h-4" />
                              <span className="text-sm">Twitter</span>
                            </a>
                          )}

                          {user.socialLinks?.instagram && (
                            <a
                              href={`https://instagram.com/${user.socialLinks.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg transition-colors"
                            >
                              <Instagram className="w-4 h-4" />
                              <span className="text-sm">Instagram</span>
                            </a>
                          )}

                          {user.socialLinks?.linkedin && (
                            <a
                              href={`https://linkedin.com/in/${user.socialLinks.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            >
                              <Linkedin className="w-4 h-4" />
                              <span className="text-sm">LinkedIn</span>
                            </a>
                          )}

                          {user.socialLinks?.github && (
                            <a
                              href={`https://github.com/${user.socialLinks.github}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Github className="w-4 h-4" />
                              <span className="text-sm">GitHub</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                    <BookOpen className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.totalPosts}
                  </div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.totalLikes.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Likes</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats.totalComments.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
              </div>
            </motion.div>

            {/* Posts Section */}
            <motion.div
              variants={itemVariants}
              className="bg-white/90 backdrop-blur-md rounded-3xl border border-white/20 p-8"
              style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
            >
              {/* Posts Header */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Posts by {user.firstName}
                  </h2>
                  <p className="text-gray-600">
                    {stats.totalPosts}{' '}
                    {stats.totalPosts === 1 ? 'post' : 'posts'} published
                  </p>
                </div>

                {/* Filters & Controls */}
                <div className="flex flex-wrap gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search posts..."
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Categories</option>
                    {getUniqueCategories().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="popular">Most Liked</option>
                    <option value="views">Most Viewed</option>
                  </select>

                  {/* View Mode */}
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${
                        viewMode === 'grid'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${
                        viewMode === 'list'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Posts Grid/List */}
              {posts.length > 0 ? (
                <>
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-6'
                    }
                  >
                    {posts.map((post) => (
                      <ArticleCard
                        key={post._id}
                        post={post}
                        className={viewMode === 'list' ? 'flex flex-row' : ''}
                      />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {pagination.hasMore && (
                    <div className="mt-8 text-center">
                      <LoadMoreButton
                        onClick={handleLoadMore}
                        loading={postsLoading}
                        hasMore={pagination.hasMore}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Posts Found
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery || filterCategory !== 'all'
                      ? 'Try adjusting your search or filters'
                      : `${user.firstName} hasn't published any posts yet`}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
