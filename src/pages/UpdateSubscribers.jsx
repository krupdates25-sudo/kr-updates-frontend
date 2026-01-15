import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  X,
  CheckCircle,
  AlertCircle,
  Edit2,
  Save,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import whatsappIcon from '../assets/whatsapp.png';

const UpdateSubscribers = () => {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [showPostSelector, setShowPostSelector] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchSubscribers();
    fetchPosts();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/updates/subscribers?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }

      const data = await response.json();
      setSubscribers(data.data.data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      showNotification('Error fetching subscribers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/posts?limit=100&sort=-createdAt`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleEditClick = (subscriber) => {
    setEditingSubscriber(subscriber);
    setEditFormData({
      name: subscriber.name || '',
      phone: subscriber.phone || '',
      email: subscriber.email || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/updates/subscribers/${editingSubscriber._id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update subscriber');
      }

      const data = await response.json();
      
      // Update the subscriber in the list
      setSubscribers(
        subscribers.map((sub) =>
          sub._id === editingSubscriber._id ? data.data : sub
        )
      );

      setShowEditModal(false);
      setEditingSubscriber(null);
      showNotification('Subscriber updated successfully', 'success');
    } catch (error) {
      console.error('Error updating subscriber:', error);
      showNotification(error.message || 'Error updating subscriber', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscriber?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/updates/subscribers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscriber');
      }

      setSubscribers(subscribers.filter((sub) => sub._id !== id));
      showNotification('Subscriber deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      showNotification('Error deleting subscriber', 'error');
    }
  };

  const formatWhatsAppMessage = (post) => {
    const baseUrl = window.location.origin;
    const postUrl = `${baseUrl}/post/${post.slug}`;
    
    // Format message like a professional news channel
    const message = `📰 *${post.title || 'Latest News'}*\n\n` +
      `${post.excerpt || post.description || 'Read the full story'}\n\n` +
      `🔗 Read more: ${postUrl}\n\n` +
      `_Stay updated with KRUPDATES_\n` +
      `*KRUPDATES - Kishangarh Renwal Updates*`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppShare = (subscriber, post) => {
    if (!subscriber.phone) {
      showNotification('No phone number available for this subscriber', 'error');
      return;
    }

    // Clean phone number (remove + and spaces, keep only digits)
    let phone = subscriber.phone.replace(/[^\d]/g, '');
    
    // Remove leading zeros if any
    phone = phone.replace(/^0+/, '');
    
    if (!phone || phone.length < 10) {
      showNotification('Invalid phone number', 'error');
      return;
    }

    const message = formatWhatsAppMessage(post);
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleShareClick = (subscriber) => {
    if (!subscriber.phone) {
      showNotification('No phone number available for this subscriber', 'error');
      return;
    }
    setSelectedSubscriber(subscriber);
    setShowPostSelector(true);
  };

  const handlePostSelect = (post) => {
    if (selectedSubscriber) {
      // Share to the selected subscriber
      handleWhatsAppShare(selectedSubscriber, post);
      setShowPostSelector(false);
      setSelectedSubscriber(null);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    const search = searchQuery.toLowerCase();
    return (
      (sub.name && sub.name.toLowerCase().includes(search)) ||
      (sub.email && sub.email.toLowerCase().includes(search)) ||
      (sub.phone && sub.phone.includes(search))
    );
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PageLayout activeTab="admin-subscribers" hideSidebar={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Update Subscribers
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users who shared their details for updates ({filteredSubscribers.length} total)
            </p>
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Search and Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Edit Modal */}
          {showEditModal && editingSubscriber && (
            <div className="fixed inset-0 bg-gray-800/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit Subscriber
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSubscriber(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter phone number"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Format: +91XXXXXXXXXX or 91XXXXXXXXXX
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingSubscriber(null);
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Post Selector Modal */}
          {showPostSelector && (
            <div className="fixed inset-0 bg-gray-800/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Select Post to Share
                  </h2>
                  <button
                    onClick={() => {
                      setShowPostSelector(false);
                      setSelectedSubscriber(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {posts.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                      No posts available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {posts.map((post) => (
                        <button
                          key={post._id}
                          onClick={() => handlePostSelect(post)}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {post.excerpt || post.description || 'No description'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subscribers Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading subscribers...</p>
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No subscribers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Submissions
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Submitted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSubscribers.map((subscriber) => (
                      <tr
                        key={subscriber._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {subscriber.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {subscriber.phone || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {subscriber.email || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {subscriber.submitCount || 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(subscriber.lastSubmittedAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(subscriber)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit subscriber"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            {subscriber.phone && (
                              <button
                                onClick={() => handleShareClick(subscriber)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Share via WhatsApp"
                              >
                                <img
                                  src={whatsappIcon}
                                  alt="WhatsApp"
                                  className="w-5 h-5"
                                />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(subscriber._id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete subscriber"
                            >
                              <Trash2 className="w-5 h-5" />
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
      </div>
    </PageLayout>
  );
};

export default UpdateSubscribers;

