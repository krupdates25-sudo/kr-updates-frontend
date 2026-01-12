import { useMemo, useState } from 'react';

/**
 * OptimisticImage
 * - Shows a lightweight skeleton while loading
 * - Falls back to an inline placeholder UI when the image fails or is missing
 * - Avoids layout shifts by requiring width/height via container sizing
 */
const OptimisticImage = ({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  decoding = 'async',
  draggable = false,
  onClick,
  style,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const effectiveSrc = useMemo(() => {
    if (!src || typeof src !== 'string' || !src.trim()) return '';
    return src.trim();
  }, [src]);

  const shouldShowImg = !!effectiveSrc && !failed;

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      onClick={onClick}
      style={style}
    >
      {/* Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
      )}

      {shouldShowImg ? (
        <img
          src={effectiveSrc}
          alt={alt}
          loading={loading}
          decoding={decoding}
          draggable={draggable}
          className={`w-full h-full ${imgClassName}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-gray-400 select-none">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-70"
            >
              <path
                d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8 14l2.2-2.2a1 1 0 0 1 1.4 0L15 15.2l1.2-1.2a1 1 0 0 1 1.4 0L20 16.4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 9.3a1.1 1.1 0 1 0 0 .01"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span className="mt-1 text-xs font-medium opacity-70">No image</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimisticImage;


