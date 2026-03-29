import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';

/**
 * Horizontal carousel for dashboard community notices (obituaries / mixed updates).
 * Mobile: full-width image on top, text below; tap opens a bottom sheet with full content.
 * Desktop (sm+): image left / text right; click opens centered sheet.
 */
const CommunityNoticesCarousel = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [sheetItem, setSheetItem] = useState(null);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setCurrentIndex(0);
  }, [items]);

  useEffect(() => {
    if (!sheetItem) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSheetItem(null);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [sheetItem]);

  useEffect(() => {
    if (!isAutoPlaying || !items || items.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying, items?.length]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  const goToPrevious = (e) => {
    e?.stopPropagation();
    if (!items?.length) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  const goToNext = (e) => {
    e?.stopPropagation();
    if (!items?.length) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 12000);
  };

  useEffect(() => {
    if (!carouselRef.current || !items?.length) return;
    const container = carouselRef.current;
    const w = container.clientWidth;
    if (!w) return;
    container.scrollTo({
      left: currentIndex * w,
      behavior: 'smooth',
    });
  }, [currentIndex, items?.length]);

  if (!items || items.length === 0) return null;

  const openSheet = (item) => setSheetItem(item);
  const closeSheet = () => setSheetItem(null);

  const NoticeCard = ({ item }) => {
    const loc = typeof item?.location === 'string' ? item.location.trim() : '';
    return (
      <article
        className="rounded-xl border border-gray-100 bg-white overflow-hidden flex flex-col sm:flex-row sm:min-h-[10rem] shadow-sm cursor-pointer text-left w-full transition-opacity active:opacity-90 hover:border-slate-200"
        onClick={() => openSheet(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openSheet(item);
          }
        }}
        role="button"
        tabIndex={0}
      >
        {item?.imageUrl ? (
          <div className="relative w-full aspect-[16/10] max-h-[min(52vh,280px)] sm:max-h-none sm:w-44 sm:aspect-auto sm:flex-shrink-0 sm:self-stretch sm:min-h-[9rem] overflow-hidden bg-slate-100">
            <img
              src={item.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="lazy"
            />
          </div>
        ) : null}
        <div className="flex-1 flex flex-col justify-center p-3 sm:p-5 min-w-0">
          {item.title ? (
            <h3 className="text-[15px] sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2">
              {item.title}
            </h3>
          ) : null}
          {item.message ? (
            <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-slate-600 whitespace-pre-wrap break-words line-clamp-4 sm:line-clamp-6">
              {item.message}
            </p>
          ) : null}
          {loc ? (
            <div className="mt-2 sm:mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" aria-hidden />
              <span className="break-words line-clamp-1">{loc}</span>
            </div>
          ) : null}
          <p className="mt-2 text-[11px] font-medium text-[var(--color-primary)] sm:hidden">
            Tap to read full notice
          </p>
        </div>
      </article>
    );
  };

  const sheetLoc =
    sheetItem && typeof sheetItem.location === 'string' ? sheetItem.location.trim() : '';

  return (
    <>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={carouselRef}
          className="flex gap-0 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, index) => (
            <div
              key={item._id || index}
              className="carousel-item snap-start shrink-0 min-w-[100%] max-w-full box-border"
            >
              <NoticeCard item={item} />
            </div>
          ))}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white transition-all"
              aria-label="Previous notice"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white transition-all"
              aria-label="Next notice"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {items.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-[var(--color-primary)] w-8'
                    : 'bg-gray-300 w-1.5 hover:bg-gray-400'
                }`}
                aria-label={`Go to notice ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom sheet (mobile) / small modal (desktop) */}
      {sheetItem && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={closeSheet}
            aria-hidden
          />
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full sm:max-w-lg max-h-[min(92vh,800px)] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
              role="dialog"
              aria-modal="true"
              aria-labelledby="community-notice-sheet-title"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
                <h2
                  id="community-notice-sheet-title"
                  className="text-sm font-semibold text-slate-800"
                >
                  Notice
                </h2>
                <button
                  type="button"
                  onClick={closeSheet}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-600 shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="sm:hidden flex justify-center pt-2 pb-1">
                <span className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
              </div>
              <div className="overflow-y-auto overscroll-contain flex-1 min-h-0">
                {sheetItem.imageUrl ? (
                  <div className="w-full max-h-[38vh] sm:max-h-[42vh] bg-slate-100">
                    <img
                      src={sheetItem.imageUrl}
                      alt=""
                      className="w-full h-full max-h-[38vh] sm:max-h-[42vh] object-cover object-center"
                    />
                  </div>
                ) : null}
                <div className="p-4 sm:p-5 space-y-3">
                  {sheetItem.title ? (
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {sheetItem.title}
                    </h3>
                  ) : null}
                  {sheetItem.message ? (
                    <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
                      {sheetItem.message}
                    </p>
                  ) : null}
                  {sheetLoc ? (
                    <div className="flex items-start gap-2 text-sm text-slate-500 pt-2 border-t border-slate-100">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                      <span>{sheetLoc}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-slate-50/80 sm:hidden">
                <button
                  type="button"
                  onClick={closeSheet}
                  className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CommunityNoticesCarousel;
