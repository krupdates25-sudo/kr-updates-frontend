import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { getCricketCategoryFeed, getStateNewsFeed, getStoryDetails } from '../services/bhaskarService';

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

// Ensure Bhaskar asset URLs are absolute (they often return relative paths)
function absolutizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://www.bhaskar.com${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
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
    const [storyDetails, setStoryDetails] = useState(null);
    const [loading, setLoading] = useState(!initialStory);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        if (initialStory) {
            setStory(initialStory);
            return;
        }

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

    // Fetch full story details when story is available
    useEffect(() => {
        let cancelled = false;
        if (!story?.shortUrl) return;

        (async () => {
            try {
                setLoadingDetails(true);
                const details = await getStoryDetails(story.shortUrl);
                if (!cancelled) setStoryDetails(details);
            } catch (e) {
                console.error('Failed to load story details:', e);
                // Don't set error here, just log it - we can still show the preview
            } finally {
                if (!cancelled) setLoadingDetails(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [story?.shortUrl]);

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
            {/* Back bar – same as news page */}
            <div className="bg-white border-b border-gray-200">
                <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
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
            </div>

            {/* Main content – same padding as news page */}
            <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4">
                <div className="max-w-4xl mx-auto">
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
                            {/* Article header card (same pattern as news page) */}
                            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-5 mb-3 sm:mb-4">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                                    {storyDetails?.location?.text && (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                                            {storyDetails.location.text}
                                        </span>
                                    )}
                                    {(storyDetails?.publishTime || story?.publishTime) && (
                                        <span>{formatTime(storyDetails?.publishTime || story.publishTime)}</span>
                                    )}
                                    {storyDetails?.header?.tag && (
                                        <span
                                            className="inline-flex items-center rounded-full px-2 py-0.5 text-white text-xs font-semibold"
                                            style={{ backgroundColor: storyDetails.header.tag.bgColorStart || '#F44336' }}
                                        >
                                            {storyDetails.header.tag.text}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
                                    {storyDetails?.header?.title || story.title}
                                </h1>
                                {storyDetails?.header?.slug && (
                                    <p className="text-base text-gray-600 leading-relaxed">
                                        {storyDetails.header.slug}
                                    </p>
                                )}
                            </div>

                            {/* Featured media: video or image (same style as news page) */}
                            {(() => {
                                const media = storyDetails?.header?.media?.[0];
                                const videoSummary = storyDetails?.videoSummary;
                                const isVideo = media?.type === 'video' || !!videoSummary?.url;
                                const videoUrl = media?.type === 'video'
                                    ? (media?.url || media?.videoUrl || media?.src)
                                    : (videoSummary?.url || videoSummary?.videoUrl);
                                const thumbUrl = media?.thumbUrl || media?.url || videoSummary?.thumbUrl;
                                const imageUrl = !isVideo && (media?.url || media?.thumbUrl || storyDetails?.header?.media?.[0]?.thumbUrl || storyDetails?.videoSummary?.thumbUrl || story?.image);
                                const posterUrl = thumbUrl ? absolutizeUrl(thumbUrl) : '';
                                const finalVideoUrl = videoUrl ? absolutizeUrl(videoUrl) : '';
                                const finalImageUrl = imageUrl ? absolutizeUrl(imageUrl) : (story?.image ? absolutizeUrl(story.image) : '');

                                if (isVideo && finalVideoUrl) {
                                    return (
                                        <div className="mb-3 sm:mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                            <video
                                                src={finalVideoUrl}
                                                controls
                                                className="w-full h-[240px] sm:h-[340px] md:h-[420px] object-cover"
                                                poster={posterUrl || undefined}
                                                playsInline
                                            >
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    );
                                }
                                if (finalImageUrl) {
                                    return (
                                        <div className="mb-3 sm:mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                            <img
                                                src={finalImageUrl}
                                                alt={storyDetails?.header?.title || story.title}
                                                className="w-full h-[240px] sm:h-[340px] md:h-[420px] object-cover"
                                                loading="eager"
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Body */}
                            <div className="p-5 sm:p-6">
                                {loadingDetails ? (
                                    <div className="space-y-4">
                                        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                                        <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
                                        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                                    </div>
                                ) : storyDetails ? (
                                    <div className="space-y-6">
                                        {/* Main Content */}
                                        {storyDetails.templateContent && Array.isArray(storyDetails.templateContent) && (
                                            <div className="prose prose-sm sm:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[var(--color-primary)] prose-strong:text-gray-900">
                                                {storyDetails.templateContent.map((item, idx) => {
                                                    if (item.type === 'paragraph') {
                                                        const text = item.text || '';
                                                        // Simple markup rendering (bold, links)
                                                        let processedText = text;
                                                        if (item.markups && Array.isArray(item.markups)) {
                                                            // Sort markups by start position (reverse for proper replacement)
                                                            const sortedMarkups = [...item.markups].sort((a, b) => b.start - a.start);
                                                            let parts = [text];
                                                            sortedMarkups.forEach((markup) => {
                                                                if (markup.mType === 'bold') {
                                                                    const before = parts[0].substring(0, markup.start);
                                                                    const bold = parts[0].substring(markup.start, markup.end);
                                                                    const after = parts[0].substring(markup.end);
                                                                    parts = [`${before}<strong>${bold}</strong>${after}`, ...parts.slice(1)];
                                                                } else if (markup.mType === 'hyperlink' && markup.url) {
                                                                    const before = parts[0].substring(0, markup.start);
                                                                    const link = parts[0].substring(markup.start, markup.end);
                                                                    const after = parts[0].substring(markup.end);
                                                                    parts = [`${before}<a href="${markup.url}" target="_blank" rel="noreferrer" class="text-indigo-600 hover:underline">${link}</a>${after}`, ...parts.slice(1)];
                                                                }
                                                            });
                                                            processedText = parts[0];
                                                        }
                                                        return (
                                                            <p
                                                                key={idx}
                                                                className="text-gray-800 leading-relaxed mb-4"
                                                                dangerouslySetInnerHTML={{ __html: processedText }}
                                                            />
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        )}

                                        {/* Live Updates Section */}
                                        {storyDetails.blog?.isLive && storyDetails.blog?.updates?.data && (
                                            <div className="mt-8 pt-6 border-t border-gray-200">
                                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                                    {storyDetails.blog.updates.sectionHeader || 'लाइव अपडेट्स'}
                                                </h2>
                                                <div className="space-y-4">
                                                    {storyDetails.blog.updates.data.map((update, idx) => (
                                                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                                <h3 className="text-sm font-semibold text-gray-900">{update.title}</h3>
                                                                {update.createdTime && (
                                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                        {formatTime(update.createdTime)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {update.data && Array.isArray(update.data) && (
                                                                <div className="space-y-2">
                                                                    {update.data.map((item, itemIdx) => {
                                                                        if (item.type === 'paragraph') {
                                                                            return (
                                                                                <p key={itemIdx} className="text-sm text-gray-700 leading-relaxed">
                                                                                    {item.text}
                                                                                </p>
                                                                            );
                                                                        } else if (item.type === 'image' && item.url) {
                                                                            return (
                                                                                <div key={itemIdx} className="my-3">
                                                                                    <img
                                                                                        src={absolutizeUrl(item.url)}
                                                                                        alt={item.text || ''}
                                                                                        className="w-full rounded-lg"
                                                                                        loading="lazy"
                                                                                    />
                                                                                    {item.text && (
                                                                                        <p className="text-xs text-gray-600 mt-2">{item.text}</p>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ) : (
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-600">Loading article content…</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}


