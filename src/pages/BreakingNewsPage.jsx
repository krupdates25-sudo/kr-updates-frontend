import { ArrowLeft, AlertCircle, Share2, MapPin, Maximize2, X, Clock } from 'lucide-react';
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
  const [isZoomed, setIsZoomed] = useState(false);

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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading breaking news...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !story) {
    return (
      <PageLayout>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Story Not Found</h2>
            <p className="text-gray-600 mb-6">
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
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
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
              <div className="mb-3 sm:mb-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group relative cursor-zoom-in" onClick={() => setIsZoomed(true)}>
                <img
                  src={story.image.url}
                  alt={story.image.alt || story.title}
                  className="w-full h-[280px] sm:h-[420px] md:h-[520px] lg:h-[60vh] object-contain select-none transition-transform duration-500 group-hover:scale-[1.02]"
                  draggable="false"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    return false;
                  }}
                />
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            )}

            {/* Article Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full shadow-sm animate-pulse">
                  Breaking News
                </span>
                {story?.category && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] sm:text-xs font-bold rounded-full border border-indigo-100">
                    {story.category}
                  </span>
                )}
                {story.location && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-full border border-emerald-100">
                    <MapPin className="w-3 h-3" />
                    {story.location}
                  </span>
                )}
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-[10px] sm:text-xs">•</span>
                  <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(story?.createdAt || story?.updatedAt)}
                  </div>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4 tracking-tight">
                {story.title}
              </h1>

              {story.excerpt && (
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-semibold italic border-l-4 border-red-500 pl-4 py-1">
                  {story.excerpt}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-8">
              <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-img:rounded-xl">
                <div
                  className="text-gray-800 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: story?.content || '',
                  }}
                />
              </div>
            </div>

            {/* Mobile/Tablet: Recommendations below content (prevents empty-feel) */}
            <div className="lg:hidden mt-4 space-y-4">
              {/* Recommended Posts */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/30">
                  <h3 className="text-base font-black text-blue-900 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                    Recommended Posts
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {loadingRecommended ? (
                    <div className="p-6 text-center text-gray-400 text-sm italic">
                      Loading...
                    </div>
                  ) : recommendedPosts.length > 0 ? (
                    recommendedPosts.slice(0, 6).map((item, idx) => {
                      const postSlug = item.slug || String(item._id || '');
                      return (
                        <div
                          key={item._id || idx}
                          className="p-4 hover:bg-blue-50/50 cursor-pointer transition-all group"
                          onClick={() => navigate(`/post/${postSlug}`)}
                        >
                          <p className="text-sm font-bold text-gray-900 mb-2 group-hover:text-blue-600 line-clamp-2 leading-tight">
                            {item.title}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded border border-blue-100">
                              {item.category || 'News'}
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400">
                              {item.viewCount || item.views || 0} views
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      No recommended posts found
                    </div>
                  )}
                </div>
              </div>

              {/* More Breaking News */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50/30">
                  <h3 className="text-base font-black text-red-900 flex items-center gap-2">
                    <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                    More Breaking News
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {loadingMoreBreaking ? (
                    <div className="p-6 text-center text-gray-400 text-sm italic">
                      Loading...
                    </div>
                  ) : moreBreaking.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      No more breaking news available
                    </div>
                  ) : (
                    moreBreaking.slice(0, 6).map((item, idx) => (
                      <div
                        key={item._id || idx}
                        className="p-4 hover:bg-red-50/50 cursor-pointer transition-all group"
                        onClick={() => navigate(`/breaking-news/${item._id}`)}
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-lg font-black text-red-100 group-hover:text-red-600 transition-colors">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 mb-2 group-hover:text-red-600 line-clamp-2 leading-tight">
                              {item.title}
                            </p>
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded border border-red-100">
                              {item.category}
                            </span>
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
          <aside className="hidden lg:block w-85 flex-shrink-0 space-y-6">
            {/* Recommended Posts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/30">
                <h3 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  Recommended Posts
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {loadingRecommended ? (
                  <div className="p-8 text-center text-gray-400 text-sm italic">
                    Loading suggestions...
                  </div>
                ) : recommendedPosts.length > 0 ? (
                  recommendedPosts.map((item, idx) => {
                    const postSlug = item.slug || String(item._id || '');
                    return (
                      <div
                        key={item._id || idx}
                        className="p-4 hover:bg-blue-50/50 cursor-pointer transition-all duration-300 group"
                        onClick={() => navigate(`/post/${postSlug}`)}
                      >
                        <p className="text-sm font-bold text-gray-900 mb-3 group-hover:text-blue-600 line-clamp-2 leading-tight">
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded border border-blue-100">
                            {item.category || 'News'}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                            {item.viewCount || item.views || 0} views
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No recommendations found
                  </div>
                )}
              </div>
            </div>

            {/* More Breaking News */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50/30">
                <h3 className="text-lg font-black text-red-900 tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                  Trending Stories
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {loadingMoreBreaking ? (
                  <div className="p-8 text-center text-gray-400 text-sm italic">
                    Checking for updates...
                  </div>
                ) : moreBreaking.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No other stories active
                  </div>
                ) : (
                  moreBreaking.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="p-4 hover:bg-red-50/50 cursor-pointer transition-all duration-300 group"
                      onClick={() => navigate(`/breaking-news/${item._id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-xl font-black text-red-200 group-hover:text-red-600 transition-colors leading-none">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 mb-2 group-hover:text-red-600 line-clamp-2 leading-tight">
                            {item.title}
                          </p>
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded border border-red-100">
                            {item.category || 'Breaking'}
                          </span>
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
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60]"
            onClick={() => setShowShareModal(false)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-xl font-black text-gray-900">
                  Share Breaking News
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full px-6 py-4 rounded-xl bg-[#25D366] text-white font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-3"
                >
                  Share on WhatsApp
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full px-6 py-4 rounded-xl border-2 border-gray-100 text-gray-800 font-black hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => handleShare(null)}
                  className="w-full px-6 py-4 rounded-xl bg-gray-900 text-white font-black hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Other Options
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Photo Zoom Modal */}
      {isZoomed && story.image?.url && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 transition-all animate-scale-in p-2 sm:p-4 lg:p-10" onClick={() => setIsZoomed(false)}>
          <button
            className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[110]"
            onClick={() => setIsZoomed(false)}
          >
            <X className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <img
            src={story.image.url}
            alt={story.image.alt || story.title}
            className="max-w-full max-h-full object-contain cursor-zoom-out shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
          {story.image.caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs sm:text-sm">
              {story.image.caption}
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
};

export default BreakingNewsPage;

