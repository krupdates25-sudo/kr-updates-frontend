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
        className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 shadow-md transition-all duration-300 hover:border-slate-300/90 hover:shadow-lg cursor-pointer w-full active:scale-[0.99]"
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
        {/* Accent bar */}
        <div
          className="absolute bottom-0 left-0 top-0 hidden w-1 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)] opacity-90 sm:block"
          aria-hidden
        />
        <div className="flex flex-col sm:flex-row sm:min-h-[11.5rem]">
          {item?.imageUrl ? (
            <div className="relative w-full sm:w-[min(40%,13.5rem)] shrink-0 p-0 sm:p-4 sm:pl-5 sm:pr-2">
              <div className="relative w-full aspect-[16/10] max-h-[min(48vh,260px)] sm:max-h-none sm:aspect-[4/5] sm:h-full sm:min-h-[11rem] overflow-hidden rounded-none sm:rounded-2xl bg-slate-100 shadow-inner ring-1 ring-slate-200/80">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent sm:bg-gradient-to-r sm:from-black/10 sm:via-transparent sm:to-transparent"
                  aria-hidden
                />
              </div>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-4 sm:px-5 sm:py-5 sm:pl-3">
            {item.title ? (
              <div className="w-full text-center sm:px-1">
                <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-slate-800 sm:text-lg line-clamp-2 [text-wrap:balance]">
                  {item.title}
                </h3>
                <div
                  className="mx-auto mt-2 h-0.5 w-10 rounded-full bg-[var(--color-primary)]/35"
                  aria-hidden
                />
              </div>
            ) : null}
            {item.message ? (
              <p className="mt-3 text-justify text-sm leading-[1.65] text-slate-600 text-pretty hyphens-auto break-words line-clamp-4 sm:line-clamp-6 sm:text-[15px]">
                {item.message}
              </p>
            ) : null}
            {loc ? (
              <div className="mt-3 flex justify-center gap-1.5 text-xs text-slate-500 sm:mt-4">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="line-clamp-1 text-center font-medium">{loc}</span>
              </div>
            ) : null}
            <p className="mt-3 text-center text-[11px] font-semibold text-[var(--color-primary)] sm:hidden">
              Tap to read full notice
            </p>
          </div>
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
              className="pointer-events-auto flex max-h-[min(92vh,800px)] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 shadow-2xl sm:max-w-lg"
              role="dialog"
              aria-modal="true"
              aria-labelledby="community-notice-sheet-title"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
                <h2
                  id="community-notice-sheet-title"
                  className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  Notice
                </h2>
                <button
                  type="button"
                  onClick={closeSheet}
                  className="shrink-0 rounded-full p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex justify-center pb-1 pt-2 sm:hidden">
                <span className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {sheetItem.imageUrl ? (
                  <div className="bg-slate-100/80 px-3 pb-2 pt-3 sm:px-4 sm:pt-4">
                    <div className="overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-200/80">
                      <img
                        src={sheetItem.imageUrl}
                        alt=""
                        className="max-h-[38vh] w-full object-cover object-center sm:max-h-[42vh]"
                      />
                    </div>
                  </div>
                ) : null}
                <div className="space-y-4 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-4">
                  {sheetItem.title ? (
                    <div className="text-center">
                      <h3 className="text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl [text-wrap:balance]">
                        {sheetItem.title}
                      </h3>
                      <div
                        className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-[var(--color-primary)]/40"
                        aria-hidden
                      />
                    </div>
                  ) : null}
                  {sheetItem.message ? (
                    <p className="text-[15px] leading-[1.75] text-justify text-slate-700 text-pretty hyphens-auto whitespace-pre-wrap break-words sm:text-base">
                      {sheetItem.message}
                    </p>
                  ) : null}
                  {sheetLoc ? (
                    <div className="flex justify-center gap-2 border-t border-slate-200/80 pt-4 text-sm text-slate-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span className="text-center font-medium">{sheetLoc}</span>
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
