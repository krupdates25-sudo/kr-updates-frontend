import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  Tag,
  Hash,
  Calendar,
  Globe,
  Lock,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Settings,
  Wand2,
  Brain,
  Lightbulb,
  RefreshCw,
  Video,
} from 'lucide-react';
import RichTextEditor from '../components/editor/RichTextEditor';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import CloudinaryUpload from '../components/common/CloudinaryUpload';
import postService from '../services/postService';
import aiService from '../services/aiService';

const NewPost = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
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

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
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

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status = 'draft') => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const postData = {
        ...formData,
        status,
        publishedAt: status === 'published' ? new Date().toISOString() : null,
      };

      await postService.createPost(postData);

      // Show success message
      alert(
        `Post ${
          status === 'published' ? 'published' : 'saved as draft'
        } successfully!`
      );
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
      alert('Please enter a title and select a category first!');
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
      alert('Please enter a title and some content first!');
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
        activeTab="new-post"
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
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="p-3 rounded-xl bg-white/90 backdrop-blur-md border border-white/20 hover:bg-white transition-all duration-200 group"
                    style={{ boxShadow: '0 4px 20px rgba(87, 85, 254, 0.1)' }}
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Create New Post
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Share your thoughts with the world
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/20 hover:bg-white transition-all duration-200"
                    style={{ boxShadow: '0 4px 20px rgba(87, 85, 254, 0.1)' }}
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Edit' : 'Preview'}
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/20 hover:bg-white transition-all duration-200 disabled:opacity-50"
                    style={{ boxShadow: '0 4px 20px rgba(87, 85, 254, 0.1)' }}
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>

                  <button
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50 hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #5755FE, #6B5AFF)',
                      boxShadow: '0 4px 20px rgba(87, 85, 254, 0.3)',
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isLoading ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-6 py-6">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-7xl mx-auto"
            >
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content */}
                <motion.div
                  variants={itemVariants}
                  className="xl:col-span-2 space-y-6"
                >
                  {/* Title */}
                  <div
                    className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6"
                    style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Post Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange('title', e.target.value)
                      }
                      placeholder="Enter your post title... (Hindi/English supported)"
                      className="w-full text-2xl font-bold border-0 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-0 resize-none"
                      style={{
                        fontFamily:
                          '"Inter", "Noto Sans Devanagari", sans-serif',
                        lineHeight: '1.2',
                      }}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Rich Text Editor */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden"
                    style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
                  >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
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
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Generate content based on title and category"
                        >
                          {aiLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3" />
                          )}
                          AI Generate
                        </button>

                        <button
                          onClick={handleImproveContent}
                          disabled={aiLoading || !formData.content.trim()}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Improve existing content"
                        >
                          {aiLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Brain className="w-3 h-3" />
                          )}
                          AI Improve
                        </button>
                      </div>
                    </div>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content) =>
                        handleInputChange('content', content)
                      }
                      placeholder="Start writing your amazing post... (Hindi/English/Mixed languages supported) or use AI to generate content!"
                    />
                    {errors.content && (
                      <p className="text-red-500 text-sm p-4">
                        {errors.content}
                      </p>
                    )}
                  </motion.div>

                  {/* Excerpt */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6"
                    style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-700">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Excerpt (Optional)
                      </label>

                      <button
                        onClick={handleGenerateExcerpt}
                        disabled={aiLoading || !formData.content.trim()}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-md hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      placeholder="Brief description of your post... or generate with AI"
                      rows={3}
                      className="w-full border-0 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-0 resize-none"
                      style={{
                        fontFamily:
                          '"Inter", "Noto Sans Devanagari", sans-serif',
                      }}
                    />
                  </motion.div>
                </motion.div>

                {/* Sidebar */}
                <motion.div variants={itemVariants} className="space-y-6">
                  {/* Featured Media (Image or Video) with Tabs */}
                  <div
                    className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6"
                    style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
                  >
                    {/* Tabs */}
                    <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <button
                        onClick={() => handleMediaTypeChange('image')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          mediaType === 'image'
                            ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4 inline mr-2" />
                        Image
                      </button>
                      <button
                        onClick={() => handleMediaTypeChange('video')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          mediaType === 'video'
                            ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
                  <div
                    className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6"
                    style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
                  >
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
                        className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        style={{
                          fontFamily:
                            '"Inter", "Noto Sans Devanagari", sans-serif',
                        }}
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
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors"
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
                  <div
                    className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6"
                    style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
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
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddTag}
                        className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                      >
                        Add Tag
                      </button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {formData.tags.map((tag, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 text-purple-500 hover:text-purple-700"
                            >
                              ×
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Advanced Settings */}
                  <div
                    className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/20 p-6"
                    style={{ boxShadow: '0 8px 32px rgba(87, 85, 254, 0.1)' }}
                  >
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
                      <motion.div
                        animate={{ rotate: showAdvancedSettings ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {showAdvancedSettings && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6"
                        >
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
                              className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700"
                              style={{
                                colorScheme: 'light',
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Visibility
                            </label>
                            <div className="space-y-3">
                              <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name="visibility"
                                  value="public"
                                  checked={formData.status !== 'private'}
                                  onChange={() =>
                                    handleInputChange('status', 'draft')
                                  }
                                  className="mr-3 text-purple-600 focus:ring-purple-500"
                                />
                                <Globe className="w-4 h-4 mr-2 text-green-600" />
                                <span className="font-medium">Public</span>
                              </label>
                              <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name="visibility"
                                  value="private"
                                  checked={formData.status === 'private'}
                                  onChange={() =>
                                    handleInputChange('status', 'private')
                                  }
                                  className="mr-3 text-purple-600 focus:ring-purple-500"
                                />
                                <Lock className="w-4 h-4 mr-2 text-red-600" />
                                <span className="font-medium">Private</span>
                              </label>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewPost;
