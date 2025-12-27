import { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Heart,
  MessageCircle,
  Eye,
  User,
  FileText,
  Clock,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Activity,
  MousePointer,
  Share2,
  Bookmark,
  UserPlus,
  LogIn,
  LogOut,
  Edit3,
  Trash2,
  BarChart3,
  PieChart,
  LineChart,
  Monitor,
  Smartphone,
  Globe,
  MapPin,
  AlertCircle,
  CheckCircle,
  Upload,
  Download,
  Settings,
  Shield,
  X,
  ChevronDown,
  Zap,
  Target,
  Users,
  Database,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Minus,
  ExternalLink,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import AdContainer from '../components/common/AdContainer';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

const History = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('30');
  const [viewMode, setViewMode] = useState('timeline'); // timeline, analytics, detailed
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchActivities();
    fetchAnalytics();
  }, [filterType, searchQuery, dateFilter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams();

      if (filterType !== 'all') {
        queryParams.append('type', filterType);
      }

      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      queryParams.append('limit', '100');

      // Use different endpoint for admin vs regular users
      const endpoint =
        user && user.role === 'admin'
          ? `${API_BASE_URL}/activities/all?${queryParams}`
          : `${API_BASE_URL}/activities/my-activities?${queryParams}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      const activitiesData =
        user && user.role === 'admin' ? data.data.data : data.data.data;

      const transformedActivities = activitiesData.map((activity) => ({
        id: activity._id,
        type: activity.type,
        description: activity.description,
        details: activity.details || '',
        timestamp: new Date(activity.timestamp),
        icon: getIconForType(activity.type),
        color: getColorForType(activity.type),
        bgColor: getBgColorForType(activity.type),
        browser: activity.browserInfo?.browser || 'Unknown',
        os: activity.browserInfo?.os || 'Unknown',
        platform: activity.browserInfo?.platform || 'Unknown',
        ipAddress: activity.networkInfo?.ipAddress || 'Unknown',
        location:
          activity.networkInfo?.city && activity.networkInfo?.country
            ? `${activity.networkInfo.city}, ${activity.networkInfo.country}`
            : 'Unknown',
        metadata: activity.metadata || {},
        // Admin-specific fields
        user: activity.user
          ? {
              id: activity.user._id || activity.user,
              name:
                activity.user.firstName && activity.user.lastName
                  ? `${activity.user.firstName} ${activity.user.lastName}`
                  : activity.user.username ||
                    activity.user.email ||
                    'Unknown User',
              email: activity.user.email || '',
              username: activity.user.username || '',
            }
          : null,
      }));

      setActivities(transformedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const token = localStorage.getItem('authToken');

      // For now, only show user's own analytics even for admin
      // TODO: Add admin-wide analytics endpoint
      const response = await fetch(
        `${API_BASE_URL}/activities/my-stats?period=${dateFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this activity? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(activityId);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/activities/my-activities/${activityId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }

      // Remove the activity from the list
      setActivities((prev) =>
        prev.filter((activity) => activity.id !== activityId)
      );

      // Refresh analytics
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getIconForType = (type) => {
    const iconMap = {
      login: LogIn,
      logout: LogOut,
      register: UserPlus,
      profile_update: User,
      password_change: Lock,
      post_create: FileText,
      post_update: Edit3,
      post_delete: Trash2,
      post_view: Eye,
      post_like: Heart,
      post_unlike: Heart,
      post_share: Share2,
      post_bookmark: Bookmark,
      post_unbookmark: Bookmark,
      comment_create: MessageCircle,
      comment_update: Edit3,
      comment_delete: Trash2,
      comment_like: Heart,
      comment_unlike: Heart,
      user_follow: UserPlus,
      user_unfollow: UserPlus,
      user_delete: Trash2,
      account_delete: Trash2,
      search: Search,
      page_visit: MousePointer,
      file_upload: Upload,
      error_occurred: AlertCircle,
    };
    return iconMap[type] || Activity;
  };

  const getColorForType = (type) => {
    const colorMap = {
      login: 'text-blue-600',
      logout: 'text-gray-600',
      register: 'text-green-600',
      profile_update: 'text-indigo-600',
      password_change: 'text-orange-600',
      post_create: 'text-green-600',
      post_update: 'text-blue-600',
      post_delete: 'text-red-600',
      post_view: 'text-gray-600',
      post_like: 'text-red-500',
      post_unlike: 'text-gray-500',
      post_share: 'text-purple-600',
      post_bookmark: 'text-yellow-600',
      post_unbookmark: 'text-gray-500',
      comment_create: 'text-blue-600',
      comment_update: 'text-cyan-600',
      comment_delete: 'text-red-600',
      comment_like: 'text-red-500',
      comment_unlike: 'text-gray-500',
      user_follow: 'text-green-600',
      user_unfollow: 'text-gray-500',
      user_delete: 'text-red-600',
      account_delete: 'text-red-700',
      search: 'text-indigo-600',
      page_visit: 'text-gray-600',
      file_upload: 'text-blue-600',
      error_occurred: 'text-red-600',
    };
    return colorMap[type] || 'text-gray-600';
  };

  const getBgColorForType = (type) => {
    const bgColorMap = {
      login: 'bg-blue-50 border-blue-200',
      logout: 'bg-gray-50 border-gray-200',
      register: 'bg-green-50 border-green-200',
      profile_update: 'bg-indigo-50 border-indigo-200',
      password_change: 'bg-orange-50 border-orange-200',
      post_create: 'bg-green-50 border-green-200',
      post_update: 'bg-blue-50 border-blue-200',
      post_delete: 'bg-red-50 border-red-200',
      post_view: 'bg-gray-50 border-gray-200',
      post_like: 'bg-red-50 border-red-200',
      post_unlike: 'bg-gray-50 border-gray-200',
      post_share: 'bg-purple-50 border-purple-200',
      post_bookmark: 'bg-yellow-50 border-yellow-200',
      post_unbookmark: 'bg-gray-50 border-gray-200',
      comment_create: 'bg-blue-50 border-blue-200',
      comment_update: 'bg-cyan-50 border-cyan-200',
      comment_delete: 'bg-red-50 border-red-200',
      comment_like: 'bg-red-50 border-red-200',
      comment_unlike: 'bg-gray-50 border-gray-200',
      user_follow: 'bg-green-50 border-green-200',
      user_unfollow: 'bg-gray-50 border-gray-200',
      user_delete: 'bg-red-50 border-red-200',
      account_delete: 'bg-red-50 border-red-200',
      search: 'bg-indigo-50 border-indigo-200',
      page_visit: 'bg-gray-50 border-gray-200',
      file_upload: 'bg-blue-50 border-blue-200',
      error_occurred: 'bg-red-50 border-red-200',
    };
    return bgColorMap[type] || 'bg-gray-50 border-gray-200';
  };


  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getActivityTypeLabel = (type) => {
    const labels = {
      login: 'Login',
      logout: 'Logout',
      register: 'Registration',
      profile_update: 'Profile Update',
      password_change: 'Password Change',
      post_create: 'Post Created',
      post_update: 'Post Updated',
      post_delete: 'Post Deleted',
      post_view: 'Post Viewed',
      post_like: 'Post Liked',
      post_unlike: 'Post Unliked',
      post_share: 'Post Shared',
      post_bookmark: 'Post Bookmarked',
      post_unbookmark: 'Bookmark Removed',
      comment_create: 'Comment Added',
      comment_update: 'Comment Updated',
      comment_delete: 'Comment Deleted',
      comment_like: 'Comment Liked',
      comment_unlike: 'Comment Unliked',
      user_follow: 'User Followed',
      user_unfollow: 'User Unfollowed',
      user_delete: 'User Deleted',
      account_delete: 'Account Deleted',
      search: 'Search Performed',
      page_visit: 'Page Visited',
      file_upload: 'File Uploaded',
      error_occurred: 'Error Occurred',
    };
    return labels[type] || type;
  };

  const renderAnalyticsChart = (data, title, color = 'blue') => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map((item) => item.count));
    const colorClasses = {
      blue: 'bg-blue-500',
      purple: 'bg-indigo-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
    };

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <BarChart3 className="h-5 w-5 text-gray-500" />
        </div>
        <div className="space-y-4">
          {data.slice(0, 8).map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {item._id || item.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round((item.count / maxValue) * 100)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    colorClasses[color] || colorClasses.blue
                  }`}
                  style={{ width: `${(item.count / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDailyChart = (dailyData) => {
    if (!dailyData || dailyData.length === 0) return null;

    const maxValue = Math.max(...dailyData.map((item) => item.count));
    const recentData = dailyData.slice(-14);

    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Daily Activity Trend
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Last 14 days activity pattern
            </p>
          </div>
          <LineChart className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex items-end justify-between space-x-2 h-40 mt-6">
          {recentData.map((item, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center group"
            >
              <div className="relative w-full flex justify-center mb-2">
                <div
                  className="bg-blue-500 rounded-t w-6 transition-all duration-300 hover:bg-blue-600"
                  style={{
                    height: `${
                      maxValue > 0
                        ? Math.max((item.count / maxValue) * 120, 4)
                        : 4
                    }px`,
                  }}
                ></div>
                <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {item.count} activities
                </div>
              </div>
              <div className="text-xs text-gray-600 font-medium transform -rotate-45 origin-center mt-1">
                {new Date(item._id).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesSearch =
      searchQuery === '' ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <PageLayout activeTab="history">
          {/* Page Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6">
                <div>
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
                    <div className="p-2 sm:p-2.5 md:p-3 bg-blue-600 rounded-lg">
                      <HistoryIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                      {user && user.role === 'admin'
                        ? 'All User Activities'
                        : 'Activity History'}
                    </h1>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                    {user && user.role === 'admin'
                      ? 'Monitor and track all platform activities across all users'
                      : 'Comprehensive tracking of all your platform interactions'}
                  </p>
                  {user && user.role === 'admin' && (
                    <div className="flex items-center space-x-3 mt-4">
                      <div className="flex items-center space-x-2 bg-orange-100 px-3 py-1.5 rounded-md border border-orange-200">
                        <Shield className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">
                          Admin Panel
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 bg-green-100 px-3 py-1.5 rounded-md border border-green-200">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          All Users
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* View Mode Tabs */}
                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'timeline'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Timeline
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'analytics'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </button>
                  <button
                    onClick={() => setViewMode('detailed')}
                    className={`px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      viewMode === 'detailed'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Detailed
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 bg-white border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search activities..."
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Activity Type Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white min-w-[200px] text-gray-900"
                >
                  <option value="all">All Activities</option>
                  <option value="login">Logins</option>
                  <option value="post_like">Post Likes</option>
                  <option value="comment_create">Comments</option>
                  <option value="post_create">Posts Created</option>
                  <option value="post_view">Post Views</option>
                  <option value="post_share">Post Shares</option>
                  <option value="search">Searches</option>
                  <option value="profile_update">Profile Updates</option>
                  <option value="user_follow">User Follows</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white min-w-[160px] text-gray-900"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6">
            {/* Top Ad */}
            <div className="mb-4 sm:mb-6">
              <AdContainer position="top" postIndex={0} />
            </div>

            {viewMode === 'analytics' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                {analytics && analytics.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Total Activities
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {analytics.summary.total}
                          </p>
                        </div>
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Activity className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Likes
                          </p>
                          <p className="text-2xl font-bold text-red-600 mt-1">
                            {analytics.summary.likes}
                          </p>
                        </div>
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Heart className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Comments
                          </p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {analytics.summary.comments}
                          </p>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MessageCircle className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Posts
                          </p>
                          <p className="text-2xl font-bold text-green-600 mt-1">
                            {analytics.summary.posts}
                          </p>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Logins
                          </p>
                          <p className="text-2xl font-bold text-indigo-600 mt-1">
                            {analytics.summary.logins}
                          </p>
                        </div>
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <LogIn className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charts */}
                {analytics && analytics.breakdown && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderDailyChart(analytics.breakdown.daily)}
                    {renderAnalyticsChart(
                      analytics.breakdown.byType,
                      'Activity Types',
                      'purple'
                    )}
                    {renderAnalyticsChart(
                      analytics.breakdown.byBrowser,
                      'Browser Usage',
                      'blue'
                    )}
                    {renderAnalyticsChart(
                      analytics.breakdown.byOS,
                      'Operating Systems',
                      'green'
                    )}
                  </div>
                )}

                {analyticsLoading && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                  </div>
                )}
              </div>
            )}

            {(viewMode === 'timeline' || viewMode === 'detailed') && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading activities...</p>
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <HistoryIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No activities found
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery || filterType !== 'all'
                        ? 'Try adjusting your filters or search terms'
                        : 'Your activities will appear here as you interact with the platform'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {filteredActivities.slice(0, Math.ceil(filteredActivities.length / 2)).map((activity) => {
                      const Icon = activity.icon;
                      const isAdmin = user && user.role === 'admin';

                      return (
                        <div
                          key={activity.id}
                          className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow ${activity.bgColor}`}
                        >
                          <div className="flex items-start space-x-4">
                            <div
                              className={`p-3 rounded-lg ${activity.bgColor}`}
                            >
                              <Icon className={`h-5 w-5 ${activity.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    {getActivityTypeLabel(activity.type)}
                                  </h3>
                                  {isAdmin && activity.user && (
                                    <div className="flex items-center space-x-2 mt-1">
                                      <div className="flex items-center space-x-2 bg-blue-100 px-2 py-1 rounded border border-blue-200">
                                        <User className="h-3 w-3 text-blue-600" />
                                        <span className="text-xs font-medium text-blue-800">
                                          {activity.user.name}
                                        </span>
                                      </div>
                                      {activity.user.email && (
                                        <span className="text-xs text-gray-500">
                                          {activity.user.email}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {getTimeAgo(activity.timestamp)}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleDeleteActivity(activity.id)
                                    }
                                    disabled={deleteLoading === activity.id}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete this activity"
                                  >
                                    {deleteLoading === activity.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-500 border-t-transparent"></div>
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                {activity.description}
                              </p>
                              {activity.details && (
                                <p className="text-xs text-gray-600 italic bg-gray-50 px-2 py-1 rounded">
                                  {activity.details}
                                </p>
                              )}

                              {viewMode === 'detailed' && (
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                  <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded">
                                    <Monitor className="h-3 w-3 text-gray-500" />
                                    <span className="text-gray-700">
                                      {activity.browser} on {activity.os}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded">
                                    <Globe className="h-3 w-3 text-gray-500" />
                                    <span className="text-gray-700">
                                      {activity.ipAddress}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded">
                                    <MapPin className="h-3 w-3 text-gray-500" />
                                    <span className="text-gray-700">
                                      {activity.location}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>

                    {/* Middle Ad - Show in middle of activities */}
                    {filteredActivities.length >= 4 && (
                      <div className="my-4 sm:my-6">
                        <AdContainer position="middle" postIndex={Math.floor(filteredActivities.length / 2)} />
                      </div>
                    )}

                    {/* Second half of activities */}
                    <div className="space-y-3">
                      {filteredActivities.slice(Math.ceil(filteredActivities.length / 2)).map((activity) => {
                        const Icon = activity.icon;
                        const isAdmin = user && user.role === 'admin';

                        return (
                          <div
                            key={activity.id}
                            className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow ${activity.bgColor}`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`p-3 rounded-lg ${activity.bgColor}`}>
                                <Icon className={`h-5 w-5 ${activity.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      {getActivityTypeLabel(activity.type)}
                                    </h3>
                                    {isAdmin && activity.user && (
                                      <div className="flex items-center space-x-2 mt-1">
                                        <div className="flex items-center space-x-2 bg-blue-100 px-2 py-1 rounded border border-blue-200">
                                          <User className="h-3 w-3 text-blue-600" />
                                          <span className="text-xs font-medium text-blue-800">
                                            {activity.user.name}
                                          </span>
                                        </div>
                                        {activity.user.email && (
                                          <span className="text-xs text-gray-500">
                                            {activity.user.email}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {getTimeAgo(activity.timestamp)}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteActivity(activity.id)}
                                      disabled={deleteLoading === activity.id}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Delete this activity"
                                    >
                                      {deleteLoading === activity.id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-500 border-t-transparent"></div>
                                      ) : (
                                        <Trash2 className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 mb-1">
                                  {activity.description}
                                </p>
                                {activity.details && (
                                  <p className="text-xs text-gray-600 italic bg-gray-50 px-2 py-1 rounded">
                                    {activity.details}
                                  </p>
                                )}
                                {viewMode === 'detailed' && (
                                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                    <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded">
                                      <Monitor className="h-3 w-3 text-gray-500" />
                                      <span className="text-gray-700">
                                        {activity.browser} on {activity.os}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded">
                                      <Globe className="h-3 w-3 text-gray-500" />
                                      <span className="text-gray-700">
                                        {activity.ipAddress}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded">
                                      <MapPin className="h-3 w-3 text-gray-500" />
                                      <span className="text-gray-700">
                                        {activity.location}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bottom Ad */}
            <div className="mt-4 sm:mt-6">
              <AdContainer position="bottom" postIndex={activities.length} />
            </div>
          </div>
    </PageLayout>
  );
};

export default History;
