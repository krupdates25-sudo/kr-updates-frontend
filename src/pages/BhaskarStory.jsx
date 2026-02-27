import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { getStateNewsFeed } from '../services/bhaskarService';

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
        const feed = await getStateNewsFeed();
        const found = feed
          .flatMap((b) => (Array.isArray(b?.stories) ? b.stories : []))
          .find((s) => String(s?.id) === String(storyId));
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

  const url = safeBhaskarUrl(story);

  return (
    <PageLayout>
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <span aria-hidden="true">←</span>
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
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
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
              {story.image ? (
                <div className="h-52 sm:h-72 bg-gray-100 overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="h-52 sm:h-72 bg-gradient-to-br from-gray-50 to-white" />
              )}

              <div className="p-5 sm:p-6">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
                  {story.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {story.location && (
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                      {story.location}
                    </span>
                  )}
                  {story.publishTime && <span>{formatTime(story.publishTime)}</span>}
                </div>

                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    This is a Bhaskar story preview inside KRUPDATES. For the complete article content, open the full story.
                  </p>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 active:scale-[0.99] transition-all"
                    >
                      Read full story on Bhaskar
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


