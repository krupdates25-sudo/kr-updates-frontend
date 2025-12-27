import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  Mail,
  Eye,
  Calendar,
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Zap,
  Search,
  UserCheck,
  UserX,
  X,
  Loader,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import postService from '../services/postService';
import notificationService from '../services/notificationService';

const NotificationManagement = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState('');
  const [aiContent, setAiContent] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // User selection states
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sendToAll, setSendToAll] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);

  // Results
  const [, setSendResult] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await notificationService.getUsers(
        userSearch,
        userRoleFilter
      );
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userSearch || userRoleFilter) {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch, userRoleFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getAllPosts({ page: 1, limit: 50 });
      // Backend returns posts in response.data.data
      setPosts(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAIContent = async (post) => {
    try {
      setAiGenerating(true);
      setAiSubject(`Breaking: ${post.title}`);
      setAiContent(
        `Don't miss this important update: ${post.title}. ${
          post.excerpt ||
          post.description ||
          'Read the full article for more details.'
        }`
      );
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePostSelect = (post) => {
    setSelectedPost(post);
    generateAIContent(post);
    setSendResult(null);
  };

  const toggleUserSelection = (userId) => {
    if (sendToAll) return; // Can't select individual users when "send to all" is enabled

    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSendToAllToggle = (checked) => {
    setSendToAll(checked);
    if (checked) {
      setSelectedUsers([]);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedPost) return;

    if (!sendToAll && selectedUsers.length === 0) {
      alert('Please select at least one user or choose to send to all users');
      return;
    }

    if (!aiSubject.trim() || !aiContent.trim()) {
      alert('Please fill in both subject and content');
      return;
    }

    try {
      setSending(true);
      const response = await notificationService.sendNotification({
        postId: selectedPost._id,
        userIds: sendToAll ? [] : selectedUsers,
        subject: aiSubject,
        content: aiContent,
        sendToAll: sendToAll,
      });

      setSendResult(response.data);

      // Build detailed message
      let message = '';

      if (response.data.processing) {
        // Background processing for large batches
        message = `Email sending started!\n\n`;
        message += `${response.data.total} emails are being processed in the background.\n`;
        message += `This may take several minutes. Please check your email server logs for progress.\n`;
        if (response.data.unverifiedSkipped > 0) {
          message += `\n${response.data.unverifiedSkipped} user(s) skipped (unverified email)`;
        }
        if (
          response.data.totalRequested &&
          response.data.totalRequested > response.data.total
        ) {
          message += `\n\nNote: ${response.data.totalRequested} user(s) selected, but only ${response.data.total} have verified emails.`;
        }
      } else {
        // Completed sending
        message = `Notifications sent successfully!\n`;
        message += `${response.data.success} successful, ${response.data.failed} failed`;
        if (response.data.unverifiedSkipped > 0) {
          message += `\n${response.data.unverifiedSkipped} user(s) skipped (unverified email)`;
        }
        if (
          response.data.totalRequested &&
          response.data.totalRequested > response.data.total
        ) {
          message += `\n\nNote: ${response.data.totalRequested} user(s) selected, but only ${response.data.total} have verified emails.`;
        }
      }

      alert(message);

      // Reset form
      setSelectedPost(null);
      setAiSubject('');
      setAiContent('');
      setSelectedUsers([]);
      setSendToAll(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(
        error.response?.data?.message ||
          'Failed to send notification. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedPost || !aiSubject.trim() || !aiContent.trim()) {
      alert('Please select a post and fill in subject and content');
      return;
    }

    const testEmail = prompt('Enter email address to send test email:');
    if (!testEmail) return;

    try {
      setSending(true);
      await notificationService.sendTestEmail({
        postId: selectedPost._id,
        email: testEmail,
        subject: aiSubject,
        content: aiContent,
      });
      alert('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      alert(
        error.response?.data?.message ||
          'Failed to send test email. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedUsersCount = sendToAll ? users.length : selectedUsers.length;

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab="admin-notifications"
        onTabChange={() => {}}
      />

      <div className="lg:ml-72 w-full">
        <Header onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className="w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Notification Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Send email notifications to users about new posts
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-full">
            {/* Select Post */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Select Post
              </h2>

              {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No posts available
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Create a post first to send notifications
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {posts.map((post) => (
                      <div
                        key={post._id}
                        onClick={() => handlePostSelect(post)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          selectedPost?._id === post._id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {post.featuredImage?.url && (
                            <img
                              src={post.featuredImage.url}
                              alt={post.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 text-sm">
                              {post.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {post.excerpt || post.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="w-3 h-3" />
                              {formatDate(post.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Notification Settings */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                Email Notification
              </h2>

              {selectedPost ? (
                  <div className="space-y-6">
                    {/* AI Content Generation */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900 dark:text-purple-100">
                          AI-Powered Email Content
                        </span>
                        {aiGenerating && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        )}
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        AI will generate an engaging subject line and email
                        content based on the selected post.
                      </p>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={aiSubject}
                        onChange={(e) => setAiSubject(e.target.value)}
                        placeholder="Enter email subject..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Email Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Content
                      </label>
                      <textarea
                        value={aiContent}
                        onChange={(e) => setAiContent(e.target.value)}
                        placeholder="Enter email content..."
                        rows="6"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>

                    {/* User Selection */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-500" />
                          Select Recipients
                        </h3>
                        <button
                          onClick={() => setShowUserSelector(!showUserSelector)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          {showUserSelector ? 'Hide' : 'Show'} Users
                        </button>
                      </div>

                      {/* Send to All Toggle */}
                      <div className="mb-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendToAll}
                            onChange={(e) =>
                              handleSendToAllToggle(e.target.checked)
                            }
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Send to All Users ({users.length} users)
                          </span>
                        </label>
                      </div>

                      {!sendToAll && (
                        <>
                          {/* User Search and Filter */}
                          {showUserSelector && (
                            <div className="mb-4 space-y-3">
                              <div className="flex gap-2">
                                <div className="flex-1 relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) =>
                                      setUserSearch(e.target.value)
                                    }
                                    placeholder="Search users..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                  />
                                </div>
                                <select
                                  value={userRoleFilter}
                                  onChange={(e) =>
                                    setUserRoleFilter(e.target.value)
                                  }
                                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                >
                                  <option value="all">All Users</option>
                                  <option value="admin">Admins Only</option>
                                </select>
                              </div>

                              {/* User List */}
                              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                {loadingUsers ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader className="w-5 h-5 animate-spin text-blue-600" />
                                  </div>
                                ) : users.length > 0 ? (
                                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {users.map((user) => (
                                      <div
                                        key={user._id}
                                        onClick={() =>
                                          toggleUserSelection(user._id)
                                        }
                                        className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                          selectedUsers.includes(user._id)
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                              selectedUsers.includes(user._id)
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                          >
                                            {selectedUsers.includes(
                                              user._id
                                            ) && (
                                              <CheckCircle className="w-4 h-4 text-white" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                              {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              {user.email}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                    No users found
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedUsers.length > 0 ? (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {selectedUsers.length} user(s) selected
                              </span>
                            ) : (
                              <span>No users selected</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleSendTestEmail}
                        disabled={
                          sending || !aiSubject.trim() || !aiContent.trim()
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mail className="w-4 h-4" />
                        Test Email
                      </button>
                      <button
                        onClick={handleSendNotification}
                        disabled={
                          sending ||
                          !aiSubject.trim() ||
                          !aiContent.trim() ||
                          (!sendToAll && selectedUsers.length === 0)
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send to {sendToAll
                              ? 'All'
                              : selectedUsersCount}{' '}
                            User{selectedUsersCount !== 1 ? 's' : ''}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Select a post to configure notification settings
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationManagement;
