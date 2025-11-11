import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  TrendingUp,
  Send,
  Tag,
  Calendar,
  Eye,
  Sparkles,
  Reply,
  MoreHorizontal,
  ThumbsUp,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  X,
} from 'lucide-react';
import postService from '../services/postService';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import useLike from '../hooks/useLike';
import AdContainer from '../components/common/AdContainer';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';

const PostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [shareCount, setShareCount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCommentsMobile, setShowCommentsMobile] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [availableUsers, setAvailableUsers] = useState([]);
  const { user } = useAuth();
  const { socket, joinPost, leavePost } = useSocket();

  // Use the enhanced like hook
  const {
    isLiked,
    likeCount,
    setLikeCount,
    isLoading: likeLoading,
    handleLike,
  } = useLike(post?._id, post?.isLiked || false, post?.likeCount || 0);

  useEffect(() => {
    if (slug) {
      fetchPostDetails();
      fetchComments();
      // Join the post room for real-time updates
      if (post?._id) {
        joinPost(post._id);
      }
    }

    return () => {
      if (post?._id) {
        // Leave the post room when component unmounts
        leavePost(post._id);
      }
    };
  }, [slug, post?._id, joinPost, leavePost]);

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    if (!socket || !post?._id) return;

    const handleLikeUpdate = (data) => {
      if (data.postId === post._id) {
        setLikeCount(data.likeCount);
      }
    };

    const handleCommentAdded = (data) => {
      if (data.postId === post._id) {
        // Add new comment to the list
        setComments((prev) => [data.comment, ...prev]);
      }
    };

    const handleShareUpdate = (data) => {
      if (data.postId === post._id) {
        setShareCount(data.shareCount);
      }
    };

    // Register event listeners
    socket.on('likeUpdate', handleLikeUpdate);
    socket.on('commentAdded', handleCommentAdded);
    socket.on('shareUpdate', handleShareUpdate);

    // Cleanup event listeners
    return () => {
      socket.off('likeUpdate', handleLikeUpdate);
      socket.off('commentAdded', handleCommentAdded);
      socket.off('shareUpdate', handleShareUpdate);
    };
  }, [socket, post?._id, setLikeCount]);

  // Update shareCount when post changes
  useEffect(() => {
    if (post?.shareCount !== undefined) {
      setShareCount(post.shareCount);
    }
  }, [post?.shareCount]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShareMenu && !event.target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  const fetchPostDetails = async () => {
    try {
      const response = await postService.getPostBySlug(slug);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post details:', error);
      navigate('/dashboard');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await postService.getComments(post?._id);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    try {
      await postService.toggleBookmark(post._id);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
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
      // Still increment locally even if tracking fails
      setShareCount((prev) => prev + 1);
      setPost((prev) =>
        prev ? { ...prev, shareCount: (prev.shareCount || 0) + 1 } : prev
      );
    }
  };

  const handleShare = async (platform = null) => {
    const shareUrl = `${window.location.origin}/post/${
      post?.slug || post?._id
    }`;
    const shareText = `${post?.title}\n\n${
      post?.excerpt || post?.description
    }\n\n`;

    setShowShareMenu(false); // Close menu after selection

    try {
      if (platform === 'whatsapp') {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
          shareText + shareUrl
        )}`;
        window.open(whatsappUrl, '_blank');
        await trackShare('whatsapp');
      } else if (platform === 'twitter') {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
        await trackShare('twitter');
      } else if (platform === 'facebook') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        window.open(facebookUrl, '_blank');
        await trackShare('facebook');
      } else if (platform === 'linkedin') {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`;
        window.open(linkedinUrl, '_blank');
        await trackShare('linkedin');
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        await trackShare('clipboard');
      } else {
        // Generic/native share
        const shareData = {
          title: post?.title,
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
          // Show share menu if native sharing isn't available
          setShowShareMenu(true);
        }
      }
    } catch (shareError) {
      console.error('Share failed:', shareError);
      // Fallback to copy
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        await trackShare('clipboard_fallback');
      } catch {
        alert(`Share this link: ${shareUrl}`);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    try {
      await postService.addComment(post._id, {
        content: newComment.trim(),
      });
      // Don't add to comments here - the real-time update will handle it
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim() || !user) return;
    try {
      const response = await postService.replyToComment(post._id, commentId, {
        content: replyText.trim(),
      });

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), response.data],
              }
            : comment
        )
      );
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user) return;
    try {
      await postService.likeComment(post._id, commentId);
      fetchComments();
    } catch (error) {
      console.error('Error liking comment:', error);
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

  // Fetch available users for mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Create user list from comments
        const userList = [];
        comments.forEach((comment) => {
          if (
            comment.author &&
            !userList.find((u) => u._id === comment.author._id)
          ) {
            userList.push(comment.author);
          }
          if (comment.replies) {
            comment.replies.forEach((reply) => {
              if (
                reply.author &&
                !userList.find((u) => u._id === reply.author._id)
              ) {
                userList.push(reply.author);
              }
            });
          }
        });
        if (post?.author && !userList.find((u) => u._id === post.author._id)) {
          userList.push(post.author);
        }
        if (user && !userList.find((u) => u._id === user._id)) {
          userList.push(user);
        }

        setAvailableUsers(userList);
      } catch (error) {
        console.error('Error fetching users for mentions:', error);
      }
    };

    if (comments.length > 0 || post?.author) {
      fetchUsers();
    }
  }, [comments, post?.author, user]);

  // Parse mentions from text
  const parseMentions = (text) => {
    if (!text) return text;
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }
      // Add mention
      const username = match[1];
      const mentionedUser = availableUsers.find(
        (u) =>
          u.username?.toLowerCase() === username.toLowerCase() ||
          `${u.firstName}${u.lastName}`.toLowerCase().replace(/\s/g, '') ===
            username.toLowerCase()
      );
      parts.push({
        type: 'mention',
        content: `@${username}`,
        username: username,
        user: mentionedUser,
      });
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }
    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  // Handle mention input
  const handleMentionInput = (e, isReply = false) => {
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');

      if (spaceIndex === -1 || textAfterAt.length < 20) {
        // Show mention dropdown
        const query =
          spaceIndex === -1
            ? textAfterAt
            : textAfterAt.substring(0, spaceIndex);
        setMentionQuery(query);
        setShowMentionDropdown(true);

        // Position dropdown near cursor
        const textarea = e.target;
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 20;
        const lines = textBeforeCursor.split('\n');
        const lineNumber = lines.length - 1;
        setMentionPosition({
          top: rect.top + lineNumber * lineHeight + 30,
          left: rect.left + 10,
        });
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }

    if (isReply) {
      setReplyText(text);
    } else {
      setNewComment(text);
    }
  };

  // Insert mention
  const insertMention = (selectedUser, isReply = false) => {
    const username =
      selectedUser.username ||
      `${selectedUser.firstName}${selectedUser.lastName}`.replace(/\s/g, '');
    const mentionText = `@${username} `;

    if (isReply) {
      const textBeforeCursor = replyText.substring(
        0,
        replyText.lastIndexOf('@')
      );
      setReplyText(textBeforeCursor + mentionText);
    } else {
      const textBeforeCursor = newComment.substring(
        0,
        newComment.lastIndexOf('@')
      );
      setNewComment(textBeforeCursor + mentionText);
    }

    setShowMentionDropdown(false);
    setMentionQuery('');
  };

  // Filter users for mention dropdown
  const filteredUsers = availableUsers.filter((u) => {
    if (!mentionQuery) return true;
    const username = u.username?.toLowerCase() || '';
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const query = mentionQuery.toLowerCase();
    return username.includes(query) || fullName.includes(query);
  });

  // Helper function to count all comments including nested replies
  const countAllComments = (commentsList) => {
    let count = 0;
    const countRecursive = (comment) => {
      count++;
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach((reply) => countRecursive(reply));
      }
    };
    commentsList.forEach((comment) => countRecursive(comment));
    return count;
  };

  const totalCommentCount = countAllComments(comments);

  const CommentComponent = ({ comment, isReply = false, depth = 0 }) => {
    // Calculate indentation based on depth for visual hierarchy
    const indentStyle = isReply
      ? {
          marginLeft: `${Math.min(1 + depth * 1.5, 8)}rem`,
          borderLeft: '1px dotted #d1d5db',
          paddingLeft: '1rem',
        }
      : {};

    return (
      <div className={`${isReply ? 'mt-2' : ''}`} style={indentStyle}>
        <div className="p-4 rounded-xl bg-white border border-gray-200 mb-3 shadow-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {comment.author?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">
                    {comment.author?.firstName} {comment.author?.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <MoreHorizontal className="w-3 h-3 text-gray-400" />
                </button>
              </div>

              <p className="text-gray-800 leading-relaxed mb-2 text-sm break-words">
                {(() => {
                  const parts = parseMentions(comment.content);
                  return parts.map((part, index) => {
                    if (part.type === 'mention') {
                      return (
                        <span
                          key={index}
                          className="text-blue-600 font-semibold hover:text-blue-700 cursor-pointer"
                          title={
                            part.user
                              ? `${part.user.firstName} ${part.user.lastName}`
                              : part.username
                          }
                        >
                          {part.content}
                        </span>
                      );
                    }
                    return <span key={index}>{part.content}</span>;
                  });
                })()}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCommentLike(comment._id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>{comment.likeCount || 0}</span>
                </button>

                <button
                  onClick={() => {
                    setReplyingTo(
                      replyingTo === comment._id ? null : comment._id
                    );
                    // Auto-insert @ mention when replying
                    if (replyingTo !== comment._id) {
                      const authorName =
                        comment.author?.username ||
                        `${comment.author?.firstName || ''}${
                          comment.author?.lastName || ''
                        }`.replace(/\s/g, '');
                      setReplyText(`@${authorName} `);
                    } else {
                      setReplyText('');
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </button>
              </div>

              {replyingTo === comment._id && (
                <div className="mt-2 p-2 rounded-lg bg-gray-50 relative">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {user?.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={replyText}
                        onChange={(e) => handleMentionInput(e, true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowMentionDropdown(false);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow clicking on dropdown
                          setTimeout(() => setShowMentionDropdown(false), 200);
                        }}
                        placeholder={`Reply to ${comment.author?.firstName}...`}
                        className="w-full p-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        rows="2"
                      />
                      {/* Mention Dropdown */}
                      {showMentionDropdown && replyingTo === comment._id && (
                        <div
                          className="absolute z-50 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto"
                          style={{
                            top: mentionPosition.top,
                            left: mentionPosition.left,
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {filteredUsers.length > 0 ? (
                            filteredUsers.slice(0, 5).map((u) => {
                              const username =
                                u.username ||
                                `${u.firstName}${u.lastName}`.replace(
                                  /\s/g,
                                  ''
                                );
                              return (
                                <button
                                  key={u._id}
                                  type="button"
                                  onClick={() => insertMention(u, true)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm"
                                >
                                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-semibold text-xs">
                                      {u.firstName?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">
                                      {u.firstName} {u.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      @{username}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No users found
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                            setShowMentionDropdown(false);
                          }}
                          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(comment._id)}
                          disabled={!replyText.trim()}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2 mt-3">
              {comment.replies.map((reply) => (
                <CommentComponent
                  key={reply._id}
                  comment={reply}
                  isReply={true}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab="feed"
        onTabChange={() => {}}
      />

      {/* Main Content Area */}
      <div className="lg:ml-72 relative z-10">
        {/* Header */}
        <Header onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Back Button */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Top Ad */}
          <div className="mb-4 sm:mb-8 px-2 sm:px-0">
            <AdContainer position="top" postIndex={0} />
          </div>

          {/* Article Content */}
          <div className="max-w-6xl mx-auto">
            {/* Featured Media (Image or Video) */}
            {(post?.featuredImage?.url || post?.featuredVideo?.url) && (
              <div className="mb-8 rounded-xl overflow-hidden shadow-xl">
                {post?.featuredVideo?.url ? (
                  <video
                    src={post.featuredVideo.url}
                    controls
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '500px', minHeight: '300px' }}
                    poster={
                      post.featuredVideo.thumbnail || post.featuredImage?.url
                    }
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={post.featuredImage.url}
                    alt={post.title}
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: '400px', minHeight: '200px' }}
                  />
                )}
              </div>
            )}

            {/* Article Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              {/* Category and Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {post?.category && (
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                )}
                {post?.isFeatured && (
                  <div className="flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Featured
                  </div>
                )}
                {post?.isTrending && (
                  <div className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    Trending
                  </div>
                )}
              </div>

              {/* Article Title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-6">
                {post?.title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post?.publishedAt || post?.createdAt)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post?.readingTime || 5} min read
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post?.viewCount || 0} views
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 shadow-lg ${
                      isLiked
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-500'
                    } ${likeLoading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} ${
                        likeLoading ? 'animate-pulse' : ''
                      }`}
                    />
                    <span className="text-sm font-medium">{likeCount}</span>
                  </button>

                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 shadow-lg ${
                      isBookmarked
                        ? 'text-purple-600 bg-purple-50'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isBookmarked ? 'fill-current' : ''
                      }`}
                    />
                    <span className="text-sm font-medium">Save</span>
                  </button>

                  {/* Share Button with Dropdown */}
                  <div className="relative share-menu-container">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-3 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-lg flex items-center gap-2"
                    >
                      <Share2 className="w-5 h-5" />
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Share Menu */}
                    {showShareMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <button
                          onClick={() => handleShare('whatsapp')}
                          className="w-full px-4 py-2 text-left hover:bg-green-50 text-gray-700 dark:text-gray-300 hover:text-green-600 transition-colors flex items-center gap-3"
                        >
                          <span className="text-green-500">📱</span>
                          Share on WhatsApp
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors flex items-center gap-3"
                        >
                          <span className="text-blue-500">🐦</span>
                          Share on Twitter
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors flex items-center gap-3"
                        >
                          <span className="text-blue-600">📘</span>
                          Share on Facebook
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors flex items-center gap-3"
                        >
                          <span className="text-blue-700">💼</span>
                          Share on LinkedIn
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => handleShare('copy')}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors flex items-center gap-3"
                        >
                          <span>📋</span>
                          Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center gap-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    {likeCount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    likes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    {totalCommentCount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    comments
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    {shareCount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    shares
                  </span>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
              {/* Tags */}
              {post?.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <Tag className="w-3 h-3" />#{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Article Summary */}
              {(post?.excerpt || post?.description) && (
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 mb-8 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Article Summary
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {post.excerpt || post.description}
                  </p>
                </div>
              )}

              {/* Main Content */}
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                <div
                  className="text-gray-800 dark:text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: post?.content || 'Loading content...',
                  }}
                />
              </div>
            </div>

            {/* Mobile Comment Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
              <button
                onClick={() => setShowCommentsMobile(!showCommentsMobile)}
                className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold">{totalCommentCount}</span>
              </button>
            </div>

            {/* Comments Section */}
            <div
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 ${
                showCommentsMobile
                  ? 'fixed inset-0 z-40 overflow-y-auto lg:static lg:z-auto'
                  : 'hidden lg:block'
              }`}
            >
              {/* Mobile Header */}
              {showCommentsMobile && (
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-blue-500" />
                    Comments ({totalCommentCount})
                  </h3>
                  <button
                    onClick={() => setShowCommentsMobile(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              )}

              <h3 className="hidden lg:flex text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 items-center gap-2">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                Comments ({totalCommentCount})
              </h3>

              {/* Add Comment */}
              {user && (
                <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {user.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => handleMentionInput(e, false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowMentionDropdown(false);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow clicking on dropdown
                          setTimeout(() => setShowMentionDropdown(false), 200);
                        }}
                        placeholder="Write a thoughtful comment... (Use @ to mention users)"
                        className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows="4"
                      />
                      {/* Mention Dropdown */}
                      {showMentionDropdown && !replyingTo && (
                        <div
                          className="absolute z-50 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto"
                          style={{
                            top: mentionPosition.top,
                            left: mentionPosition.left,
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {filteredUsers.length > 0 ? (
                            filteredUsers.slice(0, 5).map((u) => {
                              const username =
                                u.username ||
                                `${u.firstName}${u.lastName}`.replace(
                                  /\s/g,
                                  ''
                                );
                              return (
                                <button
                                  key={u._id}
                                  type="button"
                                  onClick={() => insertMention(u, false)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100"
                                >
                                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-semibold text-xs">
                                      {u.firstName?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-semibold">
                                      {u.firstName} {u.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      @{username}
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                              No users found
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentComponent
                    key={comment._id}
                    comment={comment}
                    depth={0}
                  />
                ))}
              </div>

              {comments.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No comments yet</p>
                  <p className="text-sm">
                    Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PostPage;
