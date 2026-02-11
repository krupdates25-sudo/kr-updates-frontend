import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Share2,
  Clock,
  TrendingUp,
  Tag,
  Calendar,
  Eye,
  Sparkles,
  ArrowLeft,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Edit2,
  Save,
  Trash2,
} from 'lucide-react';
// Custom share icons from assets
import whatsappIcon from '../assets/whatsapp.png';
import facebookIcon from '../assets/facebook.png';
import linkIcon from '../assets/link.png';
import postService from '../services/postService';
import { breakingNewsService } from '../services/breakingNewsService';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import AdContainer from '../components/common/AdContainer';
import PageLayout from '../components/layout/PageLayout';
import Logo from '../components/common/Logo';
import { useSettings } from '../contexts/SettingsContext';
import OptimisticImage from '../components/common/OptimisticImage';
import { Helmet } from 'react-helmet-async';

const PostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { settings } = useSettings();
  const initialPost = location?.state?.initialPost || null;
  const [post, setPost] = useState(initialPost);
  const [isLoading, setIsLoading] = useState(!initialPost);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [authorDisplayName, setAuthorDisplayName] = useState('');
  const [isSavingAuthor, setIsSavingAuthor] = useState(false);
  const [isEditingReporter, setIsEditingReporter] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [isSavingReporter, setIsSavingReporter] = useState(false);
  const [similarPosts, setSimilarPosts] = useState([]);
  const [loadingSimilarPosts, setLoadingSimilarPosts] = useState(false);
  const [breakingNews, setBreakingNews] = useState([]);
  const [loadingBreakingNews, setLoadingBreakingNews] = useState(false);
  const { socket } = useSocket();
  
  // Ensure editing state is reset if user is not admin
  useEffect(() => {
    if (user?.role !== 'admin' && isEditingAuthor) {
      setIsEditingAuthor(false);
    }
  }, [user?.role, isEditingAuthor]);

  useEffect(() => {
    if (slug) {
      fetchPostDetails();
    }
  }, [slug]);

  // Scroll to top immediately when navigating to post details page
  useEffect(() => {
    // Immediate scroll to top (no smooth behavior for instant effect)
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also ensure any scrollable containers are at top
    const scrollableElements = document.querySelectorAll('[data-scroll-container]');
    scrollableElements.forEach(el => {
      el.scrollTop = 0;
    });
  }, [slug]);

  // Also scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Fetch breaking news (defer: non-critical for initial post paint)
  useEffect(() => {
    const run = () => fetchBreakingNews();
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, []);

  const fetchBreakingNews = async () => {
    try {
      setLoadingBreakingNews(true);
      const response = await breakingNewsService.getStories();
      if (response.success && Array.isArray(response.data)) {
        // Filter only active stories that haven't expired, limit to 5
        const now = new Date();
        const activeStories = response.data
          .filter((story) => {
            const isActive = story?.isActive !== false;
            const notExpired = !story?.expiresAt || new Date(story.expiresAt) > now;
            return isActive && notExpired;
          })
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 5);
        setBreakingNews(activeStories);
      } else {
        setBreakingNews([]);
      }
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      setBreakingNews([]);
    } finally {
      setLoadingBreakingNews(false);
    }
  };

  // Content protection - prevent copying
  useEffect(() => {
    const handleContextMenu = (e) => {
      // Allow context menu on buttons and interactive elements
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      // Prevent context menu on article content
      if (e.target.closest('[data-protected-content]')) {
        e.preventDefault();
        return false;
      }
    };

    const handleCopy = (e) => {
      // Allow copying from inputs and textareas
      if (e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      // Prevent copying from article content
      if (e.target.closest('[data-protected-content]')) {
        e.preventDefault();
        return false;
      }
    };

    const handleCut = (e) => {
      // Allow cutting from inputs and textareas
      if (e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      // Prevent cutting from article content
      if (e.target.closest('[data-protected-content]')) {
        e.preventDefault();
        return false;
      }
    };

    const handleSelectStart = (e) => {
      // Allow selection in inputs and textareas
      if (e.target.closest('input') || e.target.closest('textarea')) {
        return;
      }
      // Prevent text selection on article content
      if (e.target.closest('[data-protected-content]')) {
        e.preventDefault();
        return false;
      }
    };

    const handleKeyDown = (e) => {
      // Prevent Ctrl+A (Select All), Ctrl+C (Copy), Ctrl+X (Cut) on article content
      if (e.target.closest('[data-protected-content]')) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'c' || e.key === 'x')) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Generate Open Graph data for sharing previews
  const ogData = useMemo(() => {
    if (!post) return null;

    // Use current window location for dynamic URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/post/${post.slug || String(post._id || '')}`;
    const rawImageUrl = post.featuredImage?.url || post.featuredVideo?.thumbnail || post.featuredVideo?.url || '';
    const title = post.title || 'Post - KR Updates';
    
    // Create description - WhatsApp prefers 200 characters or less
    let description = post.excerpt || post.description || post.subheading || '';
    if (!description && post.content) {
      // Strip HTML tags and get first 200 characters
      const textContent = post.content.replace(/<[^>]*>/g, '').trim();
      description = textContent.substring(0, 200);
      if (textContent.length > 200) {
        description += '...';
      }
    }
    if (!description) {
      description = `Read more: ${post.title || 'Latest post from KR Updates'}`;
    }
    // Ensure description doesn't exceed WhatsApp's limit (200 chars)
    description = description.substring(0, 200).trim();

    // Image handling - ensure absolute URL and proper dimensions for WhatsApp
    let finalImageUrl = rawImageUrl;
    
    if (finalImageUrl) {
      // Ensure absolute URL
      if (!finalImageUrl.startsWith('http://') && !finalImageUrl.startsWith('https://')) {
        finalImageUrl = `${baseUrl}${finalImageUrl.startsWith('/') ? '' : '/'}${finalImageUrl}`;
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
      
      // Ensure HTTPS for WhatsApp compatibility
      if (finalImageUrl.startsWith('http://')) {
        finalImageUrl = finalImageUrl.replace('http://', 'https://');
      }
    }

    return {
      title,
      description,
      url: shareUrl,
      image: finalImageUrl,
      siteName: 'KR Updates',
    };
  }, [post]);

  useEffect(() => {
    if (!socket || !post?._id) return;

    const handleShareUpdate = (data) => {
      if (data.postId === post._id) {
        setShareCount(data.shareCount);
      }
    };

    socket.on('shareUpdate', handleShareUpdate);

    return () => {
      socket.off('shareUpdate', handleShareUpdate);
    };
  }, [socket, post?._id]);

  useEffect(() => {
    if (post?.shareCount !== undefined) {
      setShareCount(post.shareCount);
    }
  }, [post?.shareCount]);

  // Initialize author display name
  useEffect(() => {
    if (post?.author) {
      const displayName = post.authorDisplayName || `${post.author.firstName} ${post.author.lastName}`;
      setAuthorDisplayName(displayName);
    }
  }, [post?.author, post?.authorDisplayName]);

  const fetchPostDetails = async () => {
    if (!slug) return;
    
    // If we already have an optimistic post (from navigation state), don't blank the UI.
    if (!post) setIsLoading(true);
    try {
      let response;
      
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
      
      if (isObjectId) {
        console.log('Fetching post by ID:', slug);
        response = await postService.getPostById(slug);
      } else {
        console.log('Fetching post by slug:', slug);
        response = await postService.getPostBySlug(slug);
      }
      
      if (response?.data) {
        setPost(response.data);
        console.log('Post fetched successfully:', response.data.title, 'Status:', response.data.status);
        // Fetch similar posts after current post is loaded (defer so details page paints faster)
        const runSimilar = () =>
          fetchSimilarPosts(response.data._id, response.data.slug);
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(runSimilar, { timeout: 1500 });
        } else {
          setTimeout(runSimilar, 400);
        }
      } else {
        throw new Error('Post data not found in response');
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
      setPost(null);
      
      // For non-admins (including logged-out users), send them back safely.
      if (user?.role !== 'admin') {
        setTimeout(() => {
          navigate(user ? '/dashboard' : '/');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimilarPosts = async (currentPostId, currentPostSlug) => {
    if (!currentPostId) return;
    
    setLoadingSimilarPosts(true);
    try {
      // Fetch latest posts (we'll exclude current one and take 5)
      const response = await postService.getAllPosts({ 
        page: 1, 
        limit: 10 // Fetch more to ensure we have enough after filtering
      });
      
      // Backend returns: { data: { data: [...posts], pagination: {...} } }
      const posts = response?.data?.data || response?.data || [];
      
      if (Array.isArray(posts) && posts.length > 0) {
        // Filter out current post by both ID and slug to ensure it's excluded
        const filtered = posts
          .filter(p => {
            const postId = p._id || p.id;
            const postSlug = p.slug || '';
            const currentId = currentPostId || '';
            const currentSlug = currentPostSlug || '';
            
            // Exclude if ID matches (checking both string and object comparisons)
            if (String(postId) === String(currentId) || postId === currentId) {
              return false;
            }
            
            // Exclude if slug matches (and both are non-empty)
            if (currentSlug && postSlug && postSlug === currentSlug) {
              return false;
            }
            
            return true;
          })
          .slice(0, 5); // Take first 5 after filtering
        setSimilarPosts(filtered);
      } else {
        setSimilarPosts([]);
      }
    } catch (error) {
      console.error('Error fetching similar posts:', error);
      setSimilarPosts([]);
    } finally {
      setLoadingSimilarPosts(false);
    }
  };

  const handleApprovePost = async () => {
    if (!user || user.role !== 'admin') return;
    
    if (!showApproveConfirm) {
      setShowApproveConfirm(true);
      return;
    }

    setIsApproving(true);
    try {
      await postService.publishPost(post._id);
      await fetchPostDetails();
      setShowApproveConfirm(false);
      alert('Post approved and published successfully!');
    } catch (error) {
      console.error('Error approving post:', error);
      alert(error.response?.data?.message || 'Failed to approve post. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectPost = async () => {
    if (!user || user.role !== 'admin') return;
    
    const confirmReject = window.confirm(
      'Are you sure you want to reject this post? It will remain as draft and the author will be notified.'
    );
    
    if (!confirmReject) return;

    setIsRejecting(true);
    try {
      await postService.updatePost(post._id, { status: 'draft' });
      await fetchPostDetails();
      alert('Post rejected and set back to draft.');
    } catch (error) {
      console.error('Error rejecting post:', error);
      alert(error.response?.data?.message || 'Failed to reject post. Please try again.');
    } finally {
      setIsRejecting(false);
    }
  };

  const trackShare = async (platform) => {
    try {
      const response = await postService.sharePost(post._id, { platform });
      if (response.data?.shareCount !== undefined) {
        setShareCount(response.data.shareCount);
        setPost((prev) =>
          prev ? { ...prev, shareCount: response.data.shareCount } : prev
        );
      }
    } catch (trackError) {
      console.error('Failed to track share:', trackError);
      setShareCount((prev) => prev + 1);
      setPost((prev) =>
        prev ? { ...prev, shareCount: (prev.shareCount || 0) + 1 } : prev
      );
    }
  };

  const handleSaveAuthorName = async () => {
    // Double-check admin role
    if (!post || !user || user.role !== 'admin') {
      alert('Only admins can edit author names.');
      setIsEditingAuthor(false);
      return;
    }
    
    // Allow empty string to clear custom display name (will use author's real name)
    const trimmedName = authorDisplayName ? authorDisplayName.trim() : "";
    
    setIsSavingAuthor(true);
    try {
      const response = await postService.updatePost(post._id, {
        authorDisplayName: trimmedName || null, // Send null if empty to clear custom name
      });
      
      // Check response structure - ApiResponse returns { statusCode, data, message, success }
      if (response && (response.success !== false) && (response.statusCode === 200 || response.statusCode < 400)) {
        // Refresh post data to get updated authorDisplayName
        await fetchPostDetails();
        setIsEditingAuthor(false);
        // Show success message
        console.log('Author name updated successfully');
      } else {
        throw new Error(response?.message || 'Update failed');
      }
    } catch (error) {
      console.error('Failed to update author name:', error);
      const errorMessage = error?.message || error?.response?.data?.message || error?.data?.message || 'Failed to update author name. Please try again.';
      alert(errorMessage);
      // Reset to original value on error
      setAuthorDisplayName(post.authorDisplayName || `${post.author.firstName} ${post.author.lastName}`);
    } finally {
      setIsSavingAuthor(false);
    }
  };

  const handleSaveReporterName = async () => {
    // Double-check admin role
    if (!post || !user || user.role !== 'admin') {
      alert('Only admins can edit reporter names.');
      setIsEditingReporter(false);
      return;
    }

    try {
      setIsSavingReporter(true);
      await postService.updatePost(post._id, {
        reporterName: reporterName.trim() || null,
      });
      
      setPost(prev => ({
        ...prev,
        reporterName: reporterName.trim() || null,
      }));
      
      setIsEditingReporter(false);
      console.log('Reporter name updated successfully');
    } catch (error) {
      console.error('Failed to update reporter name:', error);
      // Extract error message from various possible error structures
      let errorMessage = 'Failed to update reporter name. Please try again.';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.response?.data) {
        // Handle case where error.response.data is the error object itself
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : error.response.data.message || JSON.stringify(error.response.data);
      }
      
      alert(errorMessage);
      // Reset to original value on error
      setReporterName(post.reporterName || post.authorDisplayName || `${post.author.firstName} ${post.author.lastName}`);
    } finally {
      setIsSavingReporter(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !user || user.role !== 'admin') {
      alert('Only admins can delete posts.');
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${post.title}"? This action cannot be undone and the post will be permanently removed.`
    );
    
    if (!isConfirmed) return;

    try {
      await postService.deletePost(post._id);
      alert('Post deleted successfully');
      navigate('/admin/posts'); // Redirect to admin posts management
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleShare = async (platform = null) => {
    // Use current window location for dynamic URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${baseUrl}/post/${
      post?.slug || String(post?._id || '')
    }`;

    setShowShareModal(false);

    try {
      if (platform === 'whatsapp') {
        // Create share text with title, subtitle, and content preview
        let shareText = '';
        
        // Add title
        if (post?.title) {
          shareText += `📰 ${post.title}\n\n`;
        }
        
        // Add subtitle/description
        if (post?.description || post?.subheading || post?.excerpt) {
          const subtitle = post.description || post.subheading || post.excerpt;
          shareText += `${subtitle}\n\n`;
        }
        
        // Add content preview (first 150 characters, strip HTML) - shorter to leave room for image preview
        if (post?.content) {
          const textContent = post.content.replace(/<[^>]*>/g, '').trim();
          const preview = textContent.length > 150 
            ? textContent.substring(0, 150) + '...' 
            : textContent;
          shareText += `${preview}\n\n`;
        }
        
        // Add link at the end - WhatsApp will automatically fetch image preview from OG tags
        shareText += `${shareUrl}`;
        
        // WhatsApp will automatically show image preview from Open Graph tags when link is shared
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
        await trackShare('whatsapp');
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        await trackShare('clipboard');
      } else {
        const shareData = {
          title: `${post?.title} - KR Updates`,
          text: post?.excerpt || post?.description,
          url: shareUrl,
        };

        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare(shareData)
        ) {
          await navigator.share(shareData);
          await trackShare('native_share');
        } else {
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
          await trackShare('clipboard_fallback');
        }
      }
    } catch (shareError) {
      console.error('Share failed:', shareError);
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        await trackShare('clipboard_fallback');
      } catch {
        alert(`Share this link: ${shareUrl}`);
      }
    }
  };

  const formatDate = (dateString) => {
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

  if (isLoading && !post) {
    return (
      <PageLayout hideSidebar={!user} hideBottomNav={!user}>
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-2/3 bg-gray-200 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-[260px] sm:h-[420px] bg-gray-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!post) {
    return (
      <PageLayout hideSidebar={!user} hideBottomNav={!user}>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h2>
            <p className="text-gray-600 mb-6">
              {user?.role === 'admin' 
                ? 'The post you are looking for may not exist or may have been deleted.'
                : 'The post you are looking for does not exist or is not available.'}
            </p>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {user ? 'Back to Dashboard' : 'Back to Home'}
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      {/* Open Graph Meta Tags for WhatsApp and Social Media Sharing */}
      {ogData && (
        <Helmet>
          <title>{ogData.title}</title>
          <meta name="description" content={ogData.description} />
          <meta name="author" content="KR Updates" />
          
          {/* Open Graph / Facebook / WhatsApp */}
          <meta property="og:type" content="article" />
          <meta property="og:url" content={ogData.url} />
          <meta property="og:title" content={ogData.title} />
          <meta property="og:description" content={ogData.description} />
          <meta property="og:site_name" content={ogData.siteName} />
          <meta property="og:locale" content="en_US" />
          
          {/* Open Graph Image - Critical for WhatsApp previews */}
          {ogData.image && (
            <>
              <meta property="og:image" content={ogData.image} />
              <meta property="og:image:secure_url" content={ogData.image} />
              <meta property="og:image:url" content={ogData.image} />
              <meta property="og:image:type" content="image/jpeg" />
              <meta property="og:image:width" content="1200" />
              <meta property="og:image:height" content="630" />
              <meta property="og:image:alt" content={ogData.title} />
              <meta name="image" content={ogData.image} />
              <link rel="image_src" href={ogData.image} />
            </>
          )}
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={ogData.url} />
          <meta name="twitter:title" content={ogData.title} />
          <meta name="twitter:description" content={ogData.description} />
          {ogData.image && (
            <meta name="twitter:image" content={ogData.image} />
          )}
        </Helmet>
      )}
      
      <PageLayout activeTab="feed" hideSidebar={!user} hideBottomNav={!user}>
        {/* Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{user ? 'Back to Dashboard' : 'Back to Home'}</span>
            <span className="sm:hidden">Back</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 dark:text-gray-100 text-sm font-semibold"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4">
        {/* Main Layout: Article + Sidebar */}
        <div className="flex gap-4 lg:gap-6 xl:gap-8">
          {/* Article Content - Left Side */}
          <div className="flex-1 min-w-0">
            {/* Top Ad */}
            <div className="mb-4 sm:mb-6">
              <AdContainer position="top" postIndex={0} />
            </div>
            {/* Featured Media */}
            {(post?.featuredImage?.url || post?.featuredVideo?.url) && (
              <div 
                className="mb-3 sm:mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                data-protected-content
              >
                {post?.featuredVideo?.url ? (
                  <video
                    src={post.featuredVideo.url}
                    controls
                    className="w-full h-[280px] sm:h-[420px] md:h-[520px] lg:h-[60vh] object-cover select-none"
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      pointerEvents: 'auto',
                      WebkitUserDrag: 'none',
                      userDrag: 'none',
                    }}
                    draggable="false"
                    onContextMenu={(e) => {
                      e.preventDefault();
                      return false;
                    }}
                    onDragStart={(e) => {
                      e.preventDefault();
                      return false;
                    }}
                    poster={
                      post.featuredVideo.thumbnail || post.featuredImage?.url
                    }
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <OptimisticImage
                    src={post?.featuredImage?.url}
                    alt={post?.title || 'Post image'}
                    className="w-full h-[280px] sm:h-[420px] md:h-[520px] lg:h-[60vh]"
                    imgClassName="object-cover select-none"
                    loading="eager"
                    style={{
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      pointerEvents: 'auto',
                      WebkitUserDrag: 'none',
                      userDrag: 'none',
                    }}
                  />
                )}
              </div>
            )}

            {/* Article Header */}
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 md:p-5 mb-3 sm:mb-4"
              data-protected-content
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              {/* Category and Tags */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                {post?.category && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                )}
                {post?.isFeatured && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </div>
                )}
                {post?.isTrending && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </div>
                )}
              </div>

              {/* Article Title */}
              <h1 
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2 sm:mb-3 select-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                {post?.title}
              </h1>

              {/* Subheading (backend usually provides `excerpt`) */}
              {(post?.subheading || post?.description || post?.excerpt) && (
                <p 
                  className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-3 sm:mb-4 font-medium select-none"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  {post.subheading || post.description || post.excerpt}
                </p>
              )}

              {/* Metadata */}
              <div className="flex flex-col gap-3 sm:gap-4 mb-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Date, Reading Time, Views, Share */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post?.publishedAt || post?.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{post?.readingTime || 5} min read</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>{post?.viewCount || 0} views</span>
                  </div>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
                
                {/* Author and Publisher Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {/* Author */}
                  {post?.author && (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            News by:
                          </span>
                          {/* Only show edit button to admins */}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (user?.role === 'admin') {
                                  setIsEditingReporter(!isEditingReporter);
                                  // Initialize reporterName when starting to edit
                                  if (!isEditingReporter) {
                                    setReporterName(post.reporterName || post.authorDisplayName || `${post.author.firstName} ${post.author.lastName}`);
                                  }
                                }
                              }}
                              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Edit reporter name"
                              aria-label="Edit reporter name"
                            >
                              <Edit2 className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            </button>
                          )}
                        </div>
                        {/* Only allow editing if user is admin */}
                        {isEditingReporter && user?.role === 'admin' ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={reporterName}
                              onChange={(e) => setReporterName(e.target.value)}
                              className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveReporterName();
                                } else if (e.key === 'Escape') {
                                  setIsEditingReporter(false);
                                  setReporterName(post.reporterName || post.authorDisplayName || `${post.author.firstName} ${post.author.lastName}`);
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveReporterName}
                              disabled={isSavingReporter}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingReporter(false);
                                setReporterName(post.reporterName || post.authorDisplayName || `${post.author.firstName} ${post.author.lastName}`);
                              }}
                              className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-semibold">
                              {post.reporterName || post.authorDisplayName || `${post.author.firstName} ${post.author.lastName}`}
                            </span>
                            {post.author.title && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {post.author.title}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Publisher */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <div className="text-purple-600 dark:text-purple-400 font-bold text-xs">
                        {(settings?.siteName || 'KR Updates').substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Publisher
                      </span>
                      <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-semibold">
                        {settings?.siteName || 'KR Updates'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin Approval Section */}
                {user?.role === 'admin' && post?.status === 'draft' && (
                  <div className="mb-3 p-3 sm:p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <h3 className="text-sm sm:text-base font-semibold text-yellow-900">
                        Post Review Required
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-yellow-800 mb-3">
                      This post is waiting for your approval. Review the content and decide whether to publish or reject it.
                    </p>
                    
                    {showApproveConfirm ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-yellow-900">
                          Are you sure you want to approve and publish this post?
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleApprovePost}
                            disabled={isApproving}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                          >
                            {isApproving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Yes, Approve & Publish
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowApproveConfirm(false)}
                            disabled={isApproving}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={handleApprovePost}
                          disabled={isApproving || isRejecting}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve & Publish
                        </button>
                        <button
                          onClick={handleRejectPost}
                          disabled={isApproving || isRejecting}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                        >
                          {isRejecting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Reject
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDeletePost}
                          disabled={isApproving || isRejecting}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 font-medium"
                          title="Delete this post permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Actions Section for Published Posts */}
                {user?.role === 'admin' && post?.status === 'published' && (
                  <div className="mb-3 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <h3 className="text-sm sm:text-base font-semibold text-green-900">
                        Published Post Actions
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-green-800 mb-3">
                      This post is published and visible to all users. You can manage or delete it from here.
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={handleDeletePost}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        title="Delete this post permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Post
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Article Content */}
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 md:p-5 mb-3 sm:mb-4 border border-gray-200 dark:border-gray-700"
              data-protected-content
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
            >
              {/* Tags */}
              {post?.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <Tag className="w-3 h-3" />#{tag}
                    </span>
                  ))}
                </div>
              )}


              {/* Main Content */}
              <div 
                className="prose prose-sm sm:prose-base max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100"
                data-protected-content
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                <div
                  className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm sm:text-base select-none"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  dangerouslySetInnerHTML={{
                    __html: post?.content || 'Loading content...',
                  }}
                  onContextMenu={(e) => {
                    if (e.target.closest('button') || e.target.closest('a')) return;
                    e.preventDefault();
                    return false;
                  }}
                  onCopy={(e) => {
                    if (e.target.closest('input') || e.target.closest('textarea')) return;
                    e.preventDefault();
                    return false;
                  }}
                  onCut={(e) => {
                    if (e.target.closest('input') || e.target.closest('textarea')) return;
                    e.preventDefault();
                    return false;
                  }}
                  onSelectStart={(e) => {
                    if (e.target.closest('input') || e.target.closest('textarea')) return;
                    e.preventDefault();
                    return false;
                  }}
                />
              </div>
            </div>

            {/* Mobile/Tablet: Recommendations below content (prevents empty-feel) */}
            <div className="lg:hidden mt-4 space-y-4">
              {/* Similar Posts */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="text-base font-bold text-blue-900 dark:text-blue-100">
                    Similar Posts
                  </h3>
                </div>
                <div>
                  {loadingSimilarPosts ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Loading...
                    </div>
                  ) : similarPosts.length > 0 ? (
                    similarPosts.slice(0, 6).map((item, idx, array) => {
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
                      No similar posts found
                    </div>
                  )}
                </div>
              </div>

              {/* Breaking News */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                  <h3 className="text-base font-bold text-red-900 dark:text-red-100">
                    Breaking News
                  </h3>
                </div>
                <div>
                  {loadingBreakingNews ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Loading breaking news...
                    </div>
                  ) : breakingNews.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No breaking news available
                    </div>
                  ) : (
                    breakingNews.slice(0, 6).map((item, idx, array) => (
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

          {/* Right Sidebar - Similar Posts, Breaking News */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-4">
            {/* Similar Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                <h3 className="text-base font-bold text-blue-900 dark:text-blue-100">
                  Similar Posts
                </h3>
              </div>
              <div>
                {loadingSimilarPosts ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Loading...
                  </div>
                ) : similarPosts.length > 0 ? (
                  similarPosts.map((item, idx, array) => {
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
                    No similar posts found
                  </div>
                )}
              </div>
            </div>

            {/* Breaking News */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                <h3 className="text-base font-bold text-red-900 dark:text-red-100">
                  Breaking News
                </h3>
              </div>
              <div>
                {loadingBreakingNews ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Loading breaking news...
                  </div>
                ) : breakingNews.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No breaking news available
                  </div>
                ) : (
                  breakingNews.map((item, idx, array) => (
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Share Article
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Preview Section - Scrollable */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 overflow-y-auto flex-1 min-h-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Preview of link preview card (as it will appear on WhatsApp/Facebook):
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm">
                  {(post?.featuredImage?.url || post?.featuredVideo?.thumbnail) && (
                    <div 
                      className="w-full h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden"
                      data-protected-content
                    >
                      <img
                        src={post.featuredImage?.url || post.featuredVideo?.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover select-none"
                        style={{ 
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          pointerEvents: 'auto',
                          WebkitUserDrag: 'none',
                          userDrag: 'none'
                        }}
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
                  <div className="p-3 space-y-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                      {post?.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {post?.excerpt || post?.description || 'Read the full article on KR Updates'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      KR Updates
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 break-all pt-1 border-t border-gray-200 dark:border-gray-700">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/post/${post?.slug || String(post?._id || '')}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Options */}
              <div className="p-4 space-y-3 flex-shrink-0">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-green-200 dark:border-green-800"
                >
                  <img
                    src={whatsappIcon}
                    alt="WhatsApp"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Share on WhatsApp
                  </span>
                </button>

                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center justify-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                >
                  <img
                    src={linkIcon}
                    alt="Copy Link"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Copy Link
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      </PageLayout>
    </>
  );
};

export default PostPage;
