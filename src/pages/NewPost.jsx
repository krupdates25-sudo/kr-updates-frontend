import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Tag,
  Hash,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Settings,
  Wand2,
  Brain,
  Lightbulb,
  RefreshCw,
  Video,
  User,
} from 'lucide-react';
import RichTextEditor from '../components/editor/RichTextEditor';
import PageLayout from '../components/layout/PageLayout';
import CloudinaryUpload from '../components/common/CloudinaryUpload';
import postService from '../services/postService';
import aiService from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

const NewPost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '', // This will be renamed to 'heading' in the UI
    description: '', // New field for short subheading
    content: '',
    excerpt: '',
    reporterName: '', // Reporter name (News by)
    category: '',
    tags: [],
    featuredImage: null,
    featuredVideo: null,
    status: 'draft',
    publishedAt: '',
  });
  // Initialize media type based on existing data
  const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'

  const [errors, setErrors] = useState({});
  const [currentTag, setCurrentTag] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Sync media type tab with existing media
  useEffect(() => {
    if (formData.featuredVideo) {
      setMediaType('video');
    } else if (formData.featuredImage) {
      setMediaType('image');
    }
  }, [formData.featuredVideo, formData.featuredImage]);

  const categories = [
    'Technology',
    'Programming',
    'Web Development',
    'Mobile Development',
    'Data Science',
    'AI & Machine Learning',
    'Cybersecurity',
    'DevOps',
    'Design',
    'Business',
    'Startup',
    'Career',
    'Tutorial',
    'News',
    'Review',
    'Opinion',
  ];

  // Removed heavy animations for performance

  const handleInputChange = useCallback((field, value) => {
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
  }, [errors]);

  const handleAddTag = useCallback(() => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  }, [currentTag, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleImageUpload = (imageData) => {
    // Convert string URL to proper featuredImage object structure
    const featuredImageObj = {
      url: imageData,
      alt: formData.title || 'Featured image',
      caption: '',
    };

    setFormData((prev) => ({
      ...prev,
      featuredImage: featuredImageObj,
      featuredVideo: null, // Clear video when image is uploaded
    }));
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({
      ...prev,
      featuredImage: null,
    }));
  };

  const handleVideoUpload = (videoData) => {
    // Convert video data to proper featuredVideo object structure
    const featuredVideoObj = {
      url: typeof videoData === 'string' ? videoData : videoData.url,
      thumbnail: videoData.thumbnail || null,
      duration: videoData.duration || null,
      caption: '',
    };

    setFormData((prev) => ({
      ...prev,
      featuredVideo: featuredVideoObj,
      featuredImage: null, // Clear image when video is uploaded
    }));
  };

  const handleVideoRemove = () => {
    setFormData((prev) => ({
      ...prev,
      featuredVideo: null,
    }));
  };

  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    // Clear the opposite media type when switching
    if (type === 'image') {
      setFormData((prev) => ({
        ...prev,
        featuredVideo: null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        featuredImage: null,
      }));
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Heading is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.title, formData.content, formData.category]);

  const handleSave = async (status = 'draft') => {
    if (!validateForm()) return;

    // IMPORTANT: Non-admin users (moderator, sub-admin) cannot publish
    // Force status to 'draft' if user is not admin
    const finalStatus = user?.role === 'admin' ? status : 'draft';

    setIsLoading(true);
    try {
      const postData = {
        ...formData,
        status: finalStatus,
        publishedAt: finalStatus === 'published' ? new Date().toISOString() : null,
      };

      await postService.createPost(postData);

      // Show success message
      const successMessage = 
        finalStatus === 'published'
          ? 'Post published successfully!'
          : user?.role === 'admin'
          ? 'Post saved as draft successfully!'
          : 'Post saved as draft and submitted for review. Admin will review and publish it.';
      
      alert(successMessage);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = () => handleSave('published');
  const handleSaveDraft = () => handleSave('draft');

  // AI Handler Functions
  const handleGenerateContent = async () => {
    if (!formData.title.trim() || !formData.category) {
      alert('Please enter a heading and select a category first!');
      return;
    }

    setAiLoading(true);
    try {
      const result = await aiService.generateContent(
        formData.title,
        formData.category
      );
      if (result.success) {
        handleInputChange('content', result.content);
        alert('Content generated successfully!');
      } else {
        alert(result.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert(
        'Error generating content. Please check your API key and try again.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleImproveContent = async () => {
    if (!formData.content.trim()) {
      alert('Please write some content first!');
      return;
    }

    setAiLoading(true);
    try {
      const result = await aiService.improveContent(formData.content);
      if (result.success) {
        handleInputChange('content', result.content);
        alert('Content improved successfully!');
      } else {
        alert(result.error || 'Failed to improve content');
      }
    } catch (error) {
      console.error('Error improving content:', error);
      alert(
        'Error improving content. Please check your API key and try again.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateExcerpt = async () => {
    if (!formData.content.trim()) {
      alert('Please write some content first!');
      return;
    }

    setAiLoading(true);
    try {
      const result = await aiService.generateExcerpt(formData.content);
      if (result.success) {
        handleInputChange('excerpt', result.excerpt);
        alert('Excerpt generated successfully!');
      } else {
        alert(result.error || 'Failed to generate excerpt');
      }
    } catch (error) {
      console.error('Error generating excerpt:', error);
      alert(
        'Error generating excerpt. Please check your API key and try again.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please enter a heading and some content first!');
      return;
    }

    setAiLoading(true);
    try {
      const result = await aiService.suggestTags(
        formData.title,
        formData.content,
        formData.category
      );
      if (result.success && result.tags.length > 0) {
        // Filter out tags that already exist
        const newTags = result.tags.filter(
          (tag) => !formData.tags.includes(tag)
        );
        if (newTags.length > 0) {
          setFormData((prev) => ({
            ...prev,
            tags: [...prev.tags, ...newTags],
          }));
          alert(`Added ${newTags.length} new tags!`);
        } else {
          alert('All suggested tags are already added!');
        }
      } else {
        alert(result.error || 'Failed to suggest tags');
      }
    } catch (error) {
      console.error('Error suggesting tags:', error);
      alert('Error suggesting tags. Please check your API key and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <PageLayout activeTab="new-post" contentClassName="bg-gray-50" defaultSidebarOpen={false}>
      <div className="min-h-screen">
          {/* Page Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Create New Post
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      Share your thoughts with the world
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">{showPreview ? 'Edit' : 'Preview'}</span>
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save Draft</span>
                    <span className="sm:hidden">Draft</span>
                  </button>

                  {/* Only show Publish button for Admin users */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={handlePublish}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isLoading ? 'Publishing...' : 'Publish'}
                    </button>
                  )}
                  
                  {/* Show info message for non-admin users */}
                  {user?.role !== 'admin' && (
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs sm:text-sm">
                      <span>Posts require admin approval</span>
                    </div>
                  )}
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
                  {/* Heading */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Heading
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange('title', e.target.value)
                      }
                      placeholder="Enter your post heading..."
                      className="w-full text-xl sm:text-2xl font-bold border-0 bg-transparent placeholder-gray-400 focus:outline-none resize-none"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Description (Short Subheading) */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Description (Short Subheading)
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      placeholder="Enter a short description or subheading..."
                      className="w-full text-base sm:text-lg border-0 bg-transparent placeholder-gray-400 focus:outline-none resize-none"
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {formData.description.length}/200 characters
                    </p>
                  </div>

                  {/* Rich Text Editor */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Hash className="w-4 h-4 inline mr-2" />
                        Content
                      </label>

                      {/* AI Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleGenerateContent}
                          disabled={
                            aiLoading || !formData.title || !formData.category
                          }
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Generate content based on heading and category"
                        >
                          {aiLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">AI Generate</span>
                        </button>

                        <button
                          onClick={handleImproveContent}
                          disabled={aiLoading || !formData.content.trim()}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Improve existing content"
                        >
                          {aiLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Brain className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">AI Improve</span>
                        </button>
                      </div>
                    </div>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content) =>
                        handleInputChange('content', content)
                      }
                      placeholder="Start writing your amazing post..."
                    />
                    {errors.content && (
                      <p className="text-red-500 text-sm p-4">
                        {errors.content}
                      </p>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Excerpt (Optional)
                      </label>

                      <button
                        onClick={handleGenerateExcerpt}
                        disabled={aiLoading || !formData.content.trim()}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate excerpt from content"
                      >
                        {aiLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Lightbulb className="w-3 h-3" />
                        )}
                        AI Excerpt
                      </button>
                    </div>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) =>
                        handleInputChange('excerpt', e.target.value)
                      }
                      placeholder="Brief description of your post..."
                      rows={3}
                      className="w-full border-0 bg-transparent placeholder-gray-400 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Reporter Name (News by) - Admin only */}
                  {user?.role === 'admin' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <User className="w-4 h-4 inline mr-2" />
                        Reporter Name (News by)
                      </label>
                      <input
                        type="text"
                        value={formData.reporterName}
                        onChange={(e) =>
                          handleInputChange('reporterName', e.target.value)
                        }
                        placeholder="Enter reporter name (optional)..."
                        maxLength={100}
                        className="w-full text-base sm:text-lg border-0 bg-transparent placeholder-gray-400 focus:outline-none resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.reporterName.length}/100 characters - Leave empty to use author name
                      </p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Featured Media (Image or Video) with Tabs */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => handleMediaTypeChange('image')}
                        className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          mediaType === 'image'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4 inline mr-2" />
                        Image
                      </button>
                      <button
                        onClick={() => handleMediaTypeChange('video')}
                        className={`flex-1 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          mediaType === 'video'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Video className="w-4 h-4 inline mr-2" />
                        Video
                      </button>
                    </div>

                    {/* Media Upload Component */}
                    {mediaType === 'image' ? (
                      <CloudinaryUpload
                        onUpload={handleImageUpload}
                        currentImage={formData.featuredImage}
                        onRemove={handleImageRemove}
                        type="image"
                      />
                    ) : (
                      <CloudinaryUpload
                        onUpload={handleVideoUpload}
                        currentImage={formData.featuredVideo}
                        onRemove={handleVideoRemove}
                        type="video"
                      />
                    )}
                  </div>

                  {/* Category */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      <Hash className="w-4 h-4 inline mr-2" />
                      Category
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) =>
                          handleInputChange('category', e.target.value)
                        }
                        placeholder="Enter custom category or select from suggestions below..."
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                      <div className="text-xs text-gray-500 mb-2">
                        Popular categories:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() =>
                              handleInputChange('category', category)
                            }
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full transition-colors"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        <Tag className="w-4 h-4 inline mr-2" />
                        Tags
                      </label>

                      <button
                        onClick={handleSuggestTags}
                        disabled={
                          aiLoading ||
                          !formData.title ||
                          !formData.content.trim()
                        }
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="AI suggest relevant tags"
                      >
                        {aiLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        AI Tags
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add tags..."
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddTag}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Add Tag
                      </button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 text-blue-500 hover:text-blue-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Advanced Settings */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <button
                      onClick={() =>
                        setShowAdvancedSettings(!showAdvancedSettings)
                      }
                      className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-4"
                    >
                      <span>
                        <Settings className="w-4 h-4 inline mr-2" />
                        Advanced Settings
                      </span>
                      <span className={`transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {showAdvancedSettings && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Publish Date
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.publishedAt}
                            onChange={(e) =>
                              handleInputChange('publishedAt', e.target.value)
                            }
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </PageLayout>
  );
};

export default NewPost;
