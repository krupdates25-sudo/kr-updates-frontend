import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import CompactArticleRowCard from '../components/common/CompactArticleRowCard';
import WideArticleRowCard from '../components/common/WideArticleRowCard';
import AdContainer from '../components/common/AdContainer';
import usePagination from '../hooks/usePagination';
import postService from '../services/postService';
import { LoadingSkeleton } from '../components/common/LoadMoreButton';

const DEFAULT_LIMIT = 10;

const normalize = (v) => String(v || '').trim().toLowerCase();

const getAuthorName = (post) => {
  if (!post) return '';
  return (
    post.reporterName ||
    post.authorDisplayName ||
    `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim()
  );
};

const computeReadMinutes = (post) => {
  // Prefer backend value if present
  const n = Number(post?.readingTime);
  if (Number.isFinite(n) && n > 0) return n;
  const len = post?.content?.length || 500;
  return Math.max(1, Math.ceil(len / 200));
};

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || 'all';
  const initialSort = searchParams.get('sort') || 'latest'; // latest | oldest
  const initialTimeRange = searchParams.get('range') || 'all'; // all | 24h | 7d | 30d
  const initialReadBucket = searchParams.get('read') || 'all'; // all | 0-3 | 4-6 | 7-10 | 11+
  const initialAuthor = searchParams.get('author') || 'all';

  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [readBucket, setReadBucket] = useState(initialReadBucket);
  const [author, setAuthor] = useState(initialAuthor);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Lock background scroll when the mobile filters sheet is open (important for mobile webviews)
  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileFiltersOpen]);

  // Keep URL in sync (shareable)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const setOrDel = (k, v) => {
      if (!v || v === 'all') next.delete(k);
      else next.set(k, v);
    };
    setOrDel('category', category);
    setOrDel('sort', sort === 'latest' ? 'latest' : 'oldest');
    setOrDel('range', timeRange);
    setOrDel('read', readBucket);
    setOrDel('author', author);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, timeRange, readBucket, author]);

  const transformPost = useCallback((posts) => {
    if (!Array.isArray(posts)) return [];
    return posts
      .map((post) => {
        if (!post?._id) return null;
        return {
          ...post,
          id: post._id,
          slug: post.slug,
          readMinutes: computeReadMinutes(post),
          authorName: getAuthorName(post),
        };
      })
      .filter(Boolean);
  }, []);

  const fetchPosts = useCallback(async (params) => {
    // Use same API as dashboard; keep it public-safe
    const resp = await postService.getAllPosts(params);
    if (resp?.data?.totalCount !== undefined) {
      return {
        data: resp.data.data || [],
        totalCount: resp.data.totalCount,
        hasMore: resp.data.hasMore,
        pagination: resp.data.pagination,
      };
    }
    // fallback
    const list = resp?.data?.data || resp?.data || [];
    return {
      data: Array.isArray(list) ? list : [],
      totalCount: Array.isArray(list) ? list.length : 0,
      hasMore: false,
      pagination: { page: 1, limit: params.limit || DEFAULT_LIMIT, totalCount: 0, hasMore: false },
    };
  }, []);

  const {
    data: rawPosts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  } = usePagination(fetchPosts, {
    limit: DEFAULT_LIMIT,
    dependencies: [], // keep list stable; filters apply client-side
    transformData: transformPost,
  });

  const categories = useMemo(() => {
    const set = new Set();
    rawPosts.forEach((p) => {
      if (p?.category) set.add(p.category);
    });
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ['all', ...arr];
  }, [rawPosts]);

  const authors = useMemo(() => {
    const set = new Set();
    rawPosts.forEach((p) => {
      const name = getAuthorName(p);
      if (name) set.add(name);
    });
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ['all', ...arr];
  }, [rawPosts]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const rangeMs =
      timeRange === '24h'
        ? 24 * 60 * 60 * 1000
        : timeRange === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : timeRange === '30d'
            ? 30 * 24 * 60 * 60 * 1000
            : null;

    const matchesReadBucket = (mins) => {
      if (readBucket === 'all') return true;
      if (readBucket === '0-3') return mins <= 3;
      if (readBucket === '4-6') return mins >= 4 && mins <= 6;
      if (readBucket === '7-10') return mins >= 7 && mins <= 10;
      if (readBucket === '11+') return mins >= 11;
      return true;
    };

    let list = rawPosts.slice();

    if (category !== 'all') {
      const c = normalize(category);
      list = list.filter((p) => normalize(p.category) === c);
    }

    if (author !== 'all') {
      const a = normalize(author);
      list = list.filter((p) => normalize(getAuthorName(p)) === a);
    }

    if (rangeMs) {
      list = list.filter((p) => {
        const d = new Date(p.publishedAt || p.createdAt || 0).getTime();
        return d && now - d <= rangeMs;
      });
    }

    list = list.filter((p) => matchesReadBucket(computeReadMinutes(p)));

    list.sort((a, b) => {
      const da = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const db = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return sort === 'oldest' ? da - db : db - da;
    });

    return list;
  }, [rawPosts, category, author, timeRange, readBucket, sort]);

  // Infinite scroll
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (loading || loadingMore) return;
        if (!hasMore) return;
        loadMore();
      },
      { root: null, rootMargin: '600px 0px', threshold: 0.01 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading, loadingMore]);

  const FiltersPanel = ({ onClose }) => (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 px-4 pt-1 pb-2 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-gray-900">Filters</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 20).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                normalize(c) === normalize(category)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-2">Sort</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSort('latest')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
              sort === 'latest'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSort('oldest')}
            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
              sort === 'oldest'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Oldest
          </button>
        </div>
      </div>

      {/* Time range */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-2">Time</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['all', 'All'],
            ['24h', '24h'],
            ['7d', '7 days'],
            ['30d', '30 days'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTimeRange(k)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                timeRange === k
                  ? 'bg-white text-blue-700 border-blue-200'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Read time */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-2">Read time</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['all', 'All'],
            ['0-3', '0–3m'],
            ['4-6', '4–6m'],
            ['7-10', '7–10m'],
            ['11+', '11m+'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setReadBucket(k)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                readBucket === k
                  ? 'bg-white text-blue-700 border-blue-200'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Author */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-2">Author</p>
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
        >
          {authors.slice(0, 50).map((a) => (
            <option key={a} value={a}>
              {a === 'all' ? 'All' : a}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <button
          onClick={() => {
            setCategory('all');
            setSort('latest');
            setTimeRange('all');
            setReadBucket('all');
            setAuthor('all');
          }}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-800 font-semibold hover:bg-gray-50"
        >
          Reset filters
        </button>
      </div>
    </div>
  );

  return (
    <PageLayout activeTab="feed">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              Explore
            </h1>
            <p className="text-sm text-gray-600">
              Browse by category, time, read length and author
            </p>
          </div>

          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 font-semibold text-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white p-4">
              <FiltersPanel />
            </div>
          </aside>

          {/* Feed */}
          <main className="flex-1 min-w-0">
            {/* Top ad */}
            <div className="mb-4">
              <AdContainer position="top" postIndex={0} />
            </div>

            {loading && <LoadingSkeleton />}

            {!loading && filtered.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-gray-700 font-semibold">No posts match these filters.</p>
                <button
                  onClick={() => {
                    setCategory('all');
                    setSort('latest');
                    setTimeRange('all');
                    setReadBucket('all');
                    setAuthor('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Reset filters
                </button>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <>
                <div className="sm:hidden space-y-3">
                  {filtered.map((p) => (
                    <CompactArticleRowCard
                      key={p._id}
                      article={{
                        id: p._id,
                        _id: p._id,
                        title: p.title,
                        description: p.excerpt || p.description || '',
                        image: p.featuredImage?.url,
                        category: p.category,
                        tags: p.tags || [],
                        slug: p.slug,
                        readTime: `${computeReadMinutes(p)} min read`,
                      }}
                    />
                  ))}
                </div>

                <div className="hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filtered.map((p) => (
                    <WideArticleRowCard
                      key={p._id}
                      article={{
                        id: p._id,
                        _id: p._id,
                        title: p.title,
                        description: p.excerpt || p.description || '',
                        image: p.featuredImage?.url,
                        category: p.category,
                        tags: p.tags || [],
                        slug: p.slug,
                        readTime: `${computeReadMinutes(p)} min read`,
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Infinite scroll sentinel */}
            <div className="pt-6">
              <div ref={sentinelRef} className="h-8" />
              {loadingMore && (
                <div className="text-center text-sm text-gray-500">Loading more…</div>
              )}
              {!!error && (
                <div className="text-center text-sm text-red-600 mt-3">
                  Failed to load more posts.
                  <button
                    onClick={refresh}
                    className="ml-2 font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Retry
                  </button>
                </div>
              )}
              {!hasMore && rawPosts.length > 0 && (
                <div className="text-center text-sm text-gray-400 mt-3">
                  You’re all caught up.
                </div>
              )}
            </div>

          </main>
        </div>
      </div>

      {/* Mobile filters modal */}
      {isMobileFiltersOpen && (
        <>
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-gray-800/40"
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 sm:inset-0 flex items-end sm:items-center justify-center p-2 sm:p-6">
              <div className="w-full sm:max-w-md bg-white shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[calc(100dvh-16px)] sm:max-h-[min(90dvh,720px)] overflow-hidden">
                <div className="overflow-y-auto overscroll-contain p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
                  <FiltersPanel onClose={() => setIsMobileFiltersOpen(false)} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default Explore;


