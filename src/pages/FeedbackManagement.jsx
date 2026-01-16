import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Star,
  Search,
  Filter,
  Trash2,
  Archive,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Star as StarIcon,
  X,
  Eye,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import feedbackService from '../services/feedbackService';
// Date formatting helper
const formatDate = (dateString, formatType = 'default') => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  if (formatType === 'full') {
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  }
  
  return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [currentPage, filterRating, filterStatus, searchQuery]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        sort: '-createdAt',
      };

      if (filterRating !== 'all') params.rating = filterRating;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await feedbackService.getAllFeedbacks(params);
      setFeedbacks(response.data.feedbacks || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await feedbackService.getFeedbackStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await feedbackService.updateFeedbackStatus(id, newStatus);
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await feedbackService.deleteFeedback(id);
      fetchFeedbacks();
      fetchStats();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-green-100 text-green-800 border-green-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full border ${styles[status] || styles.pending}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating}/5
        </span>
      </div>
    );
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const description = feedback.description?.toLowerCase() || '';
      const userName =
        feedback.user?.firstName?.toLowerCase() ||
        feedback.user?.lastName?.toLowerCase() ||
        feedback.user?.email?.toLowerCase() ||
        '';
      return description.includes(query) || userName.includes(query);
    }
    return true;
  });

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-blue-500" />
              Feedback Management
            </h1>
            <p className="text-gray-600 mt-1">
              View and manage user feedback submissions
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Feedbacks</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalFeedbacks}
                  </p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.averageRating.toFixed(1)}
                  </p>
                </div>
                <StarIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {stats.pendingCount}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last 30 Days</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.recentFeedbacks}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search feedbacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Rating Filter */}
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Feedbacks List */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading feedbacks...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No feedbacks found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {renderStars(feedback.rating)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">
                              {feedback.user
                                ? `${feedback.user.firstName} ${feedback.user.lastName}`
                                : 'Anonymous User'}
                            </p>
                            {getStatusBadge(feedback.status)}
                            <span className="text-xs text-gray-500">
                              {formatDate(feedback.createdAt)}
                            </span>
                          </div>
                          {feedback.description && (
                            <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                              {feedback.description}
                            </p>
                          )}
                          {feedback.user && (
                            <p className="text-xs text-gray-500">
                              {feedback.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedFeedback(feedback);
                          setShowDetails(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      {feedback.status !== 'reviewed' && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(feedback._id, 'reviewed')
                          }
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as Reviewed"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}

                      {feedback.status !== 'archived' && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(feedback._id, 'archived')
                          }
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(feedback._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 20) + 1} to{' '}
                {Math.min(currentPage * 20, pagination.total)} of{' '}
                {pagination.total} feedbacks
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pagination.pages, p + 1))
                  }
                  disabled={currentPage === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedFeedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Feedback Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Rating
                </label>
                <div className="mt-1">{renderStars(selectedFeedback.rating)}</div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  User
                </label>
                <p className="mt-1 text-gray-900">
                  {selectedFeedback.user
                    ? `${selectedFeedback.user.firstName} ${selectedFeedback.user.lastName} (${selectedFeedback.user.email})`
                    : 'Anonymous User'}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Description
                </label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {selectedFeedback.description || 'No description provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Status
                </label>
                <div className="mt-1">{getStatusBadge(selectedFeedback.status)}</div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Submitted At
                </label>
                <p className="mt-1 text-gray-900">
                  {formatDate(selectedFeedback.createdAt, 'full')}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                {selectedFeedback.status !== 'reviewed' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedFeedback._id, 'reviewed');
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Reviewed
                  </button>
                )}

                {selectedFeedback.status !== 'archived' && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedFeedback._id, 'archived');
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                )}

                <button
                  onClick={() => {
                    handleDelete(selectedFeedback._id);
                    setShowDetails(false);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default FeedbackManagement;

