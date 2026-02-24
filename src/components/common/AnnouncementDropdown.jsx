import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  ExternalLink,
  Megaphone,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import announcementService from '../../services/announcementService';

const AnnouncementDropdown = ({
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [markingAsRead, setMarkingAsRead] = useState(new Set());

  // Fetch announcements when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
    }
  }, [isOpen]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await announcementService.getActiveAnnouncements();
      setAnnouncements(response.data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (announcementId) => {
    if (markingAsRead.has(announcementId)) return;

    try {
      setMarkingAsRead((prev) => new Set(prev).add(announcementId));

      await announcementService.markAsRead(announcementId);

      // Update local state
      setAnnouncements((prev) =>
        prev.map((announcement) =>
          announcement._id === announcementId
            ? { ...announcement, isRead: true }
            : announcement
        )
      );

      // Update unread count
      const newUnreadCount = Math.max(0, unreadCount - 1);
      onUnreadCountChange(newUnreadCount);
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    } finally {
      setMarkingAsRead((prev) => {
        const newSet = new Set(prev);
        newSet.delete(announcementId);
        return newSet;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await announcementService.markAllAsRead();

      // Update all announcements to read
      setAnnouncements((prev) =>
        prev.map((announcement) => ({ ...announcement, isRead: true }))
      );

      // Reset unread count
      onUnreadCountChange(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const getAnnouncementIcon = (type, icon) => {
    const iconMap = {
      info: Info,
      warning: AlertTriangle,
      success: CheckCircle,
      error: XCircle,
      update: Megaphone,
      bell: Bell,
      check: CheckCircle,
      alert: AlertTriangle,
      star: Star,
    };

    const IconComponent = iconMap[icon] || iconMap[type] || Info;
    return IconComponent;
  };

  const getAnnouncementColor = (type, priority) => {
    if (priority === 'urgent')
      return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    if (priority === 'high')
      return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';

    const colorMap = {
      info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      warning: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      success: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      update: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    };

    return colorMap[type] || 'text-gray-500 bg-gray-50 dark:bg-gray-700';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      medium:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return badges[priority] || badges.medium;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const announcementDate = new Date(date);
    const diffInMinutes = Math.floor((now - announcementDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadAnnouncements = announcements.filter((a) => !a.isRead);
  const readAnnouncements = announcements.filter((a) => a.isRead);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-gray-500/50 lg:bg-transparent" onClick={onClose} />

      {/* Mobile Sidebar / Desktop Dropdown */}
      <div className="fixed lg:absolute inset-y-0 right-0 lg:inset-auto lg:right-0 lg:mt-2 w-full sm:w-96 lg:w-96 bg-gray-500/50 lg:bg-white lg:dark:bg-gray-800 lg:border lg:border-gray-200 lg:dark:border-gray-700 lg:rounded-lg lg:shadow-xl z-50 lg:max-h-[80vh] overflow-hidden flex flex-col lg:animate-none animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:bg-gray-50 lg:dark:bg-gray-700/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Announcements
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadAnnouncements.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto lg:max-h-96">
          {loading && announcements.length === 0 ? (
            <div className="p-6 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Loading announcements...
              </p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchAnnouncements}
                className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                Try again
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No announcements
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="py-2">
              {/* Unread announcements */}
              {unreadAnnouncements.map((announcement) => {
                const IconComponent = getAnnouncementIcon(
                  announcement.type,
                  announcement.icon
                );
                const colorClasses = getAnnouncementColor(
                  announcement.type,
                  announcement.priority
                );

                return (
                  <div
                    key={announcement._id}
                    className={`m-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all ${
                      !announcement.isRead
                        ? 'border-l-4 border-blue-500'
                        : 'border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`p-2 rounded-lg ${colorClasses} flex-shrink-0`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm flex-1">
                            {announcement.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityBadge(
                                announcement.priority
                              )}`}
                            >
                              {announcement.priority}
                            </span>
                            {!announcement.isRead && (
                              <button
                                onClick={() =>
                                  handleMarkAsRead(announcement._id)
                                }
                                disabled={markingAsRead.has(announcement._id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                                title="Mark as read"
                              >
                                {markingAsRead.has(announcement._id) ? (
                                  <div className="w-3 h-3 animate-spin border border-gray-400 border-t-transparent rounded-full"></div>
                                ) : (
                                  <Check className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {announcement.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(announcement.createdAt)}</span>
                            {announcement.isRead ? (
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>Read</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <EyeOff className="w-3 h-3" />
                                <span>Unread</span>
                              </div>
                            )}
                          </div>

                          {announcement.actionUrl &&
                            announcement.actionText && (
                              <button
                                onClick={() => {
                                  // Handle post review URLs - extract post ID
                                  // Backend sends /post/:id format
                                  if (announcement.actionUrl.includes('/post/')) {
                                    const postId = announcement.actionUrl.split('/post/')[1];
                                    // Navigate to post details page (ObjectId)
                                    navigate(`/post/${postId}`);
                                    onClose();
                                  } else if (announcement.actionUrl.includes('/posts/')) {
                                    // Handle legacy /posts/ format
                                    const postId = announcement.actionUrl.split('/posts/')[1];
                                    navigate(`/post/${postId}`);
                                    onClose();
                                  } else {
                                    // For other URLs, use navigation
                                    navigate(announcement.actionUrl);
                                    onClose();
                                  }
                                }}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1"
                              >
                                {announcement.actionText}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Read announcements */}
              {readAnnouncements.map((announcement) => {
                const IconComponent = getAnnouncementIcon(
                  announcement.type,
                  announcement.icon
                );
                const colorClasses = getAnnouncementColor(
                  announcement.type,
                  announcement.priority
                );

                return (
                  <div
                    key={announcement._id}
                    className="m-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all opacity-75 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex gap-3">
                      <div
                        className={`p-2 rounded-lg ${colorClasses} flex-shrink-0`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm flex-1">
                            {announcement.title}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityBadge(
                              announcement.priority
                            )}`}
                          >
                            {announcement.priority}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {announcement.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(announcement.createdAt)}</span>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Read</span>
                            </div>
                          </div>

                          {announcement.actionUrl &&
                            announcement.actionText && (
                              <button
                                onClick={() => {
                                  if (announcement.actionUrl.includes('/post/')) {
                                    const postId = announcement.actionUrl.split('/post/')[1];
                                    navigate(`/post/${postId}`);
                                    onClose();
                                  } else if (announcement.actionUrl.includes('/posts/')) {
                                    const postId = announcement.actionUrl.split('/posts/')[1];
                                    navigate(`/post/${postId}`);
                                    onClose();
                                  } else {
                                    navigate(announcement.actionUrl);
                                    onClose();
                                  }
                                }}
                                className="text-xs text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 font-medium flex items-center gap-1"
                              >
                                {announcement.actionText}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add CSS for slide-in animation */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @media (min-width: 1024px) {
          .animate-slide-in-right {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

export default AnnouncementDropdown;
