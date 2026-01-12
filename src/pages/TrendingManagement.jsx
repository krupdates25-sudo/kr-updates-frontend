import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Plus,
  CheckSquare,
  Square,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useAuth } from '../contexts/AuthContext';
import postService from '../services/postService';
import { API_BASE_URL } from '../config/api';

const TrendingManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Check if user is admin or moderator
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              Only administrators and moderators can access this page.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Fetch trending posts
  const fetchTrendingPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await postService.getAllPosts({
        page,
        limit: 20,
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchQuery || undefined,
        sortBy,
      });

      if (response?.data?.data) {
        // Filter to show only trending posts
        const trendingPosts = response.data.data.filter(post => post.isTrending);
        setPosts(trendingPosts);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching trending posts:', err);
      setNotification({
        type: 'error',
        message: 'Failed to fetch trending posts',
      });
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, searchQuery, sortBy]);

  // Use admin API for trending posts
  const fetchAdminTrendingPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/posts/admin/trending?page=${page}&limit=20&status=${filterStatus === 'all' ? '' : filterStatus}&search=${searchQuery}&sortBy=${sortBy}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.data) {
          // ApiResponse wraps data in { data: { data: posts, pagination: {...} } }
          const postsData = responseData.data.data || responseData.data;
          // Ensure postsData is always an array
          const postsArray = Array.isArray(postsData) ? postsData : [];
          setPosts(postsArray);
          setTotalPages(responseData.data.pagination?.totalPages || 1);
        } else {
          setPosts([]);
          setTotalPages(1);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch trending posts');
      }
    } catch (err) {
      console.error('Error fetching trending posts:', err);
      setPosts([]); // Ensure posts is always an array
      setTotalPages(1);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to fetch trending posts',
      });
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, searchQuery, sortBy]);

  useEffect(() => {
    fetchAdminTrendingPosts();
  }, [fetchAdminTrendingPosts]);

  // Toggle trending status for a post
  const toggleTrending = async (postId, currentStatus) => {
    try {
      setActionLoading(true);
      const response = await postService.updatePost(postId, {
        isTrending: !currentStatus,
      });

      if (response) {
        setNotification({
          type: 'success',
          message: `Post ${!currentStatus ? 'set as' : 'removed from'} trending successfully`,
        });
        fetchAdminTrendingPosts();
      }
    } catch (err) {
      console.error('Error toggling trending status:', err);
      setNotification({
        type: 'error',
        message: 'Failed to update trending status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk set trending
  const bulkSetTrending = async (isTrending) => {
    if (selectedPosts.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please select at least one post',
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/posts/admin/trending/bulk`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postIds: selectedPosts,
            isTrending,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotification({
          type: 'success',
          message: data.message || `${selectedPosts.length} posts ${isTrending ? 'set as' : 'removed from'} trending`,
        });
        setSelectedPosts([]);
        fetchAdminTrendingPosts();
      } else {
        throw new Error('Failed to update posts');
      }
    } catch (err) {
      console.error('Error bulk updating trending status:', err);
      setNotification({
        type: 'error',
        message: 'Failed to update trending status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle post selection
  const togglePostSelection = (postId) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  // Select all posts
  const selectAllPosts = () => {
    if (!Array.isArray(posts) || posts.length === 0) return;
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map((post) => post._id));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <PageLayout activeTab="admin-trending" contentClassName="bg-gray-50">
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                Trending Posts Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage trending posts and their visibility
              </p>
            </div>
            {selectedPosts.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => bulkSetTrending(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Set as Trending ({selectedPosts.length})
                </button>
                <button
                  onClick={() => bulkSetTrending(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Remove Trending ({selectedPosts.length})
                </button>
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Newest First</option>
              <option value="views">Most Views</option>
              <option value="likes">Most Likes</option>
              <option value="shares">Most Shares</option>
            </select>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !Array.isArray(posts) || posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Trending Posts
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'No posts found matching your search'
                : 'No posts are currently set as trending'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={selectAllPosts}
                        className="flex items-center"
                        disabled={!Array.isArray(posts) || posts.length === 0}
                      >
                        {Array.isArray(posts) && posts.length > 0 && selectedPosts.length === posts.length ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.isArray(posts) && posts.map((post) => (
                    <tr
                      key={post._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePostSelection(post._id)}
                          className="flex items-center"
                        >
                          {selectedPosts.includes(post._id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {post.featuredImage?.url && (
                            <img
                              src={post.featuredImage.url}
                              alt={post.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {post.title}
                            </h3>
                            {post.subheading && (
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {post.subheading}
                              </p>
                            )}
                            {post.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                {post.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {post.author?.profileImage ? (
                            <img
                              src={post.author.profileImage}
                              alt={post.author.username}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <User className="w-8 h-8 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-900">
                            {post.author?.firstName} {post.author?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {post.viewCount || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/post/${post.slug || post._id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Post"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleTrending(post._id, post.isTrending)}
                            disabled={actionLoading}
                            className={`p-2 rounded-lg transition-colors ${
                              post.isTrending
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            title={post.isTrending ? 'Remove from Trending' : 'Set as Trending'}
                          >
                            <TrendingUp className={`w-4 h-4 ${post.isTrending ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default TrendingManagement;

