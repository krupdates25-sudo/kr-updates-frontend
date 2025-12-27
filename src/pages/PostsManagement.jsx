import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  MoreVertical,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  BarChart3,
  FileText,
  Globe,
  Lock,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useAuth } from '../contexts/AuthContext';
import postService from '../services/postService';

const PostsManagement = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    visiblePosts: 0,
    hiddenPosts: 0,
  });

  useEffect(() => {
    fetchPosts();
  }, [searchQuery, filterStatus, filterVisibility, filterCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getAllPosts({
        page: 1,
        limit: 50,
        search: searchQuery,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        isVisible:
          filterVisibility !== 'all'
            ? filterVisibility === 'visible'
            : undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
      });

      setPosts(response.data.data || []);
      calculateStats(response.data.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showNotification('Error fetching posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (postsData) => {
    const stats = {
      totalPosts: postsData.length,
      publishedPosts: postsData.filter((p) => p.status === 'published').length,
      draftPosts: postsData.filter((p) => p.status === 'draft').length,
      visiblePosts: postsData.filter((p) => p.isVisible).length,
      hiddenPosts: postsData.filter((p) => !p.isVisible).length,
    };
    setStats(stats);
  };

  const handleToggleVisibility = async (postId, currentVisibility) => {
    try {
      setActionLoading(true);
      const response = await postService.togglePostVisibility(postId);

      // Update the post in the local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, isVisible: !currentVisibility }
            : post
        )
      );

      showNotification(
        `Post ${!currentVisibility ? 'made visible' : 'hidden'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showNotification('Error updating post visibility', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (post) => {
    setSelectedPost(post);
    setShowDetailsModal(true);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.firstName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      post.author?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || post.status === filterStatus;
    const matchesVisibility =
      filterVisibility === 'all' ||
      (filterVisibility === 'visible' && post.isVisible) ||
      (filterVisibility === 'hidden' && !post.isVisible);
    const matchesCategory =
      filterCategory === 'all' || post.category === filterCategory;

    return (
      matchesSearch && matchesStatus && matchesVisibility && matchesCategory
    );
  });

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getVisibilityBadge = (isVisible) => {
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {isVisible ? 'Visible' : 'Hidden'}
      </span>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-300 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    <PageLayout activeTab="admin-posts" hideBottomNav={true}>
      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Posts Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and control post visibility across the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Posts
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalPosts}
                </p>
              </div>
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.publishedPosts}
                </p>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Drafts</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.draftPosts}
                </p>
              </div>
              <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Visible</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.visiblePosts}
                </p>
              </div>
              <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Hidden</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.hiddenPosts}
                </p>
              </div>
              <EyeOff className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="scheduled">Scheduled</option>
            </select>

            {/* Visibility Filter */}
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="all">All Visibility</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            >
              <option value="all">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Programming">Programming</option>
              <option value="Web Development">Web Development</option>
              <option value="Mobile Development">Mobile Development</option>
              <option value="Data Science">Data Science</option>
              <option value="AI & Machine Learning">
                AI & Machine Learning
              </option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="DevOps">DevOps</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Startup">Startup</option>
              <option value="Career">Career</option>
              <option value="Tutorial">Tutorial</option>
              <option value="News">News</option>
              <option value="Review">Review</option>
              <option value="Opinion">Opinion</option>
            </select>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Loading posts...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No posts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Author
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                      Visibility
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                      Category
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                      Created
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPosts.map((post) => (
                    <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                            {post.featuredImage?.url ? (
                              <img
                                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover"
                                src={post.featuredImage.url}
                                alt={post.title}
                              />
                            ) : (
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3 sm:ml-4 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                              {post.title}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {post.excerpt || post.content.substring(0, 100)}
                              ...
                            </div>
                            {/* Show author on mobile */}
                            <div className="sm:hidden mt-1">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {post.author?.firstName} {post.author?.lastName}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <img
                              className="h-8 w-8 rounded-full"
                              src={
                                post.author?.profileImage ||
                                '/default-profile.jpg'
                              }
                              alt={post.author?.firstName}
                            />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {post.author?.firstName} {post.author?.lastName}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              @{post.author?.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        {getVisibilityBadge(post.isVisible)}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() =>
                              handleToggleVisibility(post._id, post.isVisible)
                            }
                            disabled={actionLoading}
                            className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                              post.isVisible
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                            } ${
                              actionLoading
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          >
                            {post.isVisible ? (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Hide</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Show</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleViewDetails(post)}
                            className="inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                          >
                            <MoreVertical className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageLayout>

      {/* Post Details Modal */}
      {showDetailsModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Post Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Title</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedPost.title}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Content</h4>
                  <div
                    className="text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: selectedPost.content.substring(0, 500) + '...',
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Status</h4>
                    {getStatusBadge(selectedPost.status)}
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Visibility
                    </h4>
                    {getVisibilityBadge(selectedPost.isVisible)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Category</h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {selectedPost.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Author</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedPost.author?.firstName}{' '}
                      {selectedPost.author?.lastName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Created</h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {new Date(selectedPost.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Last Updated
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {new Date(selectedPost.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 sm:px-6 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}
    </>
  );
};

export default PostsManagement;
