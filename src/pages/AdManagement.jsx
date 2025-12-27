import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Move,
  Target,
  DollarSign,
  Users,
  MousePointer,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  ExternalLink,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import AdCard from '../components/common/AdCard';
import CloudinaryUpload from '../components/common/CloudinaryUpload';
import advertisementService from '../services/advertisementService';
import { useAuth } from '../contexts/AuthContext';

const AdManagement = () => {
  const { user } = useAuth();
  const [advertisements, setAdvertisements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    clickUrl: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    adType: 'banner',
    position: 'top',
    priority: 1,
    duration: 30,
    budget: 100,
    costPerClick: 0,
    targetAudience: {
      ageRange: { min: 18, max: 65 },
      interests: [],
      location: '',
    },
    startDate: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdvertisements();
    if (user?.role === 'admin') {
      fetchDashboardStats();
    }
  }, [searchQuery, filterPosition, filterType, filterStatus]);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 50,
        sortBy: 'priority',
        sortOrder: 'desc',
      };

      if (searchQuery) params.clientName = searchQuery;
      if (filterPosition !== 'all') params.position = filterPosition;
      if (filterType !== 'all') params.adType = filterType;
      if (filterStatus !== 'all') params.isActive = filterStatus === 'active';

      const response = await advertisementService.getAllAdvertisements(params);
      setAdvertisements(response.data.advertisements || []);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      setAdvertisements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await advertisementService.getDashboardStats();
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (name.includes('.')) {
      const keys = name.split('.');
      const processedValue = type === 'number' ? Number(value) : value;

      setFormData((prev) => {
        const newData = { ...prev };
        let current = newData;

        // Navigate to the nested property
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }

        // Set the final value
        current[keys[keys.length - 1]] = processedValue;

        return newData;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (imageUrl) => {
    // Handle both string URLs and image objects for backward compatibility
    const url = typeof imageUrl === 'string' ? imageUrl : imageUrl?.url || '';
    setFormData((prev) => ({ ...prev, imageUrl: url }));
    if (formErrors.imageUrl) {
      setFormErrors((prev) => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const validateForm = () => {
    const errors = {};

    // Safe string validation - ensure values exist and are strings before calling trim
    if (
      !formData.title ||
      typeof formData.title !== 'string' ||
      !formData.title.trim()
    ) {
      errors.title = 'Title is required';
    }
    if (
      !formData.description ||
      typeof formData.description !== 'string' ||
      !formData.description.trim()
    ) {
      errors.description = 'Description is required';
    }
    if (
      !formData.imageUrl ||
      typeof formData.imageUrl !== 'string' ||
      !formData.imageUrl.trim()
    ) {
      errors.imageUrl = 'Image is required';
    }
    if (
      !formData.clickUrl ||
      typeof formData.clickUrl !== 'string' ||
      !formData.clickUrl.trim()
    ) {
      errors.clickUrl = 'Click URL is required';
    }
    if (
      !formData.clientName ||
      typeof formData.clientName !== 'string' ||
      !formData.clientName.trim()
    ) {
      errors.clientName = 'Client name is required';
    }
    if (
      !formData.clientEmail ||
      typeof formData.clientEmail !== 'string' ||
      !formData.clientEmail.trim()
    ) {
      errors.clientEmail = 'Client email is required';
    }
    if (formData.duration < 1)
      errors.duration = 'Duration must be at least 1 day';
    if (formData.budget < 0) errors.budget = 'Budget cannot be negative';

    // URL validation
    if (
      formData.clickUrl &&
      typeof formData.clickUrl === 'string' &&
      !/^https?:\/\/.+/.test(formData.clickUrl)
    ) {
      errors.clickUrl =
        'Please provide a valid URL starting with http:// or https://';
    }

    // Email validation
    if (
      formData.clientEmail &&
      typeof formData.clientEmail === 'string' &&
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.clientEmail)
    ) {
      errors.clientEmail = 'Please provide a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();

    // For drafts, skip validation
    if (!isDraft && !validateForm()) return;

    try {
      setSubmitting(true);

      const submitData = { ...formData, isDraft };

      if (editingAd) {
        await advertisementService.updateAdvertisement(
          editingAd._id,
          submitData
        );
      } else {
        await advertisementService.createAdvertisement(submitData);
      }

      setShowCreateForm(false);
      setEditingAd(null);
      resetForm();
      fetchAdvertisements();

      if (user?.role === 'admin') {
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error saving advertisement:', error);
      alert('Error saving advertisement. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      clickUrl: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      adType: 'banner',
      position: 'random',
      priority: 1,
      duration: 30,
      budget: 100,
      costPerClick: 0,
      targetAudience: {
        ageRange: { min: 18, max: 65 },
        interests: [],
        location: '',
      },
      startDate: new Date().toISOString().split('T')[0],
      isDraft: false,
    });
    setFormErrors({});
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setFormData({
      ...ad,
      startDate: new Date(ad.startDate).toISOString().split('T')[0],
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?'))
      return;

    try {
      await advertisementService.deleteAdvertisement(id);
      fetchAdvertisements();
      if (user?.role === 'admin') {
        fetchDashboardStats();
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      alert('Error deleting advertisement. Please try again.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await advertisementService.toggleAdvertisementStatus(id);
      fetchAdvertisements();
    } catch (error) {
      console.error('Error toggling advertisement status:', error);
      alert('Error updating advertisement status. Please try again.');
    }
  };

  const filteredAds = advertisements.filter((ad) => {
    const matchesSearch =
      !searchQuery ||
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPosition =
      filterPosition === 'all' || ad.position === filterPosition;
    const matchesType = filterType === 'all' || ad.adType === filterType;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && ad.isActive) ||
      (filterStatus === 'inactive' && !ad.isActive);

    return matchesSearch && matchesPosition && matchesType && matchesStatus;
  });

  // Remove duplicate ads by _id before rendering
  const uniqueAds = [];
  const seen = new Set();
  for (const ad of filteredAds) {
    if (!seen.has(ad._id)) {
      uniqueAds.push(ad);
      seen.add(ad._id);
    }
  }

  return (
    <PageLayout activeTab="ads">
          {/* Page Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-purple-600 rounded-lg">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Advertisement Management
                    </h1>
                  </div>
                  <p className="text-gray-600 text-lg">
                    Create, manage, and track your advertising campaigns
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingAd(null);
                    resetForm();
                  }}
                  className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Advertisement
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Stats (Admin Only) */}
          {user?.role === 'admin' && dashboardStats && (
            <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 bg-white border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Total Ads
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        {dashboardStats.totalAds}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">
                        Active Ads
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        {dashboardStats.activeAds}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">
                        Total Impressions
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {dashboardStats.totalImpressions.toLocaleString()}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">
                        Total Clicks
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        {dashboardStats.totalClicks.toLocaleString()}
                      </p>
                    </div>
                    <MousePointer className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 bg-white border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search advertisements..."
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
                />
              </div>

              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Positions</option>
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
                <option value="random">Random</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="banner">Banner</option>
                <option value="card">Card</option>
                <option value="sidebar">Sidebar</option>
                <option value="popup">Popup</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Advertisement List */}
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading advertisements...</p>
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No advertisements found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ||
                  filterPosition !== 'all' ||
                  filterType !== 'all' ||
                  filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first advertisement to get started'}
                </p>
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingAd(null);
                    resetForm();
                  }}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Advertisement
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                {uniqueAds.map((ad) => (
                  <div key={ad._id} className="relative group w-full max-w-md">
                    <AdCard ad={ad} showAnalytics={true} isDraggable={false} />

                    {/* Action Buttons */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                      <button
                        onClick={() => handleEdit(ad)}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Edit advertisement"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(ad._id)}
                        className={`p-1.5 text-white rounded transition-colors ${
                          ad.isActive
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title={ad.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {ad.isActive ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(ad._id)}
                        className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Delete advertisement"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

      {/* Create/Edit Advertisement Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-400/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingAd(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advertisement Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter advertisement title"
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.clientName
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter client name"
                  />
                  {formErrors.clientName && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.clientName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    formErrors.description
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter advertisement description"
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <CloudinaryUpload
                  onUpload={handleImageUpload}
                  onRemove={handleImageRemove}
                  currentImage={formData.imageUrl}
                />
                {formErrors.imageUrl && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.imageUrl}
                  </p>
                )}
              </div>

              {/* Click URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Click URL *
                </label>
                <input
                  type="url"
                  name="clickUrl"
                  value={formData.clickUrl}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    formErrors.clickUrl ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com"
                />
                {formErrors.clickUrl && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.clickUrl}
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.clientEmail
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="client@example.com"
                  />
                  {formErrors.clientEmail && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.clientEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Phone
                  </label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Ad Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Type
                  </label>
                  <select
                    name="adType"
                    value={formData.adType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="banner">Banner</option>
                    <option value="card">Card</option>
                    <option value="popup">Popup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Campaign Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    max="365"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.duration ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.duration && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.duration}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget ($) *
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.budget ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.budget && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.budget}
                    </p>
                  )}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Target Audience (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Range
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        name="targetAudience.ageRange.min"
                        value={formData.targetAudience.ageRange.min}
                        onChange={handleInputChange}
                        min="13"
                        max="100"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Min"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        name="targetAudience.ageRange.max"
                        value={formData.targetAudience.ageRange.max}
                        onChange={handleInputChange}
                        min="13"
                        max="100"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="targetAudience.location"
                      value={formData.targetAudience.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., New York, USA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Per Click ($)
                    </label>
                    <input
                      type="number"
                      name="costPerClick"
                      value={formData.costPerClick}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingAd(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                  )}
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  )}
                  {editingAd ? 'Update Advertisement' : 'Create Advertisement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default AdManagement;
