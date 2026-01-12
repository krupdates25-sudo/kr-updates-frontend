import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Share2 } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { breakingNewsService } from '../services/breakingNewsService';
import postService from '../services/postService';
import AdContainer from '../components/common/AdContainer';

const BreakingNewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [moreBreaking, setMoreBreaking] = useState([]);
  const [loadingMoreBreaking, setLoadingMoreBreaking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStory();
    }
  }, [id]);

  useEffect(() => {
    // Keep sidebar content fresh when navigating between stories
    fetchRecommendedPosts();
    fetchMoreBreaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Update Open Graph meta tags for sharing previews (WhatsApp, Facebook, etc.)
  useEffect(() => {
    if (!story) return;

    // Use current window location for dynamic URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/breaking-news/${story._id || id}`;
    const imageUrl = story.image?.url || '';
    const title = story.title || 'Breaking News - KR Updates';
    
    // Create description - WhatsApp prefers 200 characters or less
    let description = story.excerpt || '';
    if (!description && story.content) {
      // Strip HTML tags and get first 200 characters
      const textContent = story.content.replace(/<[^>]*>/g, '').trim();
      description = textContent.substring(0, 200);
      if (textContent.length > 200) {
        description += '...';
      }
    }
    if (!description) {
      description = `Breaking news: ${story.title || 'Latest updates from KR Updates'}`;
    }
    // Ensure description doesn't exceed WhatsApp's limit
    description = description.substring(0, 200);

    const updateMetaTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateNameTag = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update title tag
    document.title = title;

    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', shareUrl);
    updateMetaTag('og:type', 'article');
    updateMetaTag('og:site_name', 'KR Updates');
    updateMetaTag('og:locale', 'en_US');

    // Image handling - ensure absolute URL and proper dimensions for WhatsApp
    if (imageUrl) {
      let finalImageUrl = imageUrl;
      
      // Ensure absolute URL
      if (!finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
        finalImageUrl = `${baseUrl}${finalImageUrl}`;
      }

      // Optimize Cloudinary images for OG sharing
      if (finalImageUrl.includes('cloudinary.com')) {
        try {
          const urlObj = new URL(finalImageUrl);
          const params = new URLSearchParams(urlObj.search);
          
          // Set optimal dimensions for WhatsApp (1200x630 recommended)
          params.set('w', '1200');
          params.set('h', '630');
          params.set('c', 'fill');
          params.set('f', 'auto');
          params.set('q', 'auto');
          
          urlObj.search = params.toString();
          finalImageUrl = urlObj.toString();
        } catch (e) {
          console.warn('Could not parse image URL:', e);
        }
      }
      
      // Set all OG image tags (WhatsApp needs these)
      updateMetaTag('og:image', finalImageUrl);
      updateMetaTag('og:image:secure_url', finalImageUrl);
      updateMetaTag('og:image:url', finalImageUrl);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:type', 'image/jpeg');
      updateMetaTag('og:image:alt', story.title);
      
      // Additional image meta for compatibility
      updateNameTag('image', finalImageUrl);
      
      // Legacy image tag
      let linkTag = document.querySelector('link[rel="image_src"]');
      if (!linkTag) {
        linkTag = document.createElement('link');
        linkTag.setAttribute('rel', 'image_src');
        document.head.appendChild(linkTag);
      }
      linkTag.setAttribute('href', finalImageUrl);
    }

    // Twitter Card tags
    updateNameTag('twitter:card', 'summary_large_image');
    updateNameTag('twitter:title', title);
    updateNameTag('twitter:description', description);
    updateNameTag('twitter:url', shareUrl);
    if (imageUrl) {
      updateNameTag('twitter:image', imageUrl);
    }

    // Additional meta tags
    updateNameTag('description', description);
    updateNameTag('author', 'KR Updates');
  }, [story, id]);

  const fetchStory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await breakingNewsService.getStoryById(id);
      if (response.success && response.data) {
        setStory(response.data);
      } else {
        setError('Story not found');
      }
    } catch (err) {
      console.error('Error fetching breaking news story:', err);
      setError('Failed to load breaking news story');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendedPosts = async () => {
    try {
      setLoadingRecommended(true);
      const resp = await postService.getAllPosts({ page: 1, limit: 6 });
      const list = resp?.data?.data || resp?.data || [];
      setRecommendedPosts(Array.isArray(list) ? list : []);
    } catch (e) {
      setRecommendedPosts([]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const fetchMoreBreaking = async () => {
    try {
      setLoadingMoreBreaking(true);
      const response = await breakingNewsService.getStories();
      if (response.success && Array.isArray(response.data)) {
        const now = new Date();
        const activeStories = response.data
          .filter(
            (s) => {
              const isActive = s?.isActive !== false;
              const notExpired = !s?.expiresAt || new Date(s.expiresAt) > now;
              const notSame = String(s?._id || '') !== String(id || '');
              return isActive && notExpired && notSame;
            }
          )
          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
          .slice(0, 5);
        setMoreBreaking(activeStories);
      } else {
        setMoreBreaking([]);
      }
    } catch (e) {
      setMoreBreaking([]);
    } finally {
      setLoadingMoreBreaking(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleShare = async (platform = null) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/breaking-news/${story?._id || id}`;
    setShowShareModal(false);

    try {
      if (platform === 'whatsapp') {
        // Create share text with title, subtitle, and content preview
        let shareText = '';
        
        // Add title
        if (story?.title) {
          shareText += `🚨 BREAKING: ${story.title}\n\n`;
        }
        
        // Add excerpt/description
        if (story?.excerpt) {
          shareText += `${story.excerpt}\n\n`;
        }
        
        // Add content preview (first 150 characters, strip HTML) - shorter to leave room for image preview
        if (story?.content) {
          const textContent = story.content.replace(/<[^>]*>/g, '').trim();
          const preview = textContent.length > 150 
            ? textContent.substring(0, 150) + '...' 
            : textContent;
          shareText += `${preview}\n\n`;
        }
        
        // Add link at the end - WhatsApp will automatically fetch image preview from OG tags
        shareText += `${shareUrl}`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
        return;
      }

      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        return;
      }

      const shareData = {
        title: `${story?.title || 'Breaking News'} - KR Updates`,
        text: story?.excerpt || '',
        url: shareUrl,
      };

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (shareError) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch {
        alert(`Share this link: ${shareUrl}`);
      }
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading breaking news...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !story) {
    return (
      <PageLayout>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Story Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The breaking news story you are looking for does not exist or is not available.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activeTab="feed">
      {/* Back Bar (matches PostPage style) */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">Back</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex gap-4 lg:gap-6 xl:gap-8">
          {/* Left: Article */}
          <div className="flex-1 min-w-0">
            {/* Top Ad */}
            <div className="mb-4 sm:mb-6">
              <AdContainer position="top" postIndex={0} />
            </div>

            {/* Featured Image (fit inside container, no awkward cropping) */}
            {story.image?.url && (
              <div className="mb-3 sm:mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={story.image.url}
                  alt={story.image.alt || story.title}
                  className="w-full h-[280px] sm:h-[420px] md:h-[520px] lg:h-[60vh] object-contain select-none"
                  draggable="false"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                  }}
                  onDragStart={(e) => {
                    e.preventDefault();
                    return false;
                  }}
                />
              </div>
            )}

            {/* Article Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 md:p-5 mb-3 sm:mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                  Breaking
                </span>
                {story?.category && (
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold rounded-full">
                    {story.category}
                  </span>
                )}
                {!!formatDate(story?.createdAt || story?.updatedAt) && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(story?.createdAt || story?.updatedAt)}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2">
                {story.title}
              </h1>

              {story.excerpt && (
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed font-medium">
                  {story.excerpt}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 md:p-5">
              <div className="prose prose-sm sm:prose-base max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                <div
                  className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm sm:text-base"
                  dangerouslySetInnerHTML={{
                    __html: story?.content || '',
                  }}
                />
              </div>
            </div>

            {/* Mobile/Tablet: Recommendations below content (prevents empty-feel) */}
            <div className="lg:hidden mt-4 space-y-4">
              {/* Recommended Posts */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="text-base font-bold text-blue-900 dark:text-blue-100">
                    Recommended Posts
                  </h3>
                </div>
                <div>
                  {loadingRecommended ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Loading...
                    </div>
                  ) : recommendedPosts.length > 0 ? (
                    recommendedPosts.slice(0, 6).map((item, idx, array) => {
                      const postSlug = item.slug || String(item._id || '');
                      return (
                        <div
                          key={item._id || idx}
                          className={`p-3 sm:p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors ${
                            idx !== array.length - 1
                              ? 'border-b border-gray-200 dark:border-gray-700'
                              : ''
                          }`}
                          onClick={() => navigate(`/post/${postSlug}`)}
                        >
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            {item.category && (
                              <>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded font-medium">
                                  {item.category}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500">•</span>
                              </>
                            )}
                            <span className="text-gray-500 dark:text-gray-400">
                              {item.viewCount || item.views || 0} views
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No recommended posts found
                    </div>
                  )}
                </div>
              </div>

              {/* More Breaking News */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                  <h3 className="text-base font-bold text-red-900 dark:text-red-100">
                    More Breaking News
                  </h3>
                </div>
                <div>
                  {loadingMoreBreaking ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Loading breaking news...
                    </div>
                  ) : moreBreaking.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No breaking news available
                    </div>
                  ) : (
                    moreBreaking.slice(0, 6).map((item, idx, array) => (
                      <div
                        key={item._id || idx}
                        className={`p-3 sm:p-4 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors ${
                          idx !== array.length - 1
                            ? 'border-b border-gray-200 dark:border-gray-700'
                            : ''
                        }`}
                        onClick={() => navigate(`/breaking-news/${item._id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-base font-bold text-red-600 dark:text-red-400 flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded font-medium">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Recommended + More Breaking */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-4">
            {/* Recommended Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                <h3 className="text-base font-bold text-blue-900 dark:text-blue-100">
                  Recommended Posts
                </h3>
              </div>
              <div>
                {loadingRecommended ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Loading...
                  </div>
                ) : recommendedPosts.length > 0 ? (
                  recommendedPosts.map((item, idx, array) => {
                    const postSlug = item.slug || String(item._id || '');
                    return (
                      <div
                        key={item._id || idx}
                        className={`p-3 sm:p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors ${
                          idx !== array.length - 1
                            ? 'border-b border-gray-200 dark:border-gray-700'
                            : ''
                        }`}
                        onClick={() => navigate(`/post/${postSlug}`)}
                      >
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          {item.category && (
                            <>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded font-medium">
                                {item.category}
                              </span>
                              <span className="text-gray-400 dark:text-gray-500">•</span>
                            </>
                          )}
                          <span className="text-gray-500 dark:text-gray-400">
                            {item.viewCount || item.views || 0} views
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No recommended posts found
                  </div>
                )}
              </div>
            </div>

            {/* More Breaking News */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                <h3 className="text-base font-bold text-red-900 dark:text-red-100">
                  More Breaking News
                </h3>
              </div>
              <div>
                {loadingMoreBreaking ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Loading breaking news...
                  </div>
                ) : moreBreaking.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No breaking news available
                  </div>
                ) : (
                  moreBreaking.map((item, idx, array) => (
                    <div
                      key={item._id || idx}
                      className={`p-3 sm:p-4 hover:bg-red-50 dark:hover:bg-red-900/10 cursor-pointer transition-colors ${
                        idx !== array.length - 1
                          ? 'border-b border-gray-200 dark:border-gray-700'
                          : ''
                      }`}
                      onClick={() => navigate(`/breaking-news/${item._id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-base font-bold text-red-600 dark:text-red-400 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded font-medium">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <>
          <div
            className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm z-50"
            onClick={() => setShowShareModal(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Share Breaking News
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full px-4 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                >
                  Share on WhatsApp
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-800 dark:text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => handleShare(null)}
                  className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Share (More options)
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default BreakingNewsPage;

