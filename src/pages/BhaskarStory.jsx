import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { getCricketCategoryFeed, getStateNewsFeed } from '../services/bhaskarService';

function safeBhaskarUrl(story) {
  const shortUrl = story?.shortUrl || '';
  const shareUri = story?.shareUri || '';
  const absFromShort = shortUrl ? `https://www.bhaskar.com${shortUrl.startsWith('/') ? shortUrl : `/${shortUrl}`}` : '';
  const abs = absFromShort || shareUri || '';
  return abs;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BhaskarStory() {
  const navigate = useNavigate();
  const { storyId } = useParams();
  const loc = useLocation();

  const initialStory = useMemo(() => {
    const s = loc?.state?.story || null;
    if (s && String(s.id) === String(storyId)) return s;

    // Restore from session cache (supports hard refresh on details page)
    try {
      const raw = sessionStorage.getItem(`bhaskar_story_${storyId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && String(parsed.id) === String(storyId)) return parsed;
    } catch {
      // ignore
    }

    return null;
  }, [loc?.state, storyId]);

  const [story, setStory] = useState(initialStory);
  const [loading, setLoading] = useState(!initialStory);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (initialStory) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Try state feed first
        const stateFeed = await getStateNewsFeed();
        let found = stateFeed
          .flatMap((b) => (Array.isArray(b?.stories) ? b.stories : []))
          .find((s) => String(s?.id) === String(storyId));

        // Fallback: cricket category feed (first page)
        if (!found) {
          const cricketFeed = await getCricketCategoryFeed();
          found = (cricketFeed?.stories || []).find((s) => String(s?.id) === String(storyId)) || null;
        }
        if (!cancelled) setStory(found || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Unable to load story.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialStory, storyId]);

  // Cache loaded story for refresh
  useEffect(() => {
    if (!story?.id) return;
    try {
      sessionStorage.setItem(`bhaskar_story_${story.id}`, JSON.stringify(story));
    } catch {
      // ignore
    }
  }, [story]);

  const url = safeBhaskarUrl(story);

  return (
    <PageLayout>
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Top bar */}
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                title="Open full story on Bhaskar"
              >
                Read on Bhaskar
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {loading ? (
            <div className="p-5 sm:p-6">
              <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-gray-100 rounded mt-3 animate-pulse" />
              <div className="h-48 sm:h-64 bg-gray-100 rounded-xl mt-5 animate-pulse" />
              <div className="h-3 w-full bg-gray-100 rounded mt-5 animate-pulse" />
              <div className="h-3 w-5/6 bg-gray-100 rounded mt-3 animate-pulse" />
            </div>
          ) : error ? (
            <div className="p-5 sm:p-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : !story ? (
            <div className="p-5 sm:p-6">
              <p className="text-sm text-gray-600">Story not found.</p>
            </div>
          ) : (
            <>
              {/* Hero (full image, no crop) */}
              <div className="relative h-72 sm:h-[420px] bg-black overflow-hidden">
                {story.image ? (
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/85">
                    {story.location && (
                      <span className="inline-flex items-center rounded-full bg-white/15 ring-1 ring-white/20 px-2 py-0.5 backdrop-blur">
                        {story.location}
                      </span>
                    )}
                    {story.publishTime && (
                      <span className="text-white/75">
                        {formatTime(story.publishTime)}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-white leading-snug">
                    {story.title}
                  </h1>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    This is a Bhaskar story preview inside KRUPDATES. For the complete article content, open the full story.
                  </p>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-extrabold hover:bg-indigo-700 active:scale-[0.99] transition-all"
                    >
                      Read full story on Bhaskar
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}


