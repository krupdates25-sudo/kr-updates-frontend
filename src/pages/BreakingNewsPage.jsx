import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Share2, MapPin, Maximize2, X, Clock, Calendar, Eye, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import PageLayout from '../components/layout/PageLayout';
import { breakingNewsService } from '../services/breakingNewsService';
import postService from '../services/postService';
import translateService from '../services/translateService';
import AdContainer from '../components/common/AdContainer';
import { useLanguageLocation } from '../contexts/LanguageLocationContext';
import { useSettings } from '../contexts/SettingsContext';
// Custom share icons from assets
import whatsappIcon from '../assets/whatsapp.png';
import facebookIcon from '../assets/facebook.png';
import linkIcon from '../assets/link.png';

const BreakingNewsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { language: currentLanguage } = useLanguageLocation();
  const [story, setStory] = useState(null);
  const [translatedStory, setTranslatedStory] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
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

  // Translation logic
  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage === 'en' && story && story.content) {
        setIsTranslating(true);
        try {
          const [titleRes, contentRes, excerptRes] = await Promise.all([
            translateService.translateText(story.title, 'en'),
            translateService.translateText(story.content, 'en'),
            story.excerpt
              ? translateService.translateText(story.excerpt, 'en')
              : Promise.resolve({ translatedText: '' })
          ]);

          setTranslatedStory({
            ...story,
            title: titleRes.translatedText || story.title,
            content: contentRes.translatedText || story.content,
            excerpt: story.excerpt ? (excerptRes.translatedText || story.excerpt) : story.excerpt
          });
        } catch (error) {
          console.error('Translation failed:', error);
        } finally {
          setIsTranslating(false);
        }
      } else {
        setTranslatedStory(null);
      }
    };

    translateContent();
  }, [currentLanguage, story]);

  // Use translated content if available
  const displayStory = translatedStory || story;

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
        // Create share text with title (bold) and excerpt
        let shareText = '';

        // Add title in bold (WhatsApp uses * for bold)
        if (story?.title) {
          shareText += `*${story.title}*\n\n`;
        }

        // Add excerpt/description
        if (story?.excerpt) {
          shareText += `${story.excerpt}\n\n`;
        }

        // Add link - WhatsApp will automatically fetch image preview from OG tags
        shareText += `${shareUrl}`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
        return;
      }

      if (platform === 'facebook') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        window.open(facebookUrl, '_blank');
        return;
      }

      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        return;
      }

      // Native/system share (default)
      if (navigator.share) {
        // Include title and excerpt in share text
        const shareTitle = story?.title || 'Breaking News - KR Updates';
        let shareText = '';
        
        // Add title prominently
        if (story?.title) {
          shareText += `${story.title}\n\n`;
        }
        
        // Add excerpt/description
        if (story?.excerpt) {
          shareText += `${story.excerpt}\n\n`;
        }
        
        const baseShareData = {
          title: shareTitle,
          text: shareText.trim() || shareTitle,
          url: shareUrl,
        };

        // Try to attach image if supported (system-level sharing with image)
        const imageUrl = story?.image?.url || null;
        if (imageUrl && navigator.canShare) {
          try {
            const resp = await fetch(imageUrl, { mode: 'cors' });
            if (resp.ok) {
              const blob = await resp.blob();
              const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
              const file = new File([blob], `kr-breaking.${ext}`, { type: blob.type || 'image/jpeg' });
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({ ...baseShareData, files: [file] });
                return;
              }
            }
          } catch {
            // fall back to sharing URL only
          }
        }
        
        await navigator.share(baseShareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (shareError) {
      console.error('Share failed:', shareError);
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
      <Helmet>
        <title>{displayStory?.title || 'Breaking News'} - KR Updates</title>
        <meta name="description" content={displayStory?.excerpt || displayStory?.title} />
      </Helmet>

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
            onClick={async () => {
              // Prefer native/system share for the main Share action
              // Fallback to our share modal if Web Share API isn't available
              if (navigator.share) {
                await handleShare(null);
                return;
              }
              setShowShareModal(true);
            }}
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
                {displayStory?.category && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] sm:text-xs font-bold rounded-full border border-indigo-100">
                    {displayStory.category}
                  </span>
                )}
                {displayStory?.location && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-full border border-emerald-100">
                    <MapPin className="w-3 h-3" />
                    {displayStory.location}
                  </span>
                )}
                {isTranslating && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded animate-pulse">
                    Translating...
                  </span>
                )}
                {translatedStory && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                    TRANSLATED
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4 tracking-tight">
                {displayStory?.title}
              </h1>

              {displayStory?.excerpt && (
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-semibold italic border-l-4 border-red-500 pl-4 py-1 mb-4">
                  {displayStory.excerpt}
                </p>
              )}

              {/* Metadata - Premium Style like PostPage */}
              <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(displayStory?.publishedAt || displayStory?.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{displayStory?.readingTime || 2} min read</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>{displayStory?.viewCount || story?.views || 0} views</span>
                  </div>
                  <button
                    onClick={async () => {
                      // Prefer native/system share for the main Share action
                      // Fallback to our share modal if Web Share API isn't available
                      if (navigator.share) {
                        await handleShare(null);
                        return;
                      }
                      setShowShareModal(true);
                    }}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Publisher Row */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                      Publisher
                    </span>
                    <span className="text-sm font-black text-gray-900 leading-none">
                      {settings?.siteName || 'KR UPDATES'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-8">
              <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-img:rounded-xl">
                <div
                  className="text-gray-800 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: displayStory?.content || '',
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
                      return (
                        <div
                          key={item._id || idx}
                          className="p-4 hover:bg-blue-50/50 cursor-pointer transition-all group"
                          onClick={() => navigate(`/post/${item._id}`)}
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
                    return (
                      <div
                        key={item._id || idx}
                        className="p-4 hover:bg-blue-50/50 cursor-pointer transition-all duration-300 group"
                        onClick={() => navigate(`/post/${item._id}`)}
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

      {/* Share Modal - Matching PostPage style */}
      {showShareModal && (
        <>
          <div
            className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm z-50"
            onClick={() => setShowShareModal(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  Share Breaking News
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Preview Section - Show title and excerpt */}
              <div className="p-4 border-b border-gray-200 overflow-y-auto flex-1 min-h-0">
                <p className="text-xs text-gray-500 mb-3">
                  Share Preview:
                </p>
                <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm p-4">
                  <h4 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    {displayStory?.title}
                  </h4>
                  {displayStory?.excerpt && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {displayStory.excerpt}
                    </p>
                  )}
                </div>
              </div>

              {/* Share Options */}
              <div className="p-4 space-y-3 flex-shrink-0">
                <button
                  onClick={() => handleShare(null)}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                >
                  <Share2 className="w-5 h-5 text-blue-700" />
                  <span className="text-sm font-medium text-gray-900">
                    Share (More options)
                  </span>
                </button>

                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                >
                  <img
                    src={whatsappIcon}
                    alt="WhatsApp"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Share on WhatsApp
                  </span>
                </button>

                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                >
                  <img
                    src={facebookIcon}
                    alt="Facebook"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Share on Facebook
                  </span>
                </button>

                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  <img
                    src={linkIcon}
                    alt="Copy Link"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Copy Link
                  </span>
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

