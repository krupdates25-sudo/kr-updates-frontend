import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, MapPin, Check, FileText, Newspaper } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useLanguageLocation } from '../contexts/LanguageLocationContext';
import postService from '../services/postService';
import translateService from '../services/translateService';
import { getStateNewsFeed } from '../services/bhaskarService';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 400;

// Heuristic: mostly ASCII = likely English (translate to Hindi for matching Hindi content)
function looksLikeEnglish(str) {
  if (!str || !str.trim()) return false;
  const trimmed = str.trim();
  const ascii = trimmed.replace(/[\x00-\x7F]/g, '').length;
  return ascii / trimmed.length < 0.3;
}

function StateExplorer() {
  const navigate = useNavigate();
  const {
    location: currentLocation,
    selectedLocations,
    toggleSelectedLocation,
    clearSelectedLocations,
    availableLocations,
  } = useLanguageLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ posts: [], bhaskarStories: [] });
  const [searching, setSearching] = useState(false);
  const [bhaskarFeed, setBhaskarFeed] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Load Bhaskar state feed once for client-side search
  useEffect(() => {
    let cancelled = false;
    getStateNewsFeed()
      .then((data) => {
        if (!cancelled) setBhaskarFeed(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setBhaskarFeed([]);
      });
    return () => { cancelled = true; };
  }, []);

  const runSearch = useCallback(async (query, translatedQuery) => {
    const q = (query || '').trim().toLowerCase();
    const qHi = (translatedQuery || '').trim().toLowerCase();
    const terms = [q, qHi].filter(Boolean);
    if (terms.length === 0) {
      setSuggestions({ posts: [], bhaskarStories: [] });
      return;
    }

    setSearching(true);
    try {
      const limit = 10;
      const postPromises = terms.slice(0, 2).map((term) =>
        postService.searchPosts(term, {}).catch(() => ({ data: { posts: [] } }))
      );
      const postResults = await Promise.all(postPromises);
      const seenIds = new Set();
      const posts = [];
      for (const res of postResults) {
        const list = res?.data?.posts || res?.posts || [];
        for (const p of list) {
          if (p._id && !seenIds.has(p._id)) {
            seenIds.add(p._id);
            posts.push({ ...p, source: 'kr' });
          }
        }
      }

      let bhaskarStories = [];
      if (bhaskarFeed && bhaskarFeed.length > 0) {
        for (const block of bhaskarFeed) {
          const stories = Array.isArray(block.stories) ? block.stories : [];
          for (const s of stories) {
            const title = (s.title || '').toLowerCase();
            const slug = (s.slug || '').toLowerCase();
            const match = terms.some(
              (t) => t.length >= 2 && (title.includes(t) || slug.includes(t))
            );
            if (match) bhaskarStories.push({ ...s, source: 'bhaskar', location: block.location });
          }
        }
        bhaskarStories = bhaskarStories.slice(0, 10);
      }

      setSuggestions({ posts, bhaskarStories });
    } catch (e) {
      setSuggestions({ posts: [], bhaskarStories: [] });
    } finally {
      setSearching(false);
    }
  }, [bhaskarFeed]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions({ posts: [], bhaskarStories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      let translatedQuery = '';
      if (looksLikeEnglish(trimmed)) {
        try {
          const res = await translateService.translateText(trimmed, 'hi', 'en');
          translatedQuery = res?.translatedText || '';
        } catch {
          // ignore
        }
      }
      runSearch(trimmed, translatedQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const handleSelectLocation = useCallback(
    (loc) => {
      toggleSelectedLocation(loc);
    },
    [toggleSelectedLocation]
  );

  const handleSuggestionClick = useCallback(
    (item) => {
      if (item.source === 'kr' && item._id) {
        navigate(`/post/${item._id}`);
      } else if (item.source === 'bhaskar' && item.id) {
        navigate(`/bhaskar/story/${item.id}`, { state: { story: item } });
      }
    },
    [navigate]
  );

  const hasSuggestions =
    suggestions.posts.length > 0 || suggestions.bhaskarStories.length > 0;
  const showLocations = searchQuery.trim().length < MIN_QUERY_LENGTH;
  const selectedCount = Array.isArray(selectedLocations) ? selectedLocations.length : 0;

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <PageLayout>
      <div
        className={`min-h-screen bg-gray-50 transition-opacity duration-300 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                Location & search
              </h1>
              <p className="text-xs text-gray-500">
                Pick a location for news, or search posts
              </p>
            </div>
          </div>

          {/* Search bar – post suggestions as you type (English → translated to Hindi for matching) */}
          <div className="px-4 pb-3">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts (English or Hindi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  Searching…
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Post suggestions when user is typing */}
        {!showLocations && (
          <div className="px-4 py-3 max-w-2xl mx-auto">
            {searchQuery.trim().length >= MIN_QUERY_LENGTH && !searching && !hasSuggestions && (
              <p className="text-sm text-gray-500 py-4 text-center">
                No posts or stories found. Try different words.
              </p>
            )}
            {hasSuggestions && (
              <div className="space-y-4">
                {suggestions.posts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      KR Updates
                    </p>
                    <ul className="space-y-1">
                      {suggestions.posts.map((p) => (
                        <li key={p._id}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(p)}
                            className="w-full text-left px-3 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-900 line-clamp-2">
                              {p.title}
                            </span>
                            {p.category && (
                              <span className="text-xs text-gray-500 mt-0.5 block">
                                {p.category}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestions.bhaskarStories.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Newspaper className="w-3.5 h-3.5" />
                      Bhaskar
                    </p>
                    <ul className="space-y-1">
                      {suggestions.bhaskarStories.map((s) => (
                        <li key={`${s.id}-${s.shortUrl || ''}`}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(s)}
                            className="w-full text-left px-3 py-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-900 line-clamp-2">
                              {s.title}
                            </span>
                            {s.location && (
                              <span className="text-xs text-gray-500 mt-0.5 block">
                                {s.location}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Location grid – applies news filter */}
        {showLocations && (
          <div className="px-4 py-4 pb-24 max-w-4xl mx-auto">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Choose your location
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Select one or more locations. News will be filtered accordingly.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.isArray(availableLocations) &&
                availableLocations
                  .filter((loc) => loc && String(loc).trim())
                  .map((loc) => {
                    const name = String(loc);
                    const isAll = name === 'All';
                    const isSelected = isAll
                      ? (selectedCount === 0)
                      : (Array.isArray(selectedLocations) && selectedLocations.includes(name));
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className={`rounded-xl border px-3 py-3 sm:py-4 text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-[72px] sm:min-h-[80px] ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-900'
                        }`}
                      >
                        <span className="font-medium text-sm sm:text-base line-clamp-2 leading-tight">
                          {loc}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-indigo-200 text-xs font-medium">
                            <Check className="w-3.5 h-3.5" />
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>
        )}

        {/* Sticky actions for multi-select */}
        {showLocations && (
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  clearSelectedLocations();
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                All
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {selectedCount > 0 ? `${selectedCount} selected` : 'All selected'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedCount > 0 ? selectedLocations.join(', ') : 'Showing all locations'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default StateExplorer;
