import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { breakingNewsService } from '../services/breakingNewsService';
import { useAuth } from '../contexts/AuthContext';

const BreakingNewsManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Add error boundary for component-level errors
  if (!user) {
    return null; // Will be handled by AuthContext
  }
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, expired
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin
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

  // Fetch stories
  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await breakingNewsService.getStories();
      if (response.success) {
        setStories(response.data);
      }
    } catch (err) {
      setError('Failed to fetch breaking news stories');
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Filter stories
  const filteredStories = stories.filter((story) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' &&
        story.isActive &&
        new Date(story.expiresAt) > new Date()) ||
      (filter === 'expired' &&
        (!story.isActive || new Date(story.expiresAt) <= new Date()));

    const matchesSearch =
      searchTerm === '' ||
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Handle edit - navigate to edit page
  const handleEdit = (story) => {
    navigate(`/admin/breaking-news/edit/${story._id}`);
  };

  // Handle delete
  const handleDelete = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;

    try {
      setLoading(true);
      await breakingNewsService.deleteStory(storyId);
      await fetchStories();
    } catch (err) {
      setError('Failed to delete story');
      console.error('Error deleting story:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (storyId) => {
    try {
      setLoading(true);
      await breakingNewsService.toggleStoryStatus(storyId);
      await fetchStories();
    } catch (err) {
      setError('Failed to toggle story status');
      console.error('Error toggling story status:', err);
    } finally {
      setLoading(false);
    }
  };


  // Get status badge
  const getStatusBadge = (story) => {
    if (!story.isActive) {
      return (
        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
          Inactive
        </span>
      );
    }
    if (new Date(story.expiresAt) <= new Date()) {
      return (
        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
          Expired
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
        Active
      </span>
    );
  };

  return (
    <PageLayout activeTab="admin-breaking-news" contentClassName="bg-white">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Breaking News Management
                </h1>
                <p className="text-gray-600">
                  Manage breaking news stories that appear at the top of the
                  dashboard
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/breaking-news/create')}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Story
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Stories</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Stories List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mr-2"></div>
                <span className="text-gray-600">Loading stories...</span>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No stories found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Story
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStories.map((story) => (
                      <tr key={story._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {story.image?.url && (
                              <img
                                src={story.image.url}
                                alt={story.image.alt}
                                className="w-12 h-12 object-cover rounded-lg mr-4"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {story.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {story.excerpt}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {story.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(story)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(story.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedStory(story);
                                setShowDetailsModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(story)}
                              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(story._id)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title={story.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {story.isActive ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(story._id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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


      {/* Details Modal */}
      {showDetailsModal && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Story Details
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedStory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedStory.image?.url && (
                  <img
                    src={selectedStory.image.url}
                    alt={selectedStory.image.alt}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedStory.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedStory.excerpt}
                  </p>
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedStory.content,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedStory.category}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedStory.priority}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2">{getStatusBadge(selectedStory)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expires:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(selectedStory.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default BreakingNewsManagement;
