import { useState, useCallback, useMemo } from 'react';
import PageLayout from '../components/layout/PageLayout';
import ArticleCard from '../components/common/ArticleCard';
import { LoadingSkeleton } from '../components/common/LoadMoreButton';
import { useSocket } from '../contexts/SocketContext';
import AdContainer from '../components/common/AdContainer';
import BreakingNewsBanner from '../components/common/BreakingNewsBanner';
import usePagination from '../hooks/usePagination';
import postService from '../services/postService';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const [sortBy, setSortBy] = useState('latest');
  const [filterBy, setFilterBy] = useState('all');
  const { joinPost, leavePost } = useSocket();

  // Transform posts to articles format
  const transformPostsToArticles = useCallback((posts) => {
    return posts
      .map((post) => {
        if (!post || !post.author) return null;

        return {
          id: post._id || post.id,
          title: post.title || 'Untitled',
          excerpt: post.excerpt || post.description || '',
          content: post.content || '',
          author: {
            id: post.author._id || post.author.id,
            name: `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username || 'Anonymous',
            avatar: post.author.avatar || post.author.profilePicture || '',
            username: post.author.username || '',
          },
          featuredImage: post.featuredImage?.url || post.featuredImage || '',
          category: post.category || 'general',
          tags: post.tags || [],
          publishedAt: post.createdAt || post.publishedAt || new Date().toISOString(),
          readTime: post.readTime || 5,
          likes: post.likeCount ?? 0,
          comments: post.commentCount ?? 0,
          views: post.viewCount ?? 0,
          shares: post.shareCount ?? 0,
          slug: post.slug,
        };
      })
      .filter(Boolean);
  }, []);

  // Fetch function for pagination
  const fetchPosts = useCallback(
    async (params) => {
      try {
        let response;

        switch (activeTab) {
          case 'trending':
            response = await postService.getTrendingPosts();
            break;
          case 'javascript':
          case 'react':
          case 'nodejs':
          case 'python':
            response = await postService.getPostsByCategory(activeTab);
            break;
          default:
            response = await postService.getAllPosts(params);
        }

        if (
          (activeTab === 'feed' ||
            !['trending', 'javascript', 'react', 'nodejs', 'python'].includes(
              activeTab
            )) &&
          response.data &&
          response.data.totalCount !== undefined
        ) {
          return {
            data: response.data.data || [],
            totalCount: response.data.totalCount,
            hasMore: response.data.hasMore,
            pagination: response.data.pagination || {
              page: params.page || 1,
              limit: params.limit || 8,
              totalCount: response.data.totalCount,
              hasMore: response.data.hasMore,
            },
          };
        }

        if (response && response.data && Array.isArray(response.data)) {
          return {
            data: response.data,
            totalCount: response.data.length,
            hasMore: false,
          };
        }

        return { data: [], totalCount: 0, hasMore: false };
      } catch (error) {
        console.error('Error fetching posts:', error);
        return { data: [], totalCount: 0, hasMore: false };
      }
    },
    [activeTab]
  );

  const {
    data: posts,
    loading,
    hasMore,
    loadMore,
    totalCount,
  } = usePagination(fetchPosts, {
    page: 1,
    limit: 8,
  });

  // Transform posts to articles
  const articles = useMemo(() => {
    return transformPostsToArticles(posts);
  }, [posts, transformPostsToArticles]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    if (filterBy === 'all') return articles;
    return articles.filter((article) => article.category === filterBy);
  }, [articles, filterBy]);

  // Sort articles
  const filteredAndSortedArticles = useMemo(() => {
    const sorted = [...filteredArticles];
    switch (sortBy) {
      case 'latest':
        return sorted.sort(
          (a, b) =>
            new Date(b.publishedAt) - new Date(a.publishedAt)
        );
      case 'popular':
        return sorted.sort(
          (a, b) => (b.likes + b.views) - (a.likes + a.views)
        );
      case 'trending':
        return sorted.sort(
          (a, b) =>
            b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares)
        );
      default:
        return sorted;
    }
  }, [filteredArticles, sortBy]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <PageLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        {loading && <LoadingSkeleton />}

        {activeTab === 'feed' && <BreakingNewsBanner />}

        <div className="mb-4 sm:mb-6 w-full">
          <AdContainer
            position="top"
            postIndex={0}
            className="w-full"
          />
        </div>

        {!loading && filteredAndSortedArticles.length > 0 && (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
              data-protected-content
              style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
            >
              {filteredAndSortedArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-protected-content
                >
                  <ArticleCard
                    article={article}
                    onBookmark={(postId) => {
                      console.log('Bookmark post:', postId);
                    }}
                    onShare={(postId) => {
                      console.log('Share post:', postId);
                    }}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        {!loading && filteredAndSortedArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts found.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default HomePage;

