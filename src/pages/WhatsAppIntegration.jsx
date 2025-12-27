import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Phone,
  Users,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Clock,
  Download,
  Upload,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

const WhatsAppIntegration = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('send');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  // Message form state
  const [messageForm, setMessageForm] = useState({
    recipients: [],
    message: '',
    customNumber: '',
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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_BASE_URL}/users/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUserSelect = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === user._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) {
      showNotification('Please enter a message', 'error');
      return;
    }

    if (selectedUsers.length === 0 && !messageForm.customNumber) {
      showNotification('Please select users or enter a phone number', 'error');
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('authToken');
      const payload = {
        message: messageForm.message,
        recipients:
          selectedUsers.length > 0
            ? selectedUsers.map((u) => u.phone || u.email) // Use phone if available, fallback to email
            : [],
        customNumber: messageForm.customNumber || null,
      };

      const response = await fetch(
        `${API_BASE_URL}/whatsapp/send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send WhatsApp message');
      }

      const totalRecipients =
        (data.data.totalSent || 0) + (data.data.totalFailed || 0);
      const successCount = data.data.totalSent || 0;

      if (successCount > 0) {
        showNotification(
          `WhatsApp message sent successfully to ${successCount}/${totalRecipients} recipient(s)!`,
          'success'
        );
      } else {
        showNotification(
          `Failed to send WhatsApp message. Please check phone numbers and try again.`,
          'error'
        );
      }

      // Show detailed results if there were failures
      if (data.data.failed && data.data.failed.length > 0) {
        console.log('Failed recipients:', data.data.failed);
      }

      setMessageForm({ recipients: [], message: '', customNumber: '' });
      setSelectedUsers([]);
      setShowMessageModal(false);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      showNotification(
        error.message || 'Error sending WhatsApp message',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-300 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
        activeTab="admin-integrations"
        onTabChange={() => {}}
      />

      {/* Main Content Area */}
      <div className="lg:ml-72 relative z-10">
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />

        {/* Main Content */}
        <main className="min-h-screen">
          {/* Page Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    WhatsApp Integration
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Send WhatsApp messages to users and manage communications
                  </p>
                </div>

                <button
                  onClick={() => setShowMessageModal(true)}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-white font-semibold transition-all duration-200 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    boxShadow: '0 4px 20px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-6 py-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full space-y-6"
            >
              {/* Stats Cards */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
              >
                <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Messages Sent</p>
                      <p className="text-2xl font-bold text-gray-800">247</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Total Recipients</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {users.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Delivery Rate</p>
                      <p className="text-2xl font-bold text-gray-800">98.5%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Last Sent</p>
                      <p className="text-2xl font-bold text-gray-800">2h ago</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Recent Messages */}
              <motion.div
                variants={itemVariants}
                className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden"
                style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Recent Messages
                  </h2>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {/* Mock recent messages */}
                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          Welcome message sent to new users
                        </p>
                        <p className="text-sm text-gray-600">
                          Sent to 5 recipients • 2 hours ago
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Delivered
                      </span>
                    </div>

                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          Weekly newsletter notification
                        </p>
                        <p className="text-sm text-gray-600">
                          Sent to 23 recipients • 1 day ago
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Delivered
                      </span>
                    </div>

                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          System maintenance notification
                        </p>
                        <p className="text-sm text-gray-600">
                          Sent to all users • 3 days ago
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Delivered
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Send WhatsApp Message
                </h2>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Recipients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Select Recipients
                </h3>

                {/* Search and Filter */}
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="author">Author</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                {/* Custom Number Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or enter custom phone number:
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={messageForm.customNumber}
                      onChange={(e) =>
                        setMessageForm((prev) => ({
                          ...prev,
                          customNumber: e.target.value,
                        }))
                      }
                      placeholder="+1234567890"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Users List */}
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedUsers.some((u) => u._id === user._id)
                          ? 'bg-green-50 border-green-200'
                          : ''
                      }`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.firstName?.charAt(0)}
                            {user.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        {selectedUsers.some((u) => u._id === user._id) && (
                          <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Count */}
                <p className="text-sm text-gray-600 mt-2">
                  {selectedUsers.length} user(s) selected
                </p>
              </div>

              {/* Right Side - Message */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Message
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content *
                  </label>
                  <textarea
                    value={messageForm.message}
                    onChange={(e) =>
                      setMessageForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your WhatsApp message here..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {messageForm.message.length}/1000 characters
                  </p>
                </div>

                {/* Message Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Preview:
                  </h4>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {messageForm.message ||
                        'Your message will appear here...'}
                    </p>
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={
                    loading ||
                    !messageForm.message.trim() ||
                    (selectedUsers.length === 0 && !messageForm.customNumber)
                  }
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {notification.message}
        </motion.div>
      )}
    </div>
  );
};

export default WhatsAppIntegration;
