import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  X,
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
  ExternalLink,
} from 'lucide-react';
import postService from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import useLike from '../../hooks/useLike';

const PostModal = ({ isOpen, onClose, postId, post: initialPost }) => {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [shareCount, setShareCount] = useState(initialPost?.shareCount || 0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCommentsMobile, setShowCommentsMobile] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [availableUsers, setAvailableUsers] = useState([]);
  const { user } = useAuth();
  const { socket, joinPost, leavePost } = useSocket();

  // Use the enhanced like hook with initial values from the passed post
  const {
    isLiked,
    likeCount,
    setLikeCount,
    isLoading: likeLoading,
    handleLike,
  } = useLike(
    postId,
    initialPost?.isLiked || false,
    initialPost?.likeCount || initialPost?.likes || 0
  );

  const fetchPostDetails = useCallback(async () => {
    try {
      const response = await postService.getPostById(postId);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await postService.getComments(postId);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [postId]);

  // Update like count when initial post data changes
  useEffect(() => {
    if (initialPost?.likeCount !== undefined) {
      setLikeCount(initialPost.likeCount);
    } else if (initialPost?.likes !== undefined) {
      setLikeCount(initialPost.likes);
    }
  }, [initialPost, setLikeCount]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPostDetails();
      fetchComments();
      // Join the post room for real-time updates
      joinPost(postId);
    }

    return () => {
      if (postId) {
        // Leave the post room when modal closes
        leavePost(postId);
      }
    };
  }, [isOpen, postId, joinPost, leavePost, fetchPostDetails, fetchComments]);

  // Socket.IO event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleLikeUpdate = (data) => {
      if (data.postId === postId) {
        setLikeCount(data.likeCount);
      }
    };

    const handleCommentAdded = (data) => {
      if (data.postId === postId) {
        // Add new comment to the list
        setComments((prev) => [data.comment, ...prev]);
      }
    };

    const handleShareUpdate = (data) => {
      if (data.postId === postId) {
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
  }, [socket, postId, setLikeCount]);

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

  const handleBookmark = async () => {
    if (!user) return;
    try {
      await postService.toggleBookmark(postId);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const trackShare = async (platform) => {
    try {
      const response = await postService.sharePost(postId, { platform });
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
      post?.slug || String(post?._id || '')
    }`;
    
    // Bold heading + normal subheading for WhatsApp (*text* = bold)
    let shareText = '';
    
    // Heading in bold
    if (post?.title) {
      shareText += `*${post.title}*\n\n`;
    }
    
    // Subheading in normal weight
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

    setShowShareMenu(false); // Close menu after selection

    try {
      if (platform === 'whatsapp') {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
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
      await postService.addComment(postId, {
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
      const response = await postService.replyToComment(postId, commentId, {
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
      await postService.likeComment(postId, commentId);
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
        // Get unique users from comments
        const userIds = new Set();
        comments.forEach((comment) => {
          if (comment.author?._id) userIds.add(comment.author._id);
          if (comment.replies) {
            comment.replies.forEach((reply) => {
              if (reply.author?._id) userIds.add(reply.author._id);
            });
          }
        });
        if (post?.author?._id) userIds.add(post.author._id);
        if (user?._id) userIds.add(user._id);

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
          marginTop: '0.5rem',
        }
      : {};

    return (
      <div className={`${isReply ? '' : ''}`} style={indentStyle}>
        <div
          className="p-3 rounded-xl bg-white/60 mb-2"
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #5755FE, #6B5AFF)',
              }}
            >
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
                <button className="p-1 rounded-full hover:bg-gray-100/50 transition-colors">
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
                          className="text-purple-600 font-semibold hover:text-purple-700 cursor-pointer"
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

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleCommentLike(comment._id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
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
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </button>
              </div>

              {replyingTo === comment._id && (
                <div className="mt-2 p-2 rounded-lg bg-gray-50/80 relative">
                  <div className="flex gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #5755FE, #6B5AFF)',
                      }}
                    >
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
                        className="w-full p-2 rounded-lg border-0 bg-white/90 text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
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
                                  className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center gap-2 text-sm"
                                >
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      background:
                                        'linear-gradient(135deg, #5755FE, #6B5AFF)',
                                    }}
                                  >
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
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
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
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
        style={{
          background: 'rgba(13, 13, 13, 0.8)',
          // backdropFilter: 'blur(12px)',
          // WebkitBackdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      >
        <div
          className="w-full max-w-6xl h-[95vh] max-h-[900px] overflow-hidden rounded-2xl shadow-2xl relative"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={() => {
                const postUrl = `/post/${post?.slug || String(post?._id || '')}`;
                window.open(postUrl, '_blank');
              }}
              className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-1"
              title="View in full page"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">View Full Page</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="h-full flex flex-col lg:flex-row">
            <div className="flex-1 overflow-y-auto lg:min-w-0">
              <div className="p-4 sm:p-6 border-b border-white/20">
                {post?.featuredImage?.url && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    <img
                      src={post.featuredImage.url}
                      alt={post.title}
                      className="w-full h-48 sm:h-64 object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {post?.category && (
                    <span
                      className="px-3 py-1 text-sm font-semibold rounded-full text-white"
                      style={{
                        background: 'linear-gradient(135deg, #5755FE, #6B5AFF)',
                      }}
                    >
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

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
                  {post?.title}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post?.publishedAt || post?.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post?.readingTime || 5} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {post?.viewCount || 0} views
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLike}
                      disabled={likeLoading}
                      className={`p-2 rounded-full transition-all duration-200 shadow-lg ${
                        isLiked
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500'
                      } ${likeLoading ? 'opacity-50 cursor-wait' : ''}`}
                      style={{
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                      }}
                    >
                      <Heart
                        className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} ${
                          likeLoading ? 'animate-pulse' : ''
                        }`}
                      />
                    </button>

                    <button
                      onClick={handleBookmark}
                      className={`p-2 rounded-full transition-all duration-200 shadow-lg ${
                        isBookmarked
                          ? 'text-purple-600 bg-purple-50'
                          : 'bg-white/80 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                      }`}
                      style={{
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                      }}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          isBookmarked ? 'fill-current' : ''
                        }`}
                      />
                    </button>

                    {/* Share Button with Dropdown */}
                    <div className="relative share-menu-container">
                      <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 shadow-lg flex items-center gap-1"
                        style={{
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {/* Share Menu */}
                      {showShareMenu && (
                        <div
                          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                          style={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                          }}
                        >
                          <button
                            onClick={() => handleShare('whatsapp')}
                            className="w-full px-4 py-2 text-left hover:bg-green-50 text-gray-700 hover:text-green-600 transition-colors flex items-center gap-3"
                          >
                            <span className="text-green-500">📱</span>
                            Share on WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare('twitter')}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3"
                          >
                            <span className="text-blue-500">🐦</span>
                            Share on Twitter
                          </button>
                          <button
                            onClick={() => handleShare('facebook')}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3"
                          >
                            <span className="text-blue-600">📘</span>
                            Share on Facebook
                          </button>
                          <button
                            onClick={() => handleShare('linkedin')}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-3"
                          >
                            <span className="text-blue-700">💼</span>
                            Share on LinkedIn
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => handleShare('copy')}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 hover:text-gray-800 transition-colors flex items-center gap-3"
                          >
                            <span>📋</span>
                            Copy Link
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-white/20 mt-4">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-gray-900">
                      {likeCount}
                    </span>
                    <span className="text-gray-600 text-sm">likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-gray-900">
                      {totalCommentCount}
                    </span>
                    <span className="text-gray-600 text-sm">comments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-gray-900">
                      {shareCount}
                    </span>
                    <span className="text-gray-600 text-sm">shares</span>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {post?.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-white/60 text-gray-700 hover:bg-white/80 transition-colors cursor-pointer"
                        style={{
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                        }}
                      >
                        <Tag className="w-3 h-3" />#{tag}
                      </span>
                    ))}
                  </div>
                )}

                {(post?.excerpt || post?.description) && (
                  <div
                    className="p-4 rounded-xl bg-gradient-to-r from-purple-50/80 to-blue-50/80"
                    style={{
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Article Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {post.excerpt || post.description}
                    </p>
                  </div>
                )}

                <div className="prose prose-sm sm:prose max-w-none">
                  <div
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: post?.content || 'Loading content...',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Comment Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-[10000]">
              <button
                onClick={() => setShowCommentsMobile(!showCommentsMobile)}
                className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold">{totalCommentCount}</span>
              </button>
            </div>

            <div
              className={`w-full lg:w-[400px] xl:w-[450px] 2xl:w-[500px] border-t lg:border-t-0 lg:border-l border-white/20 flex flex-col ${
                showCommentsMobile
                  ? 'fixed inset-0 z-[9998] lg:static lg:z-auto'
                  : 'hidden lg:flex'
              }`}
              style={{
                background: showCommentsMobile
                  ? 'rgba(255, 255, 255, 0.98)'
                  : 'transparent',
                backdropFilter: showCommentsMobile ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: showCommentsMobile
                  ? 'blur(20px)'
                  : 'none',
                maxHeight: showCommentsMobile ? '100vh' : '100%',
              }}
            >
              {/* Mobile Header */}
              {showCommentsMobile && (
                <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/50 lg:hidden">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    Comments ({totalCommentCount})
                  </h3>
                  <button
                    onClick={() => setShowCommentsMobile(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="p-4 border-b border-white/20 bg-white/50 hidden lg:block">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  Comments ({totalCommentCount})
                </h3>
              </div>

              {user && (
                <div className="p-4 border-b border-white/20 bg-white/30">
                  <div className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #5755FE, #6B5AFF)',
                      }}
                    >
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
                        className="w-full p-3 rounded-xl border-0 bg-white/80 text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        style={{
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                        }}
                        rows="3"
                      />
                      {/* Mention Dropdown */}
                      {showMentionDropdown && !replyingTo && (
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
                                  onClick={() => insertMention(u, false)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center gap-2 text-sm"
                                >
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      background:
                                        'linear-gradient(135deg, #5755FE, #6B5AFF)',
                                    }}
                                  >
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
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm"
                          style={{
                            background: newComment.trim()
                              ? 'linear-gradient(135deg, #5755FE, #6B5AFF)'
                              : '#ccc',
                          }}
                        >
                          <Send className="w-4 h-4" />
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {comments.length > 0 ? (
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <CommentComponent
                        key={comment._id}
                        comment={comment}
                        depth={0}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs">
                      Be the first to share your thoughts!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default PostModal;
