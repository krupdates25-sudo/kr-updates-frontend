import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  FileText,
  Image as ImageIcon,
  Calendar,
  Tag,
  MapPin,
} from 'lucide-react';
import RichTextEditor from '../components/editor/RichTextEditor';
import PageLayout from '../components/layout/PageLayout';
import CloudinaryUpload from '../components/common/CloudinaryUpload';
import { breakingNewsService } from '../services/breakingNewsService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguageLocation } from '../contexts/LanguageLocationContext';

const CreateBreakingNews = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { availableLocations, refreshLocations } = useLanguageLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image: {
      url: '',
      alt: '',
      caption: '',
    },
    category: 'General',
    priority: 1,
    expiresAt: '',
    location: 'Kishangarh Renwal',
    tags: [],
  });
  const [errors, setErrors] = useState({});

  const suggestedLocations = useMemo(() => {
    const locs = Array.isArray(availableLocations) ? availableLocations : [];
    return locs
      .map((l) => String(l || '').trim())
      .filter((l) => l && l.toLowerCase() !== 'all')
      .slice(0, 10);
  }, [availableLocations]);

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/breaking-news');
    }
  }, [user, navigate]);

  // Load story if editing
  useEffect(() => {
    if (id) {
      loadStory();
    }
  }, [id]);

  const loadStory = async () => {
    try {
      setIsLoading(true);
      const response = await breakingNewsService.getStoryById(id);
      if (response.success && response.data) {
        const story = response.data;
        // Format expiresAt for datetime-local input (YYYY-MM-DDTHH:mm)
        const expiresAtFormatted = story.expiresAt
          ? new Date(story.expiresAt).toISOString().slice(0, 16)
          : '';

        setFormData({
          title: story.title || '',
          excerpt: story.excerpt || '',
          content: story.content || '',
          image: story.image || { url: '', alt: '', caption: '' },
          category: story.category || 'General',
          priority: story.priority || 1,
          expiresAt: expiresAtFormatted,
          location: story.location || 'Kishangarh Renwal',
          tags: story.tags || [],
        });
      }
    } catch (error) {
      console.error('Error loading story:', error);
      navigate('/admin/breaking-news');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    if (!formData.image.url) {
      newErrors.image = 'Image is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data for backend
      // Convert datetime-local to ISO string if provided
      let expiresAtDate;
      if (formData.expiresAt) {
        expiresAtDate = new Date(formData.expiresAt).toISOString();
      } else {
        // Default to 24 hours from now
        expiresAtDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      const storyData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        image: {
          url: formData.image.url,
          alt: formData.image.alt || formData.title.trim(),
          caption: formData.image.caption || '',
        },
        category: formData.category,
        priority: formData.priority || 1,
        expiresAt: expiresAtDate,
        location: formData.location || 'Kishangarh Renwal',
        tags: formData.tags || [],
      };

      if (id) {
        await breakingNewsService.updateStory(id, storyData);
      } else {
        await breakingNewsService.createStory(storyData);
      }

      // Refresh locations list so newly used locations can appear in filter tabs
      try {
        await refreshLocations();
      } catch {
        // ignore
      }

      navigate('/admin/breaking-news');
    } catch (error) {
      console.error('Error saving story:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save story';
      alert(errorMessage);
      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach((err) => {
          fieldErrors[err.param || err.field] = err.msg || err.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'Technology',
    'Business',
    'Science',
    'World',
    'Health',
    'Sports',
    'Politics',
    'Entertainment',
    'General',
  ];

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <PageLayout activeTab="admin-breaking-news" contentClassName="bg-gray-50" defaultSidebarOpen={false}>
      <div className="min-h-screen">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/breaking-news')}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {id ? 'Edit Breaking News' : 'Create Breaking News'}
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    {id ? 'Update breaking news story' : 'Create a new breaking news story'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : id ? 'Update Story' : 'Create Story'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8">
          <div className="w-full">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Content */}
              <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                {/* Title */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter breaking news title..."
                    className="w-full text-xl sm:text-2xl font-bold border-0 bg-transparent placeholder-gray-400 focus:outline-none resize-none"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-2">{errors.title}</p>
                  )}
                </div>

                {/* Excerpt */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Excerpt *
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Enter a brief excerpt..."
                    rows={3}
                    className="w-full border-0 bg-transparent placeholder-gray-400 focus:outline-none resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.excerpt.length}/500 characters
                  </p>
                  {errors.excerpt && (
                    <p className="text-red-500 text-sm mt-2">{errors.excerpt}</p>
                  )}
                </div>

                {/* Rich Text Editor */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700">
                      Content *
                    </label>
                  </div>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => handleInputChange('content', content)}
                    placeholder="Write the breaking news content..."
                  />
                  {errors.content && (
                    <p className="text-red-500 text-sm p-4">{errors.content}</p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-6">
                {/* Featured Image */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    Featured Image *
                  </label>
                  <CloudinaryUpload
                    onUpload={(url) => {
                      handleInputChange('image', {
                        ...formData.image,
                        url: typeof url === 'string' ? url : url.url,
                      });
                    }}
                    currentImage={formData.image.url}
                  />
                  {formData.image.url && (
                    <div className="mt-4">
                      <img
                        src={formData.image.url}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-2">{errors.image}</p>
                  )}
                </div>

                {/* Category */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Tag className="w-4 h-4 inline mr-2" />
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    News Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Where did this happen?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {suggestedLocations.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleInputChange('location', loc)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${formData.location === loc
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Expires At */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Expires At
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CreateBreakingNews;

