/**
 * SEO Utility Functions
 * Helper functions to update meta tags dynamically
 */

export const updateMetaTag = (property, content) => {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

export const updateNameTag = (name, content) => {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

export const updateTitle = (title) => {
  document.title = title;
  updateMetaTag('og:title', title);
  updateNameTag('twitter:title', title);
};

export const updateDescription = (description) => {
  updateNameTag('description', description);
  updateMetaTag('og:description', description);
  updateNameTag('twitter:description', description);
};

export const updateImage = (imageUrl) => {
  updateMetaTag('og:image', imageUrl);
  updateMetaTag('og:image:secure_url', imageUrl);
  updateNameTag('twitter:image', imageUrl);
};

export const updateURL = (url) => {
  updateMetaTag('og:url', url);
  updateNameTag('twitter:url', url);
  // Update canonical link
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
};

/**
 * Set default SEO tags for homepage
 */
export const setHomepageSEO = () => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://krupdates.in';
  
  updateTitle('KRUPDATES - Kishangarh Renwal Updates | Latest News & Breaking News');
  updateDescription('KRUPDATES (Kishangarh Renwal Updates) - Your trusted source for latest news, breaking news, education updates, city news, and local updates from Kishangarh and Renwal. Stay informed with real-time news and updates.');
  updateURL(baseUrl);
  updateImage(`${baseUrl}/favicon.png`);
};

