// Vercel Edge Middleware to intercept bot requests for OG tags
// This runs at the edge before rewrites, allowing us to route bots to the OG API

export default function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check if it's a bot request
  const isBot = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|whatsapp|WhatsAppBot|Googlebot|bingbot|Slackbot|Applebot|Discordbot|TelegramBot|SkypeUriPreview|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|ia_archiver/i.test(userAgent);
  
  // If it's a bot and it's a post URL, rewrite to OG API
  if (isBot && url.pathname.startsWith('/post/')) {
    const slug = url.pathname.replace('/post/', '').split('/')[0].split('?')[0];
    const newUrl = new URL(request.url);
    newUrl.pathname = '/api/og';
    newUrl.searchParams.set('slug', slug);
    newUrl.searchParams.set('originalPath', url.pathname);
    
    return Response.rewrite(newUrl);
  }
  
  // For all other requests, continue normally
  return;
}

